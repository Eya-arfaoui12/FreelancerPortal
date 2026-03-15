import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Award, 
  Globe, 
  Linkedin, 
  Github, 
  Star,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  MessageCircle,
  FileText,
  BookOpen,
  Ribbon,
  Target,
  Zap,
  Languages,
  Building,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  User,
  Clock4,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../utils/upload';
import { ProfileUpdateContext } from '../../pages/dashboards/freelancer/FreelancerMissions';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditPersonalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchAPI, currentUser, updateCurrentUser } = useAuth();
  const { updateTrigger, setUpdateTrigger } = useContext(ProfileUpdateContext);
  
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteField, setDeleteField] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const avatarPreviewRef = useRef(null);

  useEffect(() => {
    fetchFreelancerData();
  }, [id, updateTrigger]);

  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
        avatarPreviewRef.current = null;
      }
    };
  }, []);

  const fetchFreelancerData = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI(`/freelancers/${id}`);
      console.log('Fetched freelancer data:', data);
      setFreelancer({
        ...data,
        totalMissions: data.totalMissions || 0,
        completedMissions: data.completedMissions || 0,
        activeMissions: data.activeMissions || 0,
      });
      setAvatarPreview(data.avatar);
      setError(null);
    } catch (err) {
      console.error('Error loading freelancer profile:', err);
      setError('Failed to load freelancer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must not exceed 5 MB');
        return;
      }
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      avatarPreviewRef.current = previewUrl;
      setAvatarPreview(previewUrl);
      setError('');
    }
  };

  const generateAvatar = (firstName, lastName, avatar) => {
    const avatarUrl = avatarPreview || avatar;
    if (avatarUrl) {
      const src = avatarUrl.startsWith('blob:') ? avatarUrl : `${avatarUrl}?t=${Date.now()}`;
      return (
        <img 
          src={src} 
          alt={`${firstName} ${lastName}`} 
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }

    const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    return (
      <div className="flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-4xl border-4 border-white shadow-lg">
        {initials}
      </div>
    );
  };

  const startEditing = (field, value) => {
    setEditingField(field);
    const safeValue = Array.isArray(value) ? value.join(', ') : value || '';
    setEditValue(safeValue);
    setSuccessMessage('');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
    if (editingField === 'avatar' && avatarFile) {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
        avatarPreviewRef.current = null;
      }
      setAvatarFile(null);
      setAvatarPreview(freelancer.avatar);
    }
  };

  const handleSave = async (field, value) => {
    try {
      setIsSaving(true);
      setSuccessMessage('');

      let updateData = {};
      
      const fieldMapping = {
        'firstName': 'firstName',
        'lastName': 'lastName', 
        'jobTitle': 'title',
        'email': 'email',
        'phone': 'phone',
        'location': 'location',
        'hourlyRate': 'hourlyRate',
        'experience': 'experience',
        'skills': 'skills',
        'portfolio': 'portfolioUrl',
        'linkedin': 'linkedinUrl',
        'github': 'githubUrl',
        'availability': 'availability',
        'languages': 'languages',
        'education': 'education',
        'certifications': 'certifications',
        'avatar': 'avatar'
      };

      const backendField = fieldMapping[field] || field;
      
      const userFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'avatar'];
      const isUserField = userFields.includes(field);
      
      if (field === 'avatar' && avatarFile) {
        setUploadingAvatar(true);
        const avatarUrl = await uploadToCloudinary(avatarFile);
        updateData[backendField] = avatarUrl;
        setUploadingAvatar(false);
        setAvatarFile(null);
        if (avatarPreviewRef.current) {
          URL.revokeObjectURL(avatarPreviewRef.current);
          avatarPreviewRef.current = null;
        }
        setAvatarPreview(avatarUrl);
      } else if (isUserField) {
        updateData[backendField] = value;
      } else {
        updateData[backendField] = field === 'skills' || field === 'languages' || field === 'education' || field === 'certifications' 
          ? value.split(',').map(item => item.trim()).filter(item => item)
          : field === 'hourlyRate' || field === 'experience'
          ? parseFloat(value) || 0
          : field === 'availability'
          ? value.toLowerCase()
          : value;
      }

      console.log('Sending update data:', updateData);

      const response = await fetchAPI(`/freelancers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Backend response:', response);

      if (response.freelancer) {
        setFreelancer({
          ...response.freelancer,
          totalMissions: response.freelancer.totalMissions || 0,
          completedMissions: response.freelancer.completedMissions || 0,
          activeMissions: response.freelancer.activeMissions || 0,
        });
        if (field === 'avatar') {
          setAvatarPreview(response.freelancer.avatar);
        }
        const updatedUserData = {
          ...currentUser,
          [field]: field === 'jobTitle' ? response.freelancer.title : response.freelancer[field],
        };
        console.log('Updated data for currentUser:', updatedUserData);
        updateCurrentUser(updatedUserData);
        setSuccessMessage('Changes saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }

      setEditingField(null);
      setEditValue('');

    } catch (error) {
      console.error('Error saving changes:', error);
      setError('Failed to save changes: ' + (error.message || 'Unknown error'));
      if (field === 'avatar') {
        if (avatarPreviewRef.current) {
          URL.revokeObjectURL(avatarPreviewRef.current);
          avatarPreviewRef.current = null;
        }
        setAvatarPreview(freelancer.avatar);
        setAvatarFile(null);
      }
    } finally {
      setIsSaving(false);
      setUploadingAvatar(false);
    }
  };

  const markMissionAsCompleted = async (missionId) => {
    try {
      setIsSaving(true);
      const response = await fetchAPI(`/missions/${missionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.success) {
        setFreelancer(prev => ({
          ...prev,
          missions: prev.missions.map(mission =>
            mission.id === missionId ? { ...mission, status: 'completed' } : mission
          ),
          completedMissions: prev.completedMissions + 1,
          activeMissions: prev.activeMissions - 1,
        }));
        setUpdateTrigger(Date.now());
        toast.success('Mission marked as completed!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(response.error || 'Failed to update mission status', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Error updating mission status:', error);
      toast.error(`Failed to update mission: ${error.message}`, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteField || deleteIndex === null) return;

    const newValues = [...freelancer[deleteField]];
    newValues.splice(deleteIndex, 1);
    await handleSave(deleteField, newValues.join(', '));
    setShowConfirmDelete(false);
    setDeleteField(null);
    setDeleteIndex(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setDeleteField(null);
    setDeleteIndex(null);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={16} 
          className={i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"} 
        />
      );
    }
    return stars;
  };

  const renderEditableField = (field, value, IconComponent, type = 'text') => {
    const isEditing = editingField === field;
    
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          {IconComponent && <IconComponent size={18} className="text-gray-400" />}
          {isEditing ? (
            field === 'avatar' ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                  {uploadingAvatar ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : avatarPreview ? (
                    <img 
                      src={avatarPreview}
                      alt="Avatar Preview" 
                      className="w-16 h-16 object-cover rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center text-gray-400">
                      <User size={24} />
                    </div>
                  )}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400" style={{ display: 'none' }}>
                    <User size={24} />
                  </div>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isSaving || uploadingAvatar}
                  />
                  <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {uploadingAvatar ? "Uploading..." : "Choose an image"}
                  </div>
                </label>
              </div>
            ) : (
              <input
                type={type}
                value={editValue || ''}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-gray-900 dark:text-white"
                autoFocus
              />
            )
          ) : (
            <span className="text-gray-900 dark:text-white">
              {field === 'avatar' ? (
                <div className="flex items-center gap-3">
                  <img 
                    src={value ? `${value}?t=${Date.now()}` : ''} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400">
                    <User size={16} />
                  </div>
                </div>
              ) : (
                Array.isArray(value) ? value.join(', ') : value || 'Not set'
              )}
            </span>
          )}
        </div>
        
        {isEditing ? (
          <div className="flex gap-1">
            <button
              onClick={() => handleSave(field, editValue)}
              disabled={isSaving || (field === 'avatar' && !avatarFile)}
              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              <Save size={16} />
            </button>
            <button
              onClick={cancelEditing}
              disabled={isSaving}
              className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => startEditing(field, value)}
            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
            disabled={isSaving}
          >
            <Edit size={16} />
          </button>
        )}
      </div>
    );
  };

  const renderNonEditableField = (value, IconComponent) => {
    return (
      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          {IconComponent && <IconComponent size={18} className="text-gray-400" />}
          <span className="text-gray-900 dark:text-white">
            {Array.isArray(value) ? value.join(', ') : value || 'Not set'}
          </span>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: "Completed", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      'in-progress': { label: "In Progress", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      pending: { label: "Pending", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      'on-hold': { label: "On Hold", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      draft: { label: "Draft", class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
      cancelled: { label: "Cancelled", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    };
    
    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  // const getPriorityBadge = (priority) => {
  //   const priorityConfig = {
  //     high: { label: "High", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  //     medium: { label: "Medium", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  //     low: { label: "Low", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  //   };
    
  //   const config = priorityConfig[priority.toLowerCase()] || priorityConfig.medium;
  //   return (
  //     <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
  //       {config.label}
  //     </span>
  //   );
  // };

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

  const canEdit = currentUser?.id === id || currentUser?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !freelancer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate(canEdit ? '/freelancer/overview' : '/admin/freelancers')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Freelancer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
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
      <div className="max-w-6xl mx-auto px-4">
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {successMessage}
          </div>
        )}

        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Deletion
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this item? This action is irreversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(canEdit ? '/freelancer/overview' : '/admin/freelancers')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <div className="flex flex-col items-center">
              {generateAvatar(freelancer.firstName, freelancer.lastName, freelancer.avatar)}
              
              {canEdit && (
                <div className="mt-4">
                  {renderEditableField('avatar', freelancer.avatar, User)}
                </div>
              )}
              
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  freelancer.availability === 'AVAILABLE' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : freelancer.availability === 'BUSY' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {freelancer.availability}
                </div>
                
                {freelancer.isVerified && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">
                    <CheckCircle size={12} />
                    Verified
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              {canEdit ? (
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex gap-2">
                      {renderEditableField('firstName', freelancer.firstName, User, 'text')}
                      {renderEditableField('lastName', freelancer.lastName, User, 'text')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {freelancer.firstName} {freelancer.lastName}
                  </h1>
                </div>
              )}
              
              {canEdit ? (
                <div className="mb-6">
                  {renderEditableField('jobTitle', freelancer.jobTitle, Briefcase)}
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-xl text-indigo-600 dark:text-indigo-400 font-semibold">
                    {freelancer.jobTitle || 'Professional Freelancer'}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {renderStars(freelancer.rating || 0)}
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(freelancer.rating || 0).toFixed(1)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({freelancer.reviewCount || 0} reviews)
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {freelancer.totalMissions || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {freelancer.completedMissions || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {freelancer.activeMissions || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {freelancer.successRate || 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
          <div className="flex overflow-x-auto">
            {['profile', 'skills', 'projects', 'reviews', 'education'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h3>
                  
                  {canEdit ? renderEditableField('email', freelancer.email || '', Mail) : renderNonEditableField(freelancer.email || '', Mail)}
                  {canEdit ? renderEditableField('phone', freelancer.phone || '', Phone) : renderNonEditableField(freelancer.phone || '', Phone)}
                  {canEdit ? renderEditableField('location', freelancer.location || '', MapPin) : renderNonEditableField(freelancer.location || '', MapPin)}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Professional Information</h3>
                  
                  {canEdit ? renderEditableField('hourlyRate', freelancer.hourlyRate || 0, DollarSign, 'number') : renderNonEditableField(freelancer.hourlyRate || 0, DollarSign)}
                  {canEdit ? renderEditableField('experience', freelancer.experience || 0, Calendar, 'number') : renderNonEditableField(freelancer.experience || 0, Calendar)}
                  {canEdit ? renderEditableField('languages', freelancer.languages || [], Languages) : renderNonEditableField(freelancer.languages || [], Languages)}
                  {canEdit ? renderEditableField('availability', freelancer.availability || '', Clock) : renderNonEditableField(freelancer.availability || '', Clock)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {canEdit ? renderEditableField('portfolio', freelancer.portfolio || '', Globe) : renderNonEditableField(freelancer.portfolio || '', Globe)}
                  {canEdit ? renderEditableField('linkedin', freelancer.linkedin || '', Linkedin) : renderNonEditableField(freelancer.linkedin || '', Linkedin)}
                  {canEdit ? renderEditableField('github', freelancer.github || '', Github) : renderNonEditableField(freelancer.github || '', Github)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Skills & Expertise</h2>
                {canEdit && (
                  <button 
                    onClick={() => startEditing('skills', freelancer.skills || [])}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    disabled={isSaving}
                  >
                    <Plus size={16} />
                    Edit Skills
                  </button>
                )}
              </div>
              
              {editingField === 'skills' ? (
                <div className="mb-4">
                  <textarea
                    value={editValue || ''}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg p-3 text-gray-900 dark:text-white"
                    rows={4}
                    placeholder="Enter skills separated by commas"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSave('skills', editValue || '')}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(freelancer.skills || []).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-900 dark:text-white">{skill}</span>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setDeleteField('skills');
                            setDeleteIndex(index);
                            setShowConfirmDelete(true);
                          }}
                          className="p-1 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete"
                          disabled={isSaving}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Projects</h2>
              {freelancer.missions && freelancer.missions.length > 0 ? (
                <div className="space-y-4">
                  {freelancer.missions.map((mission) => (
                    <div 
                      key={mission.id} 
                      className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {/* Icône de mission à gauche */}
                      <div className="mr-4">
                        <Briefcase size={24} className="text-indigo-600 dark:text-indigo-400" />
                      </div>

                      {/* Contenu principal */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {mission.project || 'Untitled Mission'}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(mission.status)}
                            {/* {getPriorityBadge(mission.priority)} */}
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {mission.description || 'No description provided'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-500 dark:text-gray-400" />
                            <span>{mission.client}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-gray-500 dark:text-gray-400" />
                            <span>{formatCurrency(mission.budget)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-500 dark:text-gray-400" />
                            <span>{mission.hoursSpent}h / {mission.totalHours}h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-500 dark:text-gray-400" />
                            <span className={getDaysUntilDeadline(mission.deadline) < 7 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                              {formatDate(mission.deadline)}
                            </span>
                          </div>
                        </div>

                        {/* Jauge de progression circulaire */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="relative w-16 h-16">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="3"
                              />
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={mission.status === 'completed' ? '#10b981' : '#3b82f6'}
                                strokeWidth="3"
                                strokeDasharray={`${mission.progress}, 100`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                              {mission.progress}%
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                        </div>
                      </div>

                      {/* Action : Mark as Completed */}
                      {mission.status === 'in-progress' && (
                        <div className="ml-4">
                          <button 
                            onClick={() => markMissionAsCompleted(mission.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            disabled={isSaving}
                          >
                            <CheckCircle size={14} />
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase size={32} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 italic">No project assigned yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && freelancer.recentReviews && freelancer.recentReviews.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Client Reviews</h2>
              <div className="space-y-4">
                {freelancer.recentReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={review.client.avatar} 
                        alt={review.client.name}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{review.client.name}</h4>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating || 0)}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{review.comment}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Education & Certifications</h2>
                {canEdit && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEditing('education', freelancer.education || [])}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      disabled={isSaving}
                    >
                      <Edit size={16} />
                      Edit Education
                    </button>
                    <button 
                      onClick={() => startEditing('certifications', freelancer.certifications || [])}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      disabled={isSaving}
                    >
                      <Edit size={16} />
                      Edit Certifications
                    </button>
                  </div>
                )}
              </div>
              
              {editingField === 'education' && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award size={20} />
                    Education
                  </h3>
                  <textarea
                    value={editValue || ''}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg p-3 text-gray-900 dark:text-white"
                    rows={6}
                    placeholder="Enter each education entry on a new line or separated by commas"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSave('education', editValue || '')}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Education'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {editingField === 'certifications' && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Ribbon size={20} />
                    Certifications
                  </h3>
                  <textarea
                    value={editValue || ''}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg p-3 text-gray-900 dark:text-white"
                    rows={6}
                    placeholder="Enter each certification on a new line or separated by commas"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSave('certifications', editValue || '')}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Certifications'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!editingField && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Award size={20} />
                        Education
                      </h3>
                      {canEdit && (
                        <button
                          onClick={() => startEditing('education', freelancer.education || [])}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                          disabled={isSaving}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      )}
                    </div>
                    
                    {freelancer.education && freelancer.education.length > 0 ? (
                      <div className="space-y-3">
                        {freelancer.education.map((edu, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-900 dark:text-white">{edu}</span>
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setDeleteField('education');
                                  setDeleteIndex(index);
                                  setShowConfirmDelete(true);
                                }}
                                className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                title="Delete"
                                disabled={isSaving}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">No education information available.</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Ribbon size={20} />
                        Certifications
                      </h3>
                      {canEdit && (
                        <button
                          onClick={() => startEditing('certifications', freelancer.certifications || [])}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                          disabled={isSaving}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      )}
                    </div>
                    
                    {freelancer.certifications && freelancer.certifications.length > 0 ? (
                      <div className="space-y-3">
                        {freelancer.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-900 dark:text-white">{cert}</span>
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setDeleteField('certifications');
                                  setDeleteIndex(index);
                                  setShowConfirmDelete(true);
                                }}
                                className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                title="Delete"
                                disabled={isSaving}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">No certifications available.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPersonalProfile;