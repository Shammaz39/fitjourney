import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';
import { checkAuthState } from './services/authService';

function App() {
  const [user, setUser] = useState(null);

  // ✅ Check auth state on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // ✅ Load user from storage
    }
    checkAuthState(setUser); // ✅ Listen for auth changes
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <AuthForm type="login" /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <AuthForm type="signUp" /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
