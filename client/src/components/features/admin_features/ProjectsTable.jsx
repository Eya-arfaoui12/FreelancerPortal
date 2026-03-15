import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Edit3, Trash2, Eye, Clock, DollarSign, Loader, User, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import io from "socket.io-client";

// Global variable to store the socket connection
let globalSocket = null;

export default function ProjectsTable({ onDeleteClick, refreshTrigger }) {
  const navigate = useNavigate();
  const { fetchAPI, currentUser, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedProjects, setExpandedProjects] = useState({});
  const [displayIdCounter, setDisplayIdCounter] = useState(1);
  const socketInitialized = useRef(false);
  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetchAPI("/projects?limit=100");

      if (response.success) {
        setProjects(response.data);
        setDisplayIdCounter(1);
      } else {
        setError(response.error || "Error loading projects");
      }
    } catch (error) {
      setError(error.message || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  // Handle project deletion - MODIFIÉ pour utiliser le popup
  const handleDeleteProject = async (project) => {
    if (onDeleteClick) {
      onDeleteClick(project);
    } else {
      if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
        return;
      }
      await deleteProject(project.id);
    }
  };


  // Fonction de suppression réelle (extraite pour réutilisabilité)
  const deleteProject = async (projectId) => {
    try {
      const response = await fetchAPI(`/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        alert("✅ Project deleted successfully!");
        // Refresh the project list
        await fetchProjects();
      } else {
        throw new Error(response.error || "Error deleting project");
      }
    } catch (error) {
      console.error("❌ Error deleting project:", error);
      // Note: L'erreur sera gérée par le composant parent maintenant
    }
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
      console.error("No authentication token found");
      return;
    }

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
      socketInitialized.current = true;
    });

    globalSocket.on("newNotification", (notification) => {
      console.log("📩 New notification received in ProjectsTable:", notification);
      if (notification.type === "PROPOSAL" && notification.metadata) {
        try {
          const metadata = JSON.parse(notification.metadata || "{}");
          if (metadata.projectId && metadata.action) {
            setProjects((prevProjects) =>
              prevProjects.map((project) =>
                project.id === metadata.projectId
                  ? {
                      ...project,
                      status: metadata.action === "accept" ? "PUBLISHED" : "CANCELLED",
                    }
                  : project
              )
            );
          }
        } catch (err) {
          console.error("Error parsing metadata:", err);
        }
      }
    });

    globalSocket.on("connect_error", (err) => {
      console.error("❌ Socket.IO connection error:", err.message);
    });

    globalSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from Socket.IO. Reason:", reason);
      socketInitialized.current = false;
    });

    globalSocket.on("error", (error) => {
      console.error("❌ Socket.IO error:", error);
    });

    return () => {
      console.log("ProjectsTable unmount - connection maintained");
    };
  }, [currentUser, isAuthenticated]);

  // Fetch projects on mount or user change
   useEffect(() => {
    fetchProjects();
  }, [currentUser, isAuthenticated, refreshTrigger]);

  // Toggle expanded view for a project's freelancers
  const toggleExpandProject = (projectId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { color: "white", label: "Draft", textColor: "text-gray-800", border: "border-gray-300" },
      PUBLISHED: { color: "blue", label: "Published" },
      IN_PROGRESS: { color: "warning", label: "In Progress" },
      COMPLETED: { color: "success", label: "Completed" },
      CANCELLED: { color: "error", label: "Cancelled" },
    };  

    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <Badge size="sm" color={config.color} className={`${config.textColor || ''} ${config.border || ''}`}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US");
  };

  // Function to display user avatar or fallback icon
  const renderAvatar = (freelancer) => {
    if (freelancer.avatar) {
      return (
        <img
          src={freelancer.avatar}
          alt={freelancer.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
          onError={(e) => {
            e.target.style.display = "none";
            const fallback = e.target.nextSibling;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      );
    }

    return (
      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white">
        <User size={16} className="text-indigo-600" />
      </div>
    );
  };

  // Calculate total freelancers count
  const getTotalFreelancersCount = (project) => {
    return (project.assignedFreelancers?.length || 0) + (project.pendingFreelancers?.length || 0);
  };

  // Render freelancer list with status badge
  const renderFreelancerList = (freelancers, status) => {
    if (!freelancers || freelancers.length === 0) return null;

    return freelancers.map((freelancer) => (
      <div key={freelancer.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-b-0">
        <div className="relative">
          {renderAvatar(freelancer)}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
              status === "assigned" ? "bg-green-500" : "bg-yellow-500"
            }`}
          >
            {status === "assigned" ? (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <Clock size={8} className="text-white" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
            {freelancer.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {freelancer.email}
          </div>
        </div>
        <div
          className={`text-xs font-medium ${status === "assigned" ? "text-green-600" : "text-yellow-600"}`}
        >
          {status === "assigned" ? "Assigned" : "Pending"}
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <div className="mx-auto h-12 w-12 text-red-500 mb-4">⚠️</div>
        <p>{error}</p>
        <button
          onClick={fetchProjects}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">
                #
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">
                Project
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">
                Budget & Duration
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">
                Freelancers
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {projects.map((project, index) => {
              const isExpanded = expandedProjects[project.id];
              const totalFreelancers = getTotalFreelancersCount(project);
              const showMoreButton = totalFreelancers > 2;

              return (
                <>
                  <TableRow key={project.id}>
                    <TableCell className="px-5 py-4 text-gray-700 text-sm dark:text-white/90">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">
                        {displayIdCounter + index}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="text-gray-800 font-medium text-sm dark:text-white/90">
                        {project.title}
                      </div>
                      <div className="text-gray-500 text-xs dark:text-gray-400 mt-1">
                        {project.description.substring(0, 60)}...
                      </div>
                      <button
                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                        className="text-indigo-600 text-xs hover:underline mt-1"
                      >
                        View details
                      </button>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <DollarSign size={14} className="mr-1 text-green-600" />
                          {formatCurrency(project.budget)}
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <Clock size={14} className="mr-1 text-blue-600" />
                          {project.duration || "N/A"} days
                        </div>
                        {project.deadline && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Deadline: {formatDate(project.deadline)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        {project.assignedFreelancers?.slice(0, 2).map((freelancer) => (
                          <div key={freelancer.id} className="flex items-center gap-2">
                            <div className="relative">
                              {renderAvatar(freelancer)}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                  <path
                                    d="M1 3L3 5L7 1"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {freelancer.name}
                              </div>
                              <div className="text-xs text-green-600">Assigned</div>
                            </div>
                          </div>
                        ))}
                        {project.pendingFreelancers?.slice(0, 2 - (project.assignedFreelancers?.length || 0)).map(
                          (freelancer) => (
                            <div key={freelancer.id} className="flex items-center gap-2">
                              <div className="relative">
                                {renderAvatar(freelancer)}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                                  <Clock size={8} className="text-white" />
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                                  {freelancer.name}
                                </div>
                                <div className="text-xs text-yellow-600">Pending</div>
                              </div>
                            </div>
                          )
                        )}
                        {(!project.assignedFreelancers || project.assignedFreelancers.length === 0) &&
                          (!project.pendingFreelancers || project.pendingFreelancers.length === 0) && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              No freelancers
                            </div>
                          )}
                        {showMoreButton && (
                          <button
                            onClick={() => toggleExpandProject(project.id)}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                          >
                            <Badge size="sm" color="gray">
                              +{totalFreelancers - 2} more
                            </Badge>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="px-5 py-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/projects/edit/${project.id}`)}
                        className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium py-1.5 px-3 rounded-full shadow-sm transition"
                        title="Edit project"
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project)}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium py-1.5 px-3 rounded-full shadow-sm transition"
                        title="Delete project"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-gray-50 dark:bg-gray-900/20">
                      <TableCell colSpan={6} className="px-5 py-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white/90">
                              Freelancers for: {project.title}
                            </h4>
                            <button
                              onClick={() => toggleExpandProject(project.id)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-6">
                            {project.assignedFreelancers && project.assignedFreelancers.length > 0 && (
                              <div>
                                <h5 className="font-medium text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  Assigned Freelancers ({project.assignedFreelancers.length})
                                </h5>
                                <div className="space-y-2">
                                  {renderFreelancerList(project.assignedFreelancers, "assigned")}
                                </div>
                              </div>
                            )}
                            {project.pendingFreelancers && project.pendingFreelancers.length > 0 && (
                              <div>
                                <h5 className="font-medium text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  Pending Freelancers ({project.pendingFreelancers.length})
                                </h5>
                                <div className="space-y-2">
                                  {renderFreelancerList(project.pendingFreelancers, "pending")}
                                </div>
                              </div>
                            )}
                            {totalFreelancers === 0 && (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <User size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No freelancers assigned to this project</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">📋</div>
            <p className="text-gray-500 dark:text-gray-400">No projects found</p>
            <button
              onClick={() => navigate("/admin/add-project")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create your first project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}