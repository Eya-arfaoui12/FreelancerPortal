import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, refreshCurrentUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Rafraîchir les données utilisateur au montage initial si connecté
  useEffect(() => {
    if (currentUser) {
      refreshCurrentUser();
    }
  }, []); // Exécuter uniquement au montage initial

  // Réinitialiser l'erreur après 5 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getDashboardLink = () => {
    if (currentUser?.role === 'ADMIN') {
      return '/admin/overview';
    } else if (currentUser?.role === 'FREELANCER') {
      return '/freelancer/overview';
    }
    return '/homeDashboard';
  };

  const getProfileLink = () => {
    if (currentUser?.role === 'ADMIN') {
      return '/admin/profile';
    } else if (currentUser?.role === 'FREELANCER') {
      return `/freelancers/edit/${currentUser.id}`;
    }
    return '/profile';
  };

  const getAvatarInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (firstName, lastName) => {
    const name = `${firstName || ''}${lastName || ''}`;
    const colors = [
      'bg-purple-600',
      'bg-blue-600',
      'bg-green-600',
      'bg-pink-600',
      'bg-orange-600',
      'bg-teal-600',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-purple-900 shadow-lg border-b border-purple-500/20">
      <div className="container px-4 2xl:px-20 mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Logo avec Microsoft 3D */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg 
                              flex items-center justify-center shadow-lg transform group-hover:scale-110 
                              transition-all duration-300 rotate-3 group-hover:rotate-6
                              border-2 border-white/20">
                  <span className="text-white font-bold text-xs">MNM</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-lg 
                              transform -rotate-3 group-hover:-rotate-6 transition-all duration-300"></div>
                <div className="absolute top-1 left-2 w-2 h-3 bg-white/30 rounded-full blur-sm 
                              transform group-hover:translate-x-1 transition-transform duration-300"></div>
              </div>
              <span className="text-white font-bold text-xl hidden md:block">
                Consulting
              </span>
            </div>
          </Link>

          {currentUser ? (
            <div className="flex items-center space-x-4">
              {/* Afficher l'erreur si présente */}
              {error && (
                <div className="text-red-300 text-xs max-w-[200px] truncate">
                  {error}
                </div>
              )}

              {/* Dashboard Link */}
              <Link 
                to={getDashboardLink()} 
                className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 
                         transition-colors duration-200 border border-purple-500/30 hover:border-purple-400/50
                         group/dashboard"
              >
                <svg className="w-5 h-5 text-purple-300 group-hover/dashboard:text-white transition-colors" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-white font-medium text-sm">My Dashboard</span>
              </Link>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-600/20 
                           transition-colors duration-200 border border-transparent hover:border-purple-500/30
                           group/profile"
                  disabled={loading}
                >
                  {/* Avatar */}
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar.startsWith('data:') 
                        ? currentUser.avatar 
                        : `${currentUser.avatar}?t=${Date.now()}`
                      }
                      alt={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-purple-400/50 
                              group-hover/profile:border-purple-300/60 transition-colors"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/path/to/fallback-image.png';
                      }}
                    />
                  ) : (
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full 
                                  ${getAvatarColor(currentUser.firstName, currentUser.lastName)} 
                                  text-white font-semibold text-sm border-2 border-white/20
                                  group-hover/profile:border-white/30 transition-colors`}>
                      {getAvatarInitials(currentUser.firstName, currentUser.lastName)}
                    </div>
                  )}
                  
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white group-hover/profile:text-purple-100 transition-colors">
                      {currentUser.firstName || ''} {currentUser.lastName || ''}
                    </p>
                    <p className="text-xs text-purple-300 capitalize group-hover/profile:text-purple-200 transition-colors">
                      {currentUser.role?.toLowerCase() || 'user'}
                    </p>
                    {currentUser.jobTitle && (
                      <p className="text-xs text-purple-200 truncate max-w-[150px]">
                        {currentUser.jobTitle}
                      </p>
                    )}
                  </div>
                  
                  <svg className={`w-4 h-4 text-purple-300 group-hover/profile:text-white transition-colors ${isDropdownOpen ? 'rotate-180' : ''}`} 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-purple-900 rounded-lg shadow-xl border border-purple-500/30
                                animate-fadeIn">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b border-purple-500/20">
                        <p className="text-sm text-white font-medium">Signed in as</p>
                        <p className="text-xs text-purple-300 truncate">{currentUser.email || 'N/A'}</p>
                      </div>
                      
                      <Link
                        to={getProfileLink()}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-white hover:bg-purple-600/30 
                                 rounded-md transition-colors duration-200 group/item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 group-hover/item:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="group-hover/item:translate-x-1 transition-transform">Profile Settings</span>
                      </Link>
                      
                      {/* <button
                        onClick={async () => {
                          await refreshCurrentUser();
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-white hover:bg-purple-600/30 
                                 rounded-md transition-colors duration-200 group/item"
                        disabled={loading}
                      >
                        <svg className="w-4 h-4 group-hover/item:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="group-hover/item:translate-x-1 transition-transform">
                          {loading ? 'Refreshing...' : 'Refresh Profile'}
                        </span>
                      </button> */}
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-white hover:bg-rose-600/30 
                                 rounded-md transition-colors duration-200 mt-1 group/item"
                      >
                        <svg className="w-4 h-4 group-hover/item:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="group-hover/item:translate-x-1 transition-transform">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/signin')}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium 
                         bg-purple-600 hover:bg-purple-700 transition-colors duration-200
                         hover:shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-0.5"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium 
                         bg-gray-700 hover:bg-gray-600 transition-colors duration-200
                         hover:shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Animation CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;