import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import UserListModal from './UserListModal';

export default function SidebarChat({ 
  conversations, 
  onSelectConversation, 
  selectedConversation, 
  onCreateSupportConversation,
  onNewConversation,
  onDeleteConversation
}) {
  const [search, setSearch] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(search.toLowerCase()) ||
    conv.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const handleUserSelect = (user) => {
    if (onNewConversation) {
      onNewConversation(user);
    }
    setShowUserList(false);
  };

  const handleDropdownToggle = (convId, event) => {
    event.stopPropagation();
    setOpenDropdown(openDropdown === convId ? null : convId);
  };

  const handleDeleteClick = (conversation, event) => {
    event.stopPropagation();
    setConversationToDelete(conversation);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete && onDeleteConversation) {
      onDeleteConversation(conversationToDelete);
    }
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex space-x-2 mb-3">
          {/* + Button to open user list */}
          <button
            onClick={() => setShowUserList(true)}
            className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            title="New conversation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {/* Search bar */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search ? 'No conversations found' : 'No conversations available'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedConversation?.id === conv.id;
            const hasUnread = conv.unread > 0;
            
            return (
              <div
                key={conv.id}
                className={`relative p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors duration-200 ${
                  isSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-r-blue-500' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div 
                  className="flex items-center"
                  onClick={() => onSelectConversation(conv)}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative mr-3">
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="h-12 w-12 rounded-full ring-2 ring-gray-200 dark:ring-gray-700 object-cover"
                    />
                    {hasUnread && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {conv.unread > 9 ? '9+' : conv.unread}
                        </span>
                      </div>
                    )}
                    {conv.isSupport && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Conversation information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`text-sm font-medium truncate ${
                        isSelected 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : hasUnread 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {conv.name}
                        {conv.isSupport && (
                          <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                            Support
                          </span>
                        )}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conv.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        hasUnread 
                          ? 'text-gray-900 dark:text-white font-medium' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {conv.lastMessage || 'No messages'}
                      </p>
                      {hasUnread && (
                        <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown menu (3 dots) */}
                <div className="absolute top-2 right-2" ref={dropdownRef}>
                  <button
                    onClick={(e) => handleDropdownToggle(conv.id, e)}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                    title="Options"
                  >
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {openDropdown === conv.id && (
                    <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="py-1">
                        <button
                          onClick={(e) => handleDeleteClick(conv, e)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete conversation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer with statistics */}
      {conversations.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {filteredConversations.length} displayed{filteredConversations.length > 1 ? '' : ''}
            </span>
            {conversations.some(conv => conv.unread > 0) && (
              <span className="flex items-center">
                <div className="h-2 w-2 bg-red-500 rounded-full mr-1"></div>
                {conversations.reduce((total, conv) => total + conv.unread, 0)} unread{conversations.reduce((total, conv) => total + conv.unread, 0) > 1 ? '' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* User list modal */}
      <UserListModal 
        isOpen={showUserList}
        onClose={() => setShowUserList(false)}
        onUserSelect={handleUserSelect}
        existingConversations={conversations}
      />

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Alert icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                Delete Conversation
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Are you sure you want to delete the conversation with <span className="font-semibold text-gray-700 dark:text-gray-300">{conversationToDelete?.name}</span>?
                <br />
                <br />
                <span className="text-red-600 dark:text-red-400">This action is irreversible and will delete all messages.</span>
              </p>
              
              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

SidebarChat.propTypes = {
  conversations: PropTypes.array.isRequired,
  onSelectConversation: PropTypes.func.isRequired,
  selectedConversation: PropTypes.object,
  onCreateSupportConversation: PropTypes.func,
  onNewConversation: PropTypes.func,
  onDeleteConversation: PropTypes.func,
};