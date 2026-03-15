import { useState } from "react";
import { Link } from "react-router-dom";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "../../context/AuthContext";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  console.log('currentUser:', currentUser); // Debug: Inspect currentUser data

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown(event) {
    setIsOpen(false);
  }

  const handleSignOut = async () => {
    try {
      await logout();
      closeDropdown();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getProfileLink = () => {
    if (!currentUser) {
      console.warn('currentUser is undefined, redirecting to /signin');
      return '/signin';
    }
    
    // ✅ CORRECTION : Ajouter le cas pour ADMIN
    if (currentUser.role === 'ADMIN' && currentUser.id) {
      console.log('Redirecting to admin profile:', `/admin/profile`);
      return `/admin/profile`;
    }
    
    if (currentUser.role === 'FREELANCER' && currentUser.id) {
      console.log('Redirecting to freelancer profile:', `/freelancers/edit/${currentUser.id}`);
      return `/freelancers/edit/${currentUser.id}`;
    }
    
    console.log('Falling back to /profile for other roles or missing id');
    return '/profile';
  };

  // Fonction pour générer un avatar à partir des initiales
  const getAvatarInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Fonction pour générer une couleur d'avatar basée sur le nom
  const getAvatarColor = (firstName, lastName) => {
    const name = `${firstName || ''}${lastName || ''}`;
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="relative">
      {currentUser ? (
        <>
          <button 
            onClick={toggleDropdown}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {/* Avatar - Afficher l'image si elle existe, sinon les initiales */}
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getAvatarColor(currentUser.firstName, currentUser.lastName)} text-white font-semibold text-sm`}>
                {getAvatarInitials(currentUser.firstName, currentUser.lastName)}
              </div>
            )}
            
            {/* Nom de l'utilisateur - caché sur mobile si nécessaire */}
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentUser.firstName || ''} {currentUser.lastName || ''}
            </span>
            
            {/* Icône de flèche */}
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Dropdown isOpen={isOpen} onClose={closeDropdown}>
            {/* En-tête du dropdown avec infos utilisateur */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getAvatarColor(currentUser.firstName, currentUser.lastName)} text-white font-semibold`}>
                    {getAvatarInitials(currentUser.firstName, currentUser.lastName)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser.firstName || ''} {currentUser.lastName || ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser.email || ''}
                  </p>
                  {/* ✅ Afficher le rôle de l'utilisateur */}
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium capitalize">
                    {currentUser.role?.toLowerCase() || 'user'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items du menu */}
            <DropdownItem onItemClick={closeDropdown} to={getProfileLink()}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </DropdownItem>

            {/* <DropdownItem onItemClick={closeDropdown} to="/settings">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </DropdownItem> */}

            {/* <DropdownItem onItemClick={closeDropdown} to="/dashboard">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </DropdownItem> */}

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            <DropdownItem onItemClick={handleSignOut} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </DropdownItem>
          </Dropdown>
        </>
      ) : (
        <Link 
          to="/signin" 
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Sign In
        </Link>
      )}
    </div>
  );
}