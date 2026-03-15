import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarChat from "../../components/features/admin_features/SidebarChat";
import Chat from "../../components/features/admin_features/Chat";
import io from "socket.io-client";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Messaging() {
  const { currentUser, fetchAPI, isAuthenticated } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  console.log('Messaging.jsx render', { userRole: currentUser?.role, locationState: location.state });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('User not authenticated, redirecting to /signin');
      navigate('/signin');
    }
  }, [isAuthenticated, navigate]);

  // Initialize Socket.IO
  useEffect(() => {
    if (!currentUser?.id) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem("token"),
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO:', newSocket.id);
    });

    newSocket.on('receiveMessage', (message) => {
      console.log('New message received via Socket.IO:', message);
      
      // Add message to active conversation if it's the right one
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        setSelectedConversation(prev => ({
          ...prev,
          messages: [...(prev.messages || []), message],
        }));
      }

      // Update conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv.id === message.conversationId
            ? { 
                ...conv, 
                lastMessage: message.content, 
                timestamp: new Date().toISOString(),
                unread: conv.id === selectedConversation?.id ? 0 : (conv.unread || 0) + 1
              }
            : conv
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      );

      // Show notification only if it's not the current user sending
      if (message.senderId !== currentUser.id) {
        toast.info(`New message received`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    });

    newSocket.on('updateConversation', (updatedConversation) => {
      console.log('Conversation updated via Socket.IO:', updatedConversation);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === updatedConversation.id
            ? { 
                ...conv, 
                lastMessage: updatedConversation.lastMessage, 
                timestamp: updatedConversation.timestamp,
                unread: conv.id === selectedConversation?.id ? 0 : updatedConversation.unread
              }
            : conv
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      );
    });

    newSocket.on('error', (error) => {
      console.error('Socket.IO error:', error);
      toast.error(error.message || 'WebSocket connection error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser?.id, selectedConversation?.id]);

  // Load conversations
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const data = await fetchAPI('/messages/conversations');
        if (data.success) {
          setConversations(data.data);
          // No auto-selection - user must click to select a conversation
        } else {
          setError(data.error || "Unable to load conversations");
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError(err.message || "Unable to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser?.id, currentUser?.role, fetchAPI]);

  // Handle conversation from location.state
  useEffect(() => {
    if (!location.state?.selectedConversation) return;

    const newConversation = location.state.selectedConversation;
    console.log('Conversation received via navigation:', newConversation);

    if (selectedConversation?.id !== newConversation.id) {
      const existingConversation = conversations.find(conv => conv.id === newConversation.id);
      if (!existingConversation) {
        setConversations(prev => [newConversation, ...prev]);
      }
      handleSelectConversation(newConversation);
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.selectedConversation, conversations, selectedConversation]);

  // Select conversation and load its messages
  const handleSelectConversation = useCallback(async (conversation) => {
    if (selectedConversation?.id === conversation.id) return;

    try {
      const data = await fetchAPI(`/messages/conversation/${conversation.id}`);
      if (data.success) {
        setSelectedConversation({
          ...conversation,
          messages: data.data
        });

        // Reset unread counter for this conversation
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversation.id
              ? { ...conv, unread: 0 }
              : conv
          )
        );
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Unable to load messages');
    }
  }, [selectedConversation, fetchAPI]);

  // Handle sending a new message
  const handleNewMessage = useCallback(async (conversationId, messageContent) => {
    try {
      const messageData = {
        conversationId,
        content: messageContent.trim(),
      };

      const data = await fetchAPI('/messages', {
        method: 'POST',
        body: JSON.stringify(messageData),
      });

      if (data.success) {
        const newMessage = data.data;
        
        // Add message to active conversation immediately
        setSelectedConversation(prev => {
          if (!prev || prev.id !== conversationId) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMessage],
          };
        });

        // Update conversations list WITHOUT triggering layout re-render
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? { 
                  ...conv, 
                  lastMessage: messageContent.trim(), 
                  timestamp: new Date().toISOString(),
                  unread: 0 // No unread for sender
                }
              : conv
          ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        );

        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(err.message || 'Unable to send message');
      return { success: false, error: err.message };
    }
  }, [selectedConversation, fetchAPI]);

  // Create support conversation
  const handleCreateSupportConversation = async () => {
    if (currentUser?.role !== 'FREELANCER') return;

    try {
      const data = await fetchAPI('/messages/conversation', {
        method: 'POST',
        body: JSON.stringify({ isSupport: true }),
      });
      
      if (data.success) {
        const newConversation = data.data;
        setConversations(prev => [newConversation, ...prev]);
        // No auto-selection - user must click manually
        toast.success("Support conversation created. Click on it to open.");
      } else {
        if (data.error.includes('already exists')) {
          toast.info("You already have a conversation with support");
          // No auto-selection even for existing conversation
        } else {
          toast.error(data.error || "Unable to create support conversation");
        }
      }
    } catch (err) {
      console.error('Error creating support conversation:', err);
      toast.error(err.message || "Unable to create support conversation");
    }
  };

  // Handle user selection from modal
  const handleUserSelect = useCallback(async (userOrConversation) => {
    console.log('=== DEBUG handleUserSelect ===');
    console.log('Object received:', userOrConversation);
    console.log('Type:', typeof userOrConversation);
    console.log('ID:', userOrConversation?.id);
    
    // If it's already an existing conversation, select it
    if (userOrConversation.id && userOrConversation.messages !== undefined) {
      console.log('It\'s an existing conversation, direct selection');
      handleSelectConversation(userOrConversation);
      return;
    }

    // Otherwise, create a new conversation
    try {
      if (!userOrConversation.id) {
        console.error('Missing user ID:', userOrConversation);
        toast.error('Error: Missing user ID');
        return;
      }

      const requestData = { targetId: userOrConversation.id };
      console.log('Request data:', requestData);
      console.log('Request URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/messages/conversation`);

      const data = await fetchAPI('/messages/conversation', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('Server response:', data);

      if (data.success) {
        const newConversation = data.data;
        
        // Check if conversation already exists in the list
        const existingConv = conversations.find(conv => conv.id === newConversation.id);
        if (!existingConv) {
          setConversations(prev => [newConversation, ...prev]);
        }
        
        handleSelectConversation(newConversation);
        toast.success('Conversation created successfully');
      } else {
        throw new Error(data.error || 'Error creating conversation');
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      console.error('Stack trace:', err.stack);
      toast.error('Unable to create conversation: ' + err.message);
    }
  }, [conversations, handleSelectConversation, fetchAPI]);

  // Function to delete a conversation
  const handleDeleteConversation = useCallback(async (conversation) => {
    try {
      console.log('Deleting conversation:', conversation.id);
      
      const data = await fetchAPI(`/messages/conversation/${conversation.id}`, {
        method: 'DELETE',
      });

      console.log('Server response for deletion:', data);

      if (data.success) {
        // Remove conversation from list
        setConversations(prev => prev.filter(conv => conv.id !== conversation.id));
        
        // If it was the selected conversation, deselect it
        if (selectedConversation?.id === conversation.id) {
          setSelectedConversation(null);
        }
        
        toast.success('Conversation deleted successfully');
        
        // Emit via Socket.IO to notify other participants (optional)
        if (socket && conversation.userId) {
          socket.emit('conversationDeleted', {
            conversationId: conversation.id,
            deletedBy: currentUser.id,
            targetUserId: conversation.userId
          });
        }
        
      } else {
        throw new Error(data.error || 'Error during deletion');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Unable to delete conversation: ' + err.message);
    }
  }, [fetchAPI, selectedConversation, currentUser, socket]);

  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          <span className="text-gray-600 dark:text-gray-400 ml-2">Loading conversations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading Error</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex h-[calc(100vh-140px)] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" 
      data-component="Messaging"
      style={{ minHeight: '600px' }}
    >
      {/* Sidebar Chat - FIXED WIDTH */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <SidebarChat 
          conversations={conversations}
          onSelectConversation={handleSelectConversation} 
          selectedConversation={selectedConversation}
          onCreateSupportConversation={currentUser?.role === 'FREELANCER' ? handleCreateSupportConversation : undefined}
          onNewConversation={handleUserSelect}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>
      
      {/* Chat Area - FLEX */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <Chat 
            conversation={selectedConversation} 
            onNewMessage={handleNewMessage}
            socket={socket}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
            <div className="text-center p-8 rounded-lg max-w-md">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
                <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No conversation selected
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Choose a conversation from the list on the left to start chatting, or create a new conversation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}