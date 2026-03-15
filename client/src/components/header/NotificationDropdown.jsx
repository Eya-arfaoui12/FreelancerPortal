import { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useAuth } from "../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircle, XCircle, Trash2, AlertTriangle, User, DollarSign, X } from "lucide-react";

// Global variable to store the socket connection
let globalSocket = null;

export default function NotificationDropdown() {
  const { currentUser, isAuthenticated, fetchAPI, error, clearError } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const navigate = useNavigate();
  const socketInitialized = useRef(false);

  // State for confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    type: "", // "accept", "reject", "delete"
    notificationId: null,
    notification: null,
    isProcessing: false
  });

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      clearError();
      setSocketError(null);
    }
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
    clearError();
    setSocketError(null);
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!isAuthenticated()) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/notifications");
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error loading notifications:", err);
      toast.error("Error loading notifications");
      if (err.message.includes("Session expired")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated()) return;
    try {
      const data = await fetchAPI("/notifications/unread-count");
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error loading unread count:", err);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId, e) => {
    if (!isAuthenticated()) return;
    e?.stopPropagation();
    try {
      await fetchAPI(`/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Error marking notification as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated()) return;
    try {
      await fetchAPI("/notifications/mark-all-read", {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      toast.error("Error marking notifications as read");
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId, e) => {
    if (!isAuthenticated()) return;
    e?.stopPropagation();
    
    // Show confirmation modal instead of native confirm
    const notification = notifications.find(n => n.id === notificationId);
    setConfirmationData({
      type: "delete",
      notificationId,
      notification,
      isProcessing: false
    });
    setShowConfirmationModal(true);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    closeDropdown();
    try {
      const metadata = JSON.parse(notification.metadata || "{}");
      if (notification.type === "PROPOSAL" && metadata.projectId) {
        navigate(currentUser?.role === "ADMIN" ? `/admin/projects/${metadata.projectId}` : `/projects/${metadata.projectId}`);
      } else if (metadata.proposalId) {
        navigate(`/proposals/${metadata.proposalId}`);
      }
    } catch (err) {
      console.error("Error reading metadata:", err);
    }
  };

  // Show confirmation modal for proposal actions
  const showProposalActionConfirmation = (notificationId, action, e) => {
    if (!isAuthenticated()) return;
    e?.stopPropagation();

    const notification = notifications.find(n => n.id === notificationId);
    setConfirmationData({
      type: action,
      notificationId,
      notification,
      isProcessing: false
    });
    setShowConfirmationModal(true);
  };

  // Handle confirmed action
  const handleConfirmedAction = async () => {
    const { type, notificationId } = confirmationData;
    
    setConfirmationData(prev => ({ ...prev, isProcessing: true }));

    try {
      if (type === "delete") {
        await fetchAPI(`/notifications/${notificationId}`, {
          method: "DELETE",
        });
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
        setUnreadCount((prev) => Math.max(prev - 1, 0));
        toast.success("Notification deleted successfully");
      } else if (type === "accept" || type === "reject") {
        const response = await fetchAPI(`/notifications/${notificationId}/read`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: type }),
        });

        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));

        toast.success(`Proposal ${type === "accept" ? "accepted" : "rejected"} successfully!`);
      }

      setShowConfirmationModal(false);
      setConfirmationData({
        type: "",
        notificationId: null,
        notification: null,
        isProcessing: false
      });
    } catch (err) {
      console.error(`Error processing ${type} action:`, err);
      toast.error(`Error processing your request`);
      setConfirmationData(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Cancel confirmation
  const cancelConfirmation = () => {
    setShowConfirmationModal(false);
    setConfirmationData({
      type: "",
      notificationId: null,
      notification: null,
      isProcessing: false
    });
  };

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!showConfirmationModal) return null;

    const { type, notification, isProcessing } = confirmationData;
    
    const getModalConfig = () => {
      switch (type) {
        case "accept":
          return {
            icon: CheckCircle,
            title: "Accept Proposal",
            message: "Are you sure you want to accept this proposal?",
            description: "This action will confirm the freelancer for the project and notify them of your decision.",
            confirmButton: "Accept Proposal",
            confirmColor: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
            iconColor: "text-green-600",
            bgColor: "bg-green-50"
          };
        case "reject":
          return {
            icon: XCircle,
            title: "Reject Proposal",
            message: "Are you sure you want to reject this proposal?",
            description: "This action will decline the freelancer's proposal and notify them of your decision.",
            confirmButton: "Reject Proposal",
            confirmColor: "from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700",
            iconColor: "text-red-600",
            bgColor: "bg-red-50"
          };
        case "delete":
          return {
            icon: Trash2,
            title: "Delete Notification",
            message: "Are you sure you want to delete this notification?",
            description: "This action cannot be undone. The notification will be permanently removed.",
            confirmButton: "Delete Notification",
            confirmColor: "from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700",
            iconColor: "text-gray-600",
            bgColor: "bg-gray-50"
          };
        default:
          return {
            icon: AlertTriangle,
            title: "Confirm Action",
            message: "Are you sure you want to proceed?",
            description: "This action will be processed immediately.",
            confirmButton: "Confirm",
            confirmColor: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
            iconColor: "text-blue-600",
            bgColor: "bg-blue-50"
          };
      }
    };

    const config = getModalConfig();
    const IconComponent = config.icon;

    // Extract notification details
    let projectTitle = "";
    let freelancerName = "";
    let projectBudget = "";

    try {
      const metadata = JSON.parse(notification?.metadata || "{}");
      projectTitle = metadata.projectTitle || "Unknown Project";
      freelancerName = metadata.freelancerName || "Unknown Freelancer";
      projectBudget = metadata.projectBudget ? `$${metadata.projectBudget}` : "Not specified";
    } catch (err) {
      console.error("Error parsing metadata:", err);
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className={`p-6 border-b ${config.bgColor} dark:bg-gray-700 rounded-t-2xl`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 ${config.bgColor.replace('bg-', 'bg-')} rounded-full`}>
                <IconComponent size={24} className={config.iconColor} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {config.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {config.message}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {config.description}
            </p>

            {/* Notification Details */}
            {notification && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Freelancer:</strong> {freelancerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                      <path
                        fillRule="evenodd"
                        d="M3 8v7a1 1 0 001 1h12a1 1 0 001-1V8H3zm2 2a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zm5 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Project:</strong> {projectTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Budget:</strong> {projectBudget}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={cancelConfirmation}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 
                       transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmedAction}
              disabled={isProcessing}
              className={`flex-1 px-4 py-3 bg-gradient-to-r ${config.confirmColor} 
                       text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <IconComponent size={18} />
                  {config.confirmButton}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated() || !currentUser?.id || socketInitialized.current) {
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "http://localhost:5000";

    const token = localStorage.getItem("token");

    if (!token) {
      setSocketError("No authentication token found");
      return;
    }

    // Use existing global socket connection if available
    if (globalSocket && globalSocket.connected) {
      console.log("✅ Using existing Socket.IO connection:", globalSocket.id);
      socketInitialized.current = true;
      return;
    }

    console.log("🔄 Initializing Socket.IO connection...");

    globalSocket = io(apiUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: {
        token: token,
        userId: currentUser.id,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    globalSocket.on("connect", () => {
      console.log("✅ Connected to Socket.IO:", globalSocket.id);
      globalSocket.emit("join", currentUser.id);
      setSocketError(null);
      socketInitialized.current = true;
    });

    globalSocket.on("newNotification", (notification) => {
      console.log("📩 New notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    globalSocket.on("connect_error", (err) => {
      console.error("❌ Socket.IO connection error:", err.message);
      setSocketError("Failed to connect to real-time notifications");
      toast.error("Failed to connect to real-time notifications");
    });

    globalSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from Socket.IO. Reason:", reason);
      socketInitialized.current = false;
    });

    globalSocket.on("error", (error) => {
      console.error("❌ Socket.IO error:", error);
      setSocketError("Connection error");
      toast.error("Connection error for notifications");
    });

    // Clean up Socket.IO on unmount
    return () => {
      if (globalSocket && socketInitialized.current) {
        globalSocket.disconnect();
        globalSocket = null;
        socketInitialized.current = false;
        console.log("✅ Socket.IO disconnected properly");
      }
    };
  }, [currentUser, isAuthenticated, navigate]);

  // Fetch notifications and unread count on mount or user change
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [currentUser, isAuthenticated]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            unreadCount === 0 ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      
      {/* Confirmation Modal */}
      <ConfirmationModal />

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications ({unreadCount} unread)
          </h5>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-200 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : socketError ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500 dark:text-red-400">{socketError}</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No notifications</p>
          </div>
        ) : (
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {notifications.map((notification) => {
              let projectBudget = null;
              let action = null;
              let projectTitle = null;
              let projectId = null;
              let freelancerName = null;

              // Parse metadata to extract budget, action, project title, and freelancer name
              try {
                const metadata = JSON.parse(notification.metadata || "{}");
                projectBudget = metadata.projectBudget;
                action = metadata.action;
                projectTitle = metadata.projectTitle;
                projectId = metadata.projectId;
                freelancerName = metadata.freelancerName;
              } catch (err) {
                console.error("Error parsing metadata:", err);
              }

              return (
                <li key={notification.id}>
                  <DropdownItem
                    onItemClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                      notification.isRead ? "opacity-60" : ""
                    }`}
                  >
                    <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                      <img
                        width={40}
                        height={40}
                        src={
                          notification.metadata?.avatar ||
                          currentUser?.avatar ||
                          "/images/user/user-default.jpg"
                        }
                        alt="Notification"
                        className="w-full overflow-hidden rounded-full"
                      />
                      <span
                        className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white ${
                          notification.isRead ? "bg-gray-500" : "bg-success-500"
                        } dark:border-gray-900`}
                      ></span>
                    </span>
                    <span className="block flex-1">
                      <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {notification.title}
                        </span>
                        <span> {notification.message}</span>
                        {/* Display freelancer name for admin notifications */}
                        {freelancerName && currentUser?.role === "ADMIN" && (
                          <div className="mt-1 text-indigo-600 font-semibold text-xs flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
                            </svg>
                            Freelancer: {freelancerName}
                          </div>
                        )}
                        {/* Display project budget */}
                        {projectBudget && (
                          <div className="mt-1 text-green-600 font-semibold text-xs flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                              <path
                                fillRule="evenodd"
                                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5 0a1 1 0 100 2h1a1 1 0 100-2H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Budget: ${projectBudget}
                          </div>
                        )}
                      </span>
                      <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                        <span>{notification.type}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: enUS,
                          })}
                        </span>
                      </span>
                      <div className="flex gap-2 mt-2">
                        {notification.type === "PROPOSAL" &&
                          !notification.isRead &&
                          currentUser?.role !== "ADMIN" && (
                            <>
                              <button
                                onClick={(e) => showProposalActionConfirmation(notification.id, "accept", e)}
                                className="text-xs text-green-500 hover:text-green-600 flex items-center gap-1"
                              >
                                <CheckCircle size={12} />
                                Accept
                              </button>
                              <button
                                onClick={(e) => showProposalActionConfirmation(notification.id, "reject", e)}
                                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                              >
                                <XCircle size={12} />
                                Reject
                              </button>
                            </>
                          )}
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </span>
                  </DropdownItem>
                </li>
              );
            })}
          </ul>
        )}
      </Dropdown>

      {/* ToastContainer for improved UX notifications */}
      <ToastContainer />
    </div>
  );
}