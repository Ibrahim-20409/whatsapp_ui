import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { apiService, wsService } from "./services/api";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(apiService.getUser());
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadChats();
      connectWebSocket();
    }

    return () => {
      wsService.disconnect();
    };
  }, [user]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const userChats = await apiService.getChats(user.id);
      
      // Transform backend data to frontend format
      const transformedChats = await Promise.all(
        userChats.map(async (chat) => {
          const messages = await apiService.getChatMessages(chat.id);
          return {
            id: chat.id,
            name: chat.type === 'private' ? getPrivateChatName(chat, user.id) : chat.name,
            type: chat.type,
            avatar: chat.type === 'private' ? getPrivateChatAvatar(chat, user.id) : chat.avatar,
            participants: chat.participants,
            messages: messages.map(msg => ({
              text: msg.text,
              sender: msg.sender_id === user.id ? 'Me' : msg.sender_name,
              time: formatTime(msg.timestamp),
              senderId: msg.sender_id
            }))
          };
        })
      );

      setChats(transformedChats);
      if (transformedChats.length > 0 && !activeChatId) {
        setActiveChatId(transformedChats[0].id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrivateChatName = (chat, currentUserId) => {
    // For private chats, show the other participant's name
    const otherParticipant = chat.participants.find(p => p !== currentUserId);
    return chat.name; // Backend should handle this
  };

  const getPrivateChatAvatar = (chat, currentUserId) => {
    return chat.avatar;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const connectWebSocket = () => {
    wsService.connect(user.id);
    
    wsService.onMessage((data) => {
      if (data.type === 'new_message') {
        const message = data.message;
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === message.chat_id
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      text: message.text,
                      sender: message.sender_id === user.id ? 'Me' : message.sender_name,
                      time: formatTime(message.timestamp),
                      senderId: message.sender_id
                    }
                  ]
                }
              : chat
          )
        );
      } else if (data.type === 'typing') {
        // Handle typing indicators
        console.log('Typing:', data);
      }
    });
  };

  const handleSendMessage = (chatId, text) => {
    wsService.sendMessage(chatId, text);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    apiService.logout();
    wsService.disconnect();
    setUser(null);
    setChats([]);
    setActiveChatId(null);
  };

  const activeChat = chats.find(chat => chat.id === activeChatId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/chat" replace /> : <LoginPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            user ? <Navigate to="/chat" replace /> : <SignUpPage />
          } 
        />
        <Route 
          path="/forgot" 
          element={
            user ? <Navigate to="/chat" replace /> : <ForgotPasswordPage />
          } 
        />
        <Route
          path="/chat"
          element={
            user ? (
              <div className="flex h-screen">
                <Sidebar
                  chats={chats}
                  activeChatId={activeChatId}
                  onSelectChat={setActiveChatId}
                  user={user}
                  onLogout={handleLogout}
                />
                <ChatWindow
                  chat={activeChat}
                  onSendMessage={(text) => handleSendMessage(activeChatId, text)}
                  currentUser={user}
                />
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}