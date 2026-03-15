import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaStar, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa'
import { Loader2 } from 'lucide-react'

// Fonction pour assigner des couleurs aux catégories
const getCategoryColor = (index) => {
  const colors = [
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-green-100 text-green-800",
    "bg-red-100 text-red-800",
    "bg-indigo-100 text-indigo-800",
    "bg-teal-100 text-teal-800",
    "bg-pink-100 text-pink-800",
    "bg-orange-100 text-orange-800",
    "bg-yellow-100 text-yellow-800",
    "bg-cyan-100 text-cyan-800"
  ];
  return colors[index % colors.length];
};

const ExplorePros = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const { fetchAPI } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchAPI('/freelancers/grouped/by-category', {
          method: 'GET',
        });

        if (response.success) {
          // Extraire les catégories et tous les freelancers
          const categoriesData = response.categories || [];
          const allFreelancersData = response.allFreelancers || [];

          // Formater les catégories pour l'affichage
          const formattedCategories = categoriesData.map((cat, index) => ({
            title: cat.title,
            count: cat.count,
            color: getCategoryColor(index),
          }));

          setCategories(formattedCategories);
          setFreelancers(allFreelancersData);
        } else {
          setError('Failed to load freelancers');
        }
      } catch (err) {
        console.error('Error fetching freelancers:', err);
        setError(err.message || 'Failed to load freelancers');
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, [fetchAPI]);

  const filteredFreelancers = useMemo(() => {
    if (selectedCategory === "All") return freelancers;
    return freelancers.filter(f => f.category === selectedCategory);
  }, [selectedCategory, freelancers]);

  const handleViewProfile = (freelancerId) => {
    navigate(`/freelancers/${freelancerId}`);
  };

  const handleBrowseAll = () => {
    navigate('/freelancers');
  };

  if (loading) {
    return (
      <div className="py-16 px-4 lg:px-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 text-lg">Loading experts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 px-4 lg:px-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
            <p className="text-red-600 font-semibold mb-2">Error</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 lg:px-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Browse top Microsoft experts
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with verified professionals specializing in Microsoft technologies
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 
                     ${selectedCategory === "All" 
                       ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                       : "bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50"}`}
          >
            All Experts ({freelancers.length})
          </button>
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => setSelectedCategory(category.title)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 
                       ${selectedCategory === category.title 
                         ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                         : `${category.color} shadow-md hover:shadow-lg hover:opacity-90`}`}
            >
              {category.title} ({category.count})
            </button>
          ))}
        </div>

        {/* Experts grid */}
        {filteredFreelancers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-gray-600 text-lg font-medium mb-2">
                No experts found
              </p>
              <p className="text-gray-500 text-sm">
                Try selecting a different category
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredFreelancers.slice(0, 8).map((freelancer, idx) => (
              <div
                key={freelancer.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 
                           hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                           flex flex-col h-[420px] cursor-pointer"
                onClick={() => handleViewProfile(freelancer.id)}
              >
                <div className="p-5 flex-1 flex flex-col">
                  {/* Header avec image et rating */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      {freelancer.image ? (
                        <img
                          src={freelancer.image}
                          alt={freelancer.name}
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
                    {freelancer.rating > 0 && (
                      <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        <FaStar className="text-yellow-400 mr-1" />
                        {freelancer.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  {/* Informations du profil */}
                  <div className="mb-4 flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
                      {freelancer.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {freelancer.title}
                    </p>
                    
                    <div className="flex items-center text-gray-500 text-xs mb-3">
                      <FaMapMarkerAlt className="mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{freelancer.location}</span>
                    </div>
                    
                    {/* Compétences */}
                    <div className="flex flex-wrap gap-2 mb-4 max-h-16 overflow-hidden">
                      {freelancer.skills.slice(0, 4).map((skill, i) => (
                        <span 
                          key={i} 
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full whitespace-nowrap"
                        >
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{freelancer.skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer avec stats et bouton */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>{freelancer.projects} projects</span>
                      <span className={`font-medium ${
                        freelancer.availability === 'AVAILABLE' ? 'text-green-600' :
                        freelancer.availability === 'BUSY' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {freelancer.availability === 'AVAILABLE' ? 'Available now' :
                         freelancer.availability === 'BUSY' ? 'Busy' :
                         'Unavailable'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProfile(freelancer.id);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 
                                 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 
                                 text-sm font-medium shadow-md hover:shadow-lg"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bouton View All */}
        {filteredFreelancers.length > 0 && (
          <div className="text-center mt-12">
            <button 
              onClick={handleBrowseAll}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
                         text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 
                         transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              Browse all experts
              <FaArrowRight className="ml-2 text-sm transform group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        )}
      </div>

      {/* Styles CSS pour le line-clamp */}
      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default ExplorePros