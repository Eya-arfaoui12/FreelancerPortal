import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const ViewFreelancerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchAPI } = useAuth();
  
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchFreelancerData();
  }, [id]);

  const fetchFreelancerData = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI(`/freelancers/${id}`);
      setFreelancer(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching freelancer:', err);
      setError('Failed to load freelancer profile');
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = (firstName, lastName, avatar) => {
    if (avatar) {
      return (
        <img 
          src={avatar} 
          alt={`${firstName} ${lastName}`} 
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
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

  const renderField = (value, IconComponent) => {
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
            onClick={() => navigate('/admin/freelancers')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Freelancers
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
      <div className="max-w-6xl mx-auto px-4">
        {/* Header avec boutons Back et Edit */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/admin/freelancers')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>Back to Freelancers</span>
          </button>
          
          {/* BOUTON EDIT PROFILE - AJOUTÉ ICI */}
          <button
            onClick={() => navigate(`/admin/freelancers/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Edit size={18} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              {generateAvatar(freelancer.firstName, freelancer.lastName, freelancer.avatar)}
              
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
            
            {/* Info Section */}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {freelancer.firstName} {freelancer.lastName}
                </h1>
              </div>
              
              <div className="mb-6">
                <p className="text-xl text-indigo-600 dark:text-indigo-400 font-semibold">
                  {freelancer.jobTitle || freelancer.title || 'Professional Freelancer'}
                </p>
              </div>
              
              {/* Rating */}
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
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {freelancer.totalMissions || freelancer.totalProjects || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {freelancer.completedMissions || freelancer.completedProjects || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {freelancer.activeMissions || freelancer.activeProjects || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {freelancer.projectsCompleted || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
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

        {/* Main Content - LECTURE SEULE */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h3>
                  {renderField(freelancer.email || '', Mail)}
                  {renderField(freelancer.phone || '', Phone)}
                  {renderField(freelancer.location || '', MapPin)}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Professional Information</h3>
                  {renderField(`$${freelancer.hourlyRate || 0}/hr`, DollarSign)}
                  {renderField(`${freelancer.experience || 0} years`, Calendar)}
                  {renderField(freelancer.languages || [], Languages)}
                  {renderField(freelancer.availability || '', Clock)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderField(freelancer.portfolio || '', Globe)}
                  {renderField(freelancer.linkedin || '', Linkedin)}
                  {renderField(freelancer.github || '', Github)}
                </div>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Skills & Expertise</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(freelancer.skills || []).map((skill, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-center">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Projects</h2>
              {freelancer.missions && freelancer.missions.length > 0 ? (
                <div className="space-y-4">
                  {freelancer.missions.map((mission) => (
                    <div key={mission.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{mission.project || 'Untitled Project'}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          mission.status === 'completed' ? 'bg-green-100 text-green-800' :
                          mission.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {mission.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{mission.description || 'No description'}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Budget: ${mission.budget || 0}</span>
                        <span>Deadline: {mission.deadline || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No projects assigned yet</p>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Client Reviews</h2>
              {freelancer.recentReviews && freelancer.recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {freelancer.recentReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {review.client?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{review.client?.name || 'Client'}</h4>
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
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet</p>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Education & Certifications</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award size={20} />
                  Education
                </h3>
                {freelancer.education && freelancer.education.length > 0 ? (
                  <div className="space-y-3">
                    {freelancer.education.map((edu, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{edu}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No education information available</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Ribbon size={20} />
                  Certifications
                </h3>
                {freelancer.certifications && freelancer.certifications.length > 0 ? (
                  <div className="space-y-3">
                    {freelancer.certifications.map((cert, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{cert}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No certifications available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewFreelancerProfile;