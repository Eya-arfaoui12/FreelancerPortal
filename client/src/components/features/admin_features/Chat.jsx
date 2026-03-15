import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function Chat({ conversation, onNewMessage, socket }) {
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom - use useLayoutEffect to avoid flicker
  useLayoutEffect(() => {
    if (messagesEndRef.current && isScrolledToBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation.messages, isScrolledToBottom]);

  // Detect if user scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setIsScrolledToBottom(isAtBottom);
  };

  // Focus on input when conversation changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Reset scroll to bottom when conversation changes
    setIsScrolledToBottom(true);
  }, [conversation.id]);

  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const messageContent = newMessage.trim();
    if (!messageContent || sending) return;

    setSending(true);
    
    try {
      const result = await onNewMessage(conversation.id, messageContent);
      
      if (result.success) {
        setNewMessage('');
        setIsScrolledToBottom(true); // Force scroll to bottom after sending
        // Keep focus on input after sending
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        toast.error(result.error || 'Unable to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('An error occurred while sending');
    } finally {
      setSending(false);
    }
  };

  // Handle Enter to send (Shift+Enter for new line)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px
    textarea.style.height = `${newHeight}px`;
  };

  // Format display time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = {
          date: messageDate,
          displayDate: new Date(message.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          messages: []
        };
        groups.push(currentGroup);
      }
      
      currentGroup.messages.push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(conversation.messages || []);

  // Scroll to bottom button
  const scrollToBottom = () => {
    setIsScrolledToBottom(true);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      {/* Conversation header - FIXED */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center">
          <img
            src={conversation.avatar}
            alt={conversation.name}
            className="h-12 w-12 rounded-full mr-4 ring-2 ring-gray-200 dark:ring-gray-700 object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {conversation.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {conversation.email}
            </p>
          </div>
          {conversation.isSupport && (
            <span className="flex-shrink-0 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
              Support
            </span>
          )}
        </div>
      </div>

      {/* Messages area - SCROLLABLE */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
          style={{ 
            scrollBehavior: 'smooth',
            overflowAnchor: 'none' // Prevent scroll anchoring issues
          }}
        >
          {messageGroups.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  No messages yet. Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center justify-center mb-4">
                  <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {group.displayDate}
                    </span>
                  </div>
                </div>
                
                {/* Group messages */}
                {group.messages.map((msg, index) => {
                  const isOwnMessage = msg.senderId === currentUser?.id;
                  const prevMessage = index > 0 ? group.messages[index - 1] : null;
                  const showAvatar = !prevMessage || prevMessage.senderId !== msg.senderId;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end space-x-2 mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwnMessage && (
                        <img
                          src={conversation.avatar}
                          alt={conversation.name}
                          className={`h-8 w-8 rounded-full object-cover ${showAvatar ? 'visible' : 'invisible'}`}
                        />
                      )}
                      
                      <div className={`max-w-xs md:max-w-md ${isOwnMessage ? 'order-1' : ''}`}>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>
                        
                        <div className={`mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(msg.createdAt)}
                            {isOwnMessage && (
                              <span className="ml-1">
                                {msg.isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {isOwnMessage && (
                        <img
                          src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.firstName}+${currentUser?.lastName}&background=3b82f6&color=fff`}
                          alt="You"
                          className={`h-8 w-8 rounded-full object-cover ${showAvatar ? 'visible' : 'invisible'}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          {sending && (
            <div className="flex justify-end mb-2">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-md opacity-70">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Reference for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Scroll to bottom button */}
        {!isScrolledToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Input area - FIXED */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              disabled={sending}
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              rows={1}
              style={{ 
                minHeight: '48px',
                maxHeight: '120px',
                overflowY: 'auto'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

Chat.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    isSupport: PropTypes.bool,
    messages: PropTypes.array
  }).isRequired,
  onNewMessage: PropTypes.func.isRequired,
  socket: PropTypes.object,
};