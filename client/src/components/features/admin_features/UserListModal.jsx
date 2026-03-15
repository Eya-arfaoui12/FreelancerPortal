import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function UserListModal({ isOpen, onClose, onUserSelect, existingConversations = [] }) {
  const { fetchAPI, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try messaging route first
      let data;
      try {
        data = await fetchAPI('/users/messaging?limit=100');
      } catch (messagingError) {
        console.log('Messaging route failed, trying search route:', messagingError);
        // If messaging route fails, try search route without query
        data = await fetchAPI('/users/search?limit=100&query=');
      }
      
      if (data.success) {
        // Filter current user and format data
        const filteredUsers = data.data
          .filter(user => user.id !== currentUser?.id)
          .map(user => ({
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            role: user.role || 'CLIENT',
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || '')}+${encodeURIComponent(user.lastName || '')}&background=3b82f6&color=fff`,
            title: user.freelancerProfile?.title || `${user.role === 'FREELANCER' ? 'Freelancer' : 'Client'}`
          }));
        
        setUsers(filteredUsers);
        console.log('Users loaded:', filteredUsers.length);
      } else {
        throw new Error(data.message || 'Error loading data');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.title?.toLowerCase().includes(term)
    );
  });

  // Check if conversation already exists with this user
  const hasExistingConversation = (userId) => {
    return existingConversations.some(conv => 
      conv.userId === userId || 
      (conv.targetId === userId && !conv.isSupport)
    );
  };

  const handleUserSelect = (user) => {
    console.log('User selected:', user);
    
    // User ID validation
    if (!user.id) {
      console.error('Missing user ID:', user);
      return;
    }
    
    onUserSelect(user);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            New Conversation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="mt-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 dark:text-red-400 mb-2">{error}</div>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No users found' : 'No users available'}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors ${
                    hasExistingConversation(user.id) ? 'opacity-50' : ''
                  }`}
                >
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-10 w-10 rounded-full mr-3 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.firstName} {user.lastName}
                      {hasExistingConversation(user.id) && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Existing conversation)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {user.title}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'FREELANCER' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : user.role === 'ADMIN'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {user.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

UserListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUserSelect: PropTypes.func.isRequired,
  existingConversations: PropTypes.array
};