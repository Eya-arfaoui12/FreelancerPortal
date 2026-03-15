import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SidebarChat from "../../../components/features/admin_features/SidebarChat";
import Chat from "../../../components/features/admin_features/Chat";
import axios from "axios";
import io from "socket.io-client";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  auth: {
    token: localStorage.getItem("token"),
  },
  transports: ['websocket', 'polling'],
});

export default function Messaging() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Initialiser Socket.IO
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connecté à Socket.IO:', socket.id);
      socket.emit('join', localStorage.getItem('userId')); // userId stocké après connexion
    });

    socket.on('receiveMessage', (message) => {
      console.log('Nouveau message reçu:', message);
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        // Ajouter le message à la conversation sélectionnée
        setSelectedConversation((prev) => ({
          ...prev,
          messages: [...(prev.messages || []), message],
        }));
      }
    });

    socket.on('updateConversation', (updatedConversation) => {
      console.log('Conversation mise à jour:', updatedConversation);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === updatedConversation.id
            ? { ...conv, lastMessage: updatedConversation.lastMessage, timestamp: updatedConversation.timestamp, unread: updatedConversation.unread }
            : conv
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      );
    });

    socket.on('error', (error) => {
      console.error('Erreur Socket.IO:', error);
      toast.error(error.message || 'Erreur de connexion WebSocket');
    });

    return () => {
      socket.off('connect');
      socket.off('receiveMessage');
      socket.off('updateConversation');
      socket.off('error');
    };
  }, [selectedConversation]);

  // Charger les conversations depuis l'API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/messages/conversations', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.data.success) {
          setConversations(response.data.data);
        } else {
          setError(response.data.error || "Impossible de charger les conversations");
        }
      } catch (err) {
        console.error('Erreur lors du chargement des conversations:', err);
        setError(err.response?.data?.error || "Impossible de charger les conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Gérer la conversation sélectionnée depuis l'état de navigation
  useEffect(() => {
    if (location.state?.selectedConversation) {
      const newConversation = location.state.selectedConversation;
      console.log('Conversation reçue via navigation:', newConversation);

      // Vérifier si la conversation existe déjà
      const existingConversation = conversations.find(conv => conv.id === newConversation.id);

      if (!existingConversation) {
        // Ajouter la nouvelle conversation
        setConversations((prev) => [newConversation, ...prev]);
      }

      // Sélectionner la conversation
      setSelectedConversation({ ...newConversation, messages: [] });

      // Nettoyer l'état de navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation({ ...conversation, messages: [] });
  };

  const handleNewMessage = (conversationId, message) => {
    // Mettre à jour la liste des conversations
    setConversations((prev) =>
      prev
        .map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessage: message.content, timestamp: new Date().toISOString(), unread: conv.id === selectedConversation?.id ? 0 : conv.unread + 1 }
            : conv
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );

    // Ajouter le message à la conversation sélectionnée
    if (selectedConversation && selectedConversation.id === conversationId) {
      setSelectedConversation((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), message],
      }));
    }
  };

  // Créer une conversation de support
  const handleCreateSupportConversation = async () => {
    try {
      const response = await api.post(
        '/messages/conversation',
        { isSupport: true },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        const newConversation = response.data.data;
        setConversations((prev) => [newConversation, ...prev]);
        setSelectedConversation({ ...newConversation, messages: [] });
        toast.success("Conversation avec le support créée");
      } else {
        toast.error(response.data.error || "Impossible de créer la conversation de support");
      }
    } catch (err) {
      console.error('Erreur lors de la création de la conversation de support:', err);
      toast.error(err.response?.data?.error || "Impossible de créer la conversation de support");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Sidebar des conversations */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
        <SidebarChat 
          conversations={conversations}
          onSelectConversation={handleSelectConversation} 
          selectedConversation={selectedConversation}
          onCreateSupportConversation={handleCreateSupportConversation}
        />
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <Chat 
            conversation={selectedConversation} 
            onNewMessage={handleNewMessage}
            socket={socket}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
            <div className="text-center p-6 rounded-lg">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune conversation sélectionnée</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sélectionnez une conversation dans la liste pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}