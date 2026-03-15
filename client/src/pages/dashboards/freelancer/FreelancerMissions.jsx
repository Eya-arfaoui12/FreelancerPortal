import React,{ useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Calendar, Clock, DollarSign, AlertCircle, CheckCircle, Clock4, ArrowRight, Briefcase } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Create a context for profile updates
export const ProfileUpdateContext = React.createContext(); // Add export here

export const ProfileUpdateProvider = ({ children }) => {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  return (
    <ProfileUpdateContext.Provider value={{ updateTrigger, setUpdateTrigger }}>
      {children}
    </ProfileUpdateContext.Provider>
  );
};


export default function FreelancerMissions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [missions, setMissions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchAPI, currentUser } = useAuth();
  const { setUpdateTrigger } = useContext(ProfileUpdateContext);

  // Fetch missions on mount
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        const response = await fetchAPI(`/freelancers/${currentUser.id}/missions`);
        if (response.success) {
          setMissions(response.data || []);
          setStats(response.stats || {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            totalRevenue: 0,
          });
        } else {
          toast.error(response.error || "Error fetching missions", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } catch (error) {
        console.error("Error fetching missions:", error);
        toast.error(error.message.includes("Route non trouvée") ? "Route not found" : `Server error: ${error.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchMissions();
    } else {
      console.log('No currentUser ID, skipping fetch');
      setLoading(false);
    }
  }, [currentUser, fetchAPI]);

  // Function to mark a mission as completed
const markMissionAsCompleted = async (missionId) => {
  try {
    setLoading(true);
    const response = await fetchAPI(`/missions/${missionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'completed' }),
    });

    if (response.success) {
      // Update local missions state
      setMissions(missions.map(mission =>
        mission.id === missionId ? { ...mission, status: 'completed' } : mission
      ));
      // Update stats
      setStats(prev => ({
        ...prev,
        completed: prev.completed + 1,
        inProgress: prev.inProgress - 1,
      }));
      // Trigger profile update
      setUpdateTrigger(Date.now());
      // Fetch updated profile data
      const profileResponse = await fetchAPI(`/freelancers/${currentUser.id}`);
      if (profileResponse.success) {
        setFreelancer(profileResponse); // Assurez-vous que le composant parent ou le contexte peut gérer cette mise à jour
      }
      toast.success("Mission marked as completed!", {
        position: "top-right",
        autoClose: 3000,
      });
    } else {
      toast.error(response.error || "Failed to update mission status", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  } catch (error) {
    console.error("Error updating mission status:", error);
    toast.error(`Failed to update mission: ${error.message}`, {
      position: "top-right",
      autoClose: 5000,
    });
  } finally {
    setLoading(false);
  }
};

  // Filtrage des missions
  const filteredMissions = missions.filter(mission => {
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    const matchesSearch = (mission.project || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mission.client || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: "Completed", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      "in-progress": { label: "In Progress", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      pending: { label: "Pending", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      "on-hold": { label: "On Hold", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      draft: { label: "Draft", class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
      cancelled: { label: "Cancelled", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { label: "High", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      medium: { label: "Medium", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      low: { label: "Low", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return Infinity;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Loading missions...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Missions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage all your assigned projects
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Missions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock4 size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DollarSign size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search missions or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <button className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
              <Filter size={16} />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMissions.map((mission) => (
          <div key={mission.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header avec statut et priorité */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                {getStatusBadge(mission.status)}
              </div>
              <div>
                {getPriorityBadge(mission.priority)}
              </div>
            </div>

            {/* Contenu de la mission */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {mission.project}
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {mission.description}
              </p>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">Client:</span>
                <span className="ml-2">{mission.client}</span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{mission.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mission.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <DollarSign size={14} className="mr-1" />
                    <span>Budget:</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(mission.budget)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Clock size={14} className="mr-1" />
                    <span>Time Spent:</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{mission.hoursSpent}h / {mission.totalHours}h</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Calendar size={14} className="mr-1" />
                    <span>Deadline:</span>
                  </div>
                  <span className={`font-medium ${getDaysUntilDeadline(mission.deadline) < 7 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {formatDate(mission.deadline)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/freelancer/mission/${mission.id}`)}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  View Details
                </button>
                {mission.status === 'in-progress' && (
                  <button 
                    onClick={() => markMissionAsCompleted(mission.id)}
                    className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
                <button className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMissions.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Briefcase size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No missions found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "You don't have any missions assigned yet"
            }
          </p>
          <button
            onClick={() => navigate("/freelancer/projects")}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Browse Available Projects
          </button>
        </div>
      )}
    </div>
  );
}