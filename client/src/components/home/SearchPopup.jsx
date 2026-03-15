import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, X, Star, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // Ajustez le chemin si nécessaire

const SearchPopup = ({ onClose, title }) => {
  const [loading, setLoading] = useState(true);
  const [freelancers, setFreelancers] = useState([]);
  const [error, setError] = useState(null);
  const { fetchAPI } = useAuth();

  useEffect(() => {
    const searchFreelancers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Appel API pour récupérer tous les freelancers
        const data = await fetchAPI('/freelancers', {
          method: 'GET',
        });

        // Filtrer les freelancers selon le titre de recherche
        let filteredFreelancers = data || [];

        if (title && title.trim()) {
          const searchTerm = title.toLowerCase();
          filteredFreelancers = filteredFreelancers.filter(freelancer => {
            const fullName = `${freelancer.firstName} ${freelancer.lastName}`.toLowerCase();
            const email = (freelancer.email || '').toLowerCase();
            
            return fullName.includes(searchTerm) || email.includes(searchTerm);
          });
        }

        // Filtrer uniquement les freelancers actifs
        filteredFreelancers = filteredFreelancers.filter(f => f.isActive);

        setFreelancers(filteredFreelancers);
      } catch (err) {
        console.error('Error fetching freelancers:', err);
        setError(err.message || 'Failed to load freelancers');
      } finally {
        setLoading(false);
      }
    };

    searchFreelancers();
  }, [title, fetchAPI]);

  const handleFreelancerClick = (freelancerId) => {
    // Fermer le popup et rediriger vers le profil du freelancer
    onClose();
    window.location.href = `/freelancers/${freelancerId}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold mb-2">
            {loading ? 'Searching...' : 'Search Results'}
          </h2>
          {title && (
            <p className="text-blue-100">
              Freelancers matching: <span className="font-semibold">"{title}"</span>
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600 text-lg">
                Searching talent for <span className="font-semibold">'{title}'</span>
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-600 font-semibold mb-2">Error</p>
                <p className="text-red-500 text-sm">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-700 font-medium">
                  {freelancers.length} freelancer{freelancers.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {freelancers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
                    <p className="text-gray-600 text-lg font-medium mb-2">
                      No results found
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      Try adjusting your search terms or browse all freelancers
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {freelancers.map((freelancer, i) => (
                    <motion.div
                      key={freelancer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleFreelancerClick(freelancer.id)}
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            {freelancer.avatar ? (
                              <img
                                src={freelancer.avatar}
                                alt={`${freelancer.firstName} ${freelancer.lastName}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `<span class="text-white text-xl font-bold">${freelancer.firstName?.[0]}${freelancer.lastName?.[0]}</span>`;
                                }}
                              />
                            ) : (
                              <span className="text-white text-xl font-bold">
                                {freelancer.firstName?.[0]}{freelancer.lastName?.[0]}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {freelancer.firstName} {freelancer.lastName}
                              </h3>
                              <p className="text-sm text-gray-500">{freelancer.email}</p>
                            </div>
                            {freelancer.rating > 0 && (
                              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium text-gray-700">
                                  {freelancer.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span className="capitalize">
                                {freelancer.assigned === 'Yes' ? 'Assigned' : 'Available'}
                              </span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              freelancer.assigned === 'Yes' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {freelancer.assigned === 'Yes' ? 'On Project' : 'Open to work'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SearchPopup;