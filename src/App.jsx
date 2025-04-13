import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';
import WorkoutSelection from './pages/WorkoutSelection';
import { checkAuthState } from './services/authService';
import LogWorkout from "./pages/LogWorkout";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Add loading state

  useEffect(() => {
    const unsubscribe = checkAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false); // ✅ Set loading to false after auth check
    });

    return () => unsubscribe(); // ✅ Cleanup listener on unmount
  }, []);

  if (loading) return <p>Loading...</p>; // ✅ Prevent flickering

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <AuthForm type="login" /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <AuthForm type="signUp" /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/select-workout" element={user ? <WorkoutSelection /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="/log-workout" element={<LogWorkout />} />
      </Routes>
    </Router>
  );
}

export default App;
