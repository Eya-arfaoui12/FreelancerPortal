import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  User,
  FileText,
  MessageSquare,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  PenTool,
  Check,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export default function MissionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [mission, setMission] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [signingContract, setSigningContract] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // État pour la modal de suppression
  const fileInputRef = useRef(null);

  // Fetch mission details
  useEffect(() => {
    const fetchMission = async () => {
      try {
        console.log('Fetching mission with ID:', id);
        setLoading(true);
        const response = await api.get(`/missions/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (response.data.success) {
          setMission(response.data.data);
          
          if (response.data.data.projectId) {
            await fetchProjectFiles(response.data.data.projectId);
          }
        } else {
          setError(response.data.error || "Failed to fetch mission details");
        }
      } catch (err) {
        console.error('Error fetching mission:', err);
        setError(err.response?.data?.error || "Failed to fetch mission details");
      } finally {
        setLoading(false);
      }
    };

    fetchMission();
  }, [id]);

  // Fetch project files
  const fetchProjectFiles = async (projectId) => {
    try {
      console.log('Fetching project files for project:', projectId);
      const response = await api.get(`/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.data.success && response.data.data.attachments) {
        console.log('Project files fetched:', response.data.data.attachments);
        setProjectFiles(response.data.data.attachments);
      }
    } catch (err) {
      console.error('Error fetching project files:', err);
    }
  };

  // Update mission progress
  const updateProgress = async (newProgress) => {
    try {
      const response = await api.patch(
        `/missions/${id}`,
        { progress: newProgress },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setMission((prev) => ({
          ...prev,
          progress: response.data.data.progress,
          status: response.data.data.status,
        }));
        toast.success("Progress updated successfully");
      }
    } catch (err) {
      toast.error("Failed to update progress");
    }
  };

  // Handle file upload
  const uploadFile = async (files) => {
    if (!files || files.length === 0) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!mission.projectId) {
      toast.error("No project associated with this mission");
      return;
    }

    const file = files[0];
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "application/zip"];

    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, PNG, JPG, JPEG, and ZIP files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("files", file);

    try {
      setUploading(true);
      const response = await api.post(`/projects/${mission.projectId}/attachments`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const newFiles = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        setProjectFiles((prev) => [...prev, ...newFiles]);
        toast.success("File uploaded successfully");
      }
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle file download
  const downloadFile = async (attachmentId, fileName) => {
    try {
      if (!mission.projectId) {
        toast.error("No project associated with this mission");
        return;
      }

      setDownloading((prev) => ({ ...prev, [attachmentId]: true }));
      
      const response = await api.get(`/projects/${mission.projectId}/attachments/${attachmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${fileName}`);
    } catch (err) {
      toast.error(`Failed to download ${fileName}`);
    } finally {
      setDownloading((prev) => ({ ...prev, [attachmentId]: false }));
    }
  };

  // Handle file deletion
  const deleteFile = async (attachmentId, fileName) => {
    if (!mission.projectId) {
      toast.error("No project associated with this mission");
      return;
    }

    try {
      const response = await api.delete(`/projects/${mission.projectId}/attachments/${attachmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        // Remove the file from local state
        setProjectFiles(prev => prev.filter(file => file.id !== attachmentId));
        toast.success("File deleted successfully");
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error(err.response?.data?.error || "Failed to delete file");
    } finally {
      setDeleteConfirmation(null);
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (file) => {
    setDeleteConfirmation({
      id: file.id,
      name: file.name,
      size: file.size,
      date: file.createdAt
    });
  };

  // Sign contract function
  const submitSignature = async (attachmentId, signatureDataURL) => {
    try {
      const response = await api.patch(`/projects/${mission.projectId}/attachments/${attachmentId}/sign`, {
        signatureData: signatureDataURL,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        // Update the file in the local state to show it's signed
        setProjectFiles(prev => prev.map(file => 
          file.id === attachmentId 
            ? { ...file, freelancerSignature: signatureDataURL, signedAt: new Date() }
            : file
        ));
        toast.success("Contract signed successfully!");
      }
    } catch (err) {
      toast.error("Failed to sign contract");
      console.error('Signature error:', err);
    }
  };

  // Send message
  const sendMessage = async () => {
    try {
      if (!mission?.clientInfo?.id) {
        toast.error("Client information not available");
        return;
      }

      const response = await api.post(
        '/messages/conversation',
        { targetId: mission.clientInfo.id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const conversation = response.data.data;
        navigate('/freelancer/messaging', {
          state: { selectedConversation: conversation },
        });
      }
    } catch (err) {
      toast.error("Unable to start conversation");
    }
  };

  const handleFileChange = (e) => {
    uploadFile(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    uploadFile(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        label: "Completed",
        class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      in_progress: {
        label: "In Progress",
        class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
      pending: {
        label: "Pending",
        class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: {
        label: "High Priority",
        class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
      medium: {
        label: "Medium Priority",
        class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      low: {
        label: "Low Priority",
        class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysUntilDeadline = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if file is a contract
  const isContract = (fileName) => {
    return fileName.toLowerCase().includes('contract') || fileName.toLowerCase().includes('contrat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Mission not found</div>
      </div>
    );
  }

  const truncatedDescription = mission.description.slice(0, 150) + (mission.description.length > 150 ? "..." : "");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/freelancer/missions")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{mission.project}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(mission.status)}
            {getPriorityBadge(mission.priority)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {["overview", "files"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Description</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {showFullDescription ? mission.description : truncatedDescription}
                  </p>
                  {mission.description.length > 150 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium mt-3 flex items-center gap-1"
                    >
                      {showFullDescription ? (
                        <>
                          <ChevronUp size={16} />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          Read more
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Technologies */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technologies</h2>
                  <div className="flex flex-wrap gap-2">
                    {mission.technologies.map((tech, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Progress</h2>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Completion</span>
                      <span>{mission.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${mission.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock size={16} className="mr-2" />
                      <span>Time Spent: {mission.hoursSpent}h</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <DollarSign size={16} className="mr-2" />
                      <span>Budget: {formatCurrency(mission.budget)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "files" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Project Files</h2>
                
                {/* Contract Files Section */}
                {projectFiles.filter(file => isContract(file.name)).length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-yellow-600" />
                      Contracts
                    </h3>
                    <div className="space-y-4">
                      {projectFiles
                        .filter(file => isContract(file.name))
                        .map((file, index) => (
                          <div key={file.id || index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                  <FileText size={20} className="text-yellow-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">{file.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {file.size} • {formatDate(file.createdAt)}
                                  </p>
                                  {file.freelancerSignature ? (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Check size={16} className="text-green-600" />
                                      <span className="text-sm text-green-600 font-medium">Signed on {formatDate(file.signedAt)}</span>
                                    </div>
                                  ) : (
                                    <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                      Awaiting Signature
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => downloadFile(file.id, file.name)}
                                  disabled={downloading[file.id]}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Download contract"
                                >
                                  <Download size={16} />
                                </button>
                                {!file.freelancerSignature && (
                                  <button 
                                    onClick={() => setSigningContract(file)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                                  >
                                    <PenTool size={16} />
                                    Sign Contract
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Other Files Section */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Other Files</h3>
                  <div className="space-y-4">
                    {projectFiles
                      .filter(file => !isContract(file.name))
                      .length > 0 ? (
                      projectFiles
                        .filter(file => !isContract(file.name))
                        .map((file, index) => (
                          <div key={file.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-100 rounded-lg">
                                <FileText size={20} className="text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{file.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {file.size} • {formatDate(file.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => downloadFile(file.id, file.name)}
                                disabled={downloading[file.id]}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Download file"
                              >
                                <Download size={16} />
                              </button>
                              
                              {/* Show delete button for all non-contract files */}
                              <button 
                                onClick={() => showDeleteConfirmation(file)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete file"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No other files found for this project
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Upload Zone */}
                {mission.projectId && (
                  <div
                    className={`mt-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center ${
                      uploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg,.zip"
                      className="hidden"
                    />
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Drag files here or click to upload (PDF, PNG, JPG, JPEG, ZIP; max 10MB)
                    </p>
                    <button
                      onClick={handleBrowseClick}
                      disabled={uploading}
                      className={`mt-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium ${
                        uploading ? "cursor-not-allowed" : "hover:text-indigo-700 dark:hover:text-indigo-300"
                      }`}
                    >
                      {uploading ? "Uploading..." : "Browse files"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{mission.clientInfo.name}</h3>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail size={16} className="mr-2" />
                    <span>{mission.clientInfo.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone size={16} className="mr-2" />
                    <span>{mission.clientInfo.phone}</span>
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <MessageSquare size={16} className="inline mr-2" />
                  Send Message
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Timeline</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Start Date</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(mission.startDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Deadline</span>
                  <span
                    className={`font-medium ${
                      getDaysUntilDeadline(mission.deadline) < 7
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {formatDate(mission.deadline)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Days Remaining</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getDaysUntilDeadline(mission.deadline)} days
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => updateProgress(Math.min(mission.progress + 10, 100))}
                  disabled={mission.status === "completed"}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
                >
                  Update Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal 
        isOpen={signingContract !== null}
        onClose={() => setSigningContract(null)}
        contractFile={signingContract}
        onSubmitSignature={submitSignature}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        file={deleteConfirmation}
        onConfirm={() => deleteFile(deleteConfirmation?.id, deleteConfirmation?.name)}
      />
    </div>
  );
}

// Signature Modal Component
const SignatureModal = ({ isOpen, onClose, contractFile, onSubmitSignature }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signing, setSigning] = useState(false);
  
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    }
  }, [isOpen]);
  
  const startDrawing = (e) => {
    setIsDrawing(true);
    setIsEmpty(false);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  
  const stopDrawing = () => setIsDrawing(false);
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };
  
  const saveSignature = async () => {
    if (isEmpty) {
      toast.error("Please provide a signature");
      return;
    }
    
    setSigning(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataURL = canvas.toDataURL('image/png');
      await onSubmitSignature(contractFile.id, signatureDataURL);
      onClose();
    } catch (error) {
      console.error('Error saving signature:', error);
    } finally {
      setSigning(false);
    }
  };

  // Touch events for mobile support
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY
    };
    startDrawing(mouseEvent);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY
    };
    draw(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    stopDrawing();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Sign Contract: {contractFile?.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Please draw your signature in the box below. This will be added to the contract document.
        </p>
        
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded mb-4 bg-white">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full cursor-crosshair rounded"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <button 
            onClick={clearSignature} 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={signing}
          >
            Clear
          </button>
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={signing}
          >
            Cancel
          </button>
          <button 
            onClick={saveSignature} 
            disabled={isEmpty || signing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {signing ? "Signing..." : "Sign Contract"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, file, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete File
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete this file? This action cannot be undone.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{file?.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {file?.size} • {file?.date ? new Date(file.date).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }) : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete File
          </button>
        </div>
      </div>
    </div>
  );
};