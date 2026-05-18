import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ActivitiesPage from './pages/ActivitiesPage';
import MatchesPage from './pages/MatchesPage';
import ItineraryPage from './pages/ItineraryPage';
import ProfileSetupPage from './pages/ProfileSetupPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile-setup" element={<PrivateRoute><ProfileSetupPage /></PrivateRoute>} />
        <Route path="/activities" element={<PrivateRoute><ActivitiesPage /></PrivateRoute>} />
        <Route path="/matches" element={<PrivateRoute><MatchesPage /></PrivateRoute>} />
        <Route path="/itinerary/:id" element={<PrivateRoute><ItineraryPage /></PrivateRoute>} />
      </Routes>
    </>
  );
}
