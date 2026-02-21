import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import ConversationList from './components/ConversationList';
import ChatWindow from './components/ChatWindow';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><span className="spinner spinner-lg" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function ChatLayout() {
  const [selectedConv, setSelectedConv] = useState(null);
  const [otherUsername, setOtherUsername] = useState('');

  const handleSelect = (id, username) => {
    setSelectedConv(id);
    setOtherUsername(username || '');
  };

  return (
    <div className="app-layout">
      <ConversationList selectedId={selectedConv} onSelect={handleSelect} />
      <ChatWindow conversationId={selectedConv} otherUsername={otherUsername} />
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <ChatLayout />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
