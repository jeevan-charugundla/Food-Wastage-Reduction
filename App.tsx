import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AddFood from './pages/admin/AddFood';
import PredictionDashboard from './pages/admin/PredictionDashboard';
import NgoDashboard from './pages/ngo/NgoDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentHistory from './pages/student/StudentHistory';
import { UserRole } from './types';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-orange-600 font-medium">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const getDashboardRoute = () => {
    if (user?.role === UserRole.ADMIN) return "/admin/dashboard";
    if (user?.role === UserRole.NGO) return "/ngo/dashboard";
    if (user?.role === UserRole.STUDENT) return "/student/dashboard";
    return "/login";
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDashboardRoute()} /> : <Login />} />
      
      {/* Root Redirect based on Role */}
      <Route path="/" element={<Navigate to={getDashboardRoute()} />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={[UserRole.ADMIN]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/add-food" element={
        <ProtectedRoute roles={[UserRole.ADMIN]}>
          <AddFood />
        </ProtectedRoute>
      } />
      <Route path="/admin/prediction" element={
        <ProtectedRoute roles={[UserRole.ADMIN]}>
          <PredictionDashboard />
        </ProtectedRoute>
      } />

      {/* NGO Routes */}
      <Route path="/ngo/dashboard" element={
        <ProtectedRoute roles={[UserRole.NGO]}>
          <NgoDashboard />
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute roles={[UserRole.STUDENT]}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/history" element={
        <ProtectedRoute roles={[UserRole.STUDENT]}>
          <StudentHistory />
        </ProtectedRoute>
      } />

      {/* Catch all - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;