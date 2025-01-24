import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container, CircularProgress, Alert } from '@mui/material';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';
import Journal from './components/Journal';
import MoodChart from './components/MoodChart';
import CalendarView from './components/CalendarView';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError('Authentication error. Please refresh the page.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Router>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Routes>
        {/* Automatic redirect based on auth status */}
        <Route path="/" element={
          <Navigate to={user ? "/auth" : "/auth"} replace />
        } />

        {/* Auth route */}
        <Route path="/auth" element={
          !user ? <Auth /> : <Navigate to="/journal/entries" replace />
        } />

        {/* Protected Journal routes */}
        <Route path="/journal/*" element={
          user ? <Journal /> : <Navigate to="/auth" replace />
        } />

        {/* Additional protected routes */}
        <Route path="/mood-chart" element={
          user ? <MoodChart /> : <Navigate to="/auth" replace />
        } />

        <Route path="/calendar" element={
          user ? <CalendarView /> : <Navigate to="/auth" replace />
        } />

        {/* Catch-all route */}
        <Route path="*" element={
          <Navigate to="/" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;