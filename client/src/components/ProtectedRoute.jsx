import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Guards routes that require authentication.
 * Optionally restricts to a specific role.
 *
 * Usage:
 *   <Route element={<ProtectedRoute allowedRole="donor" />}>
 *     <Route path="/donor/dashboard" element={<DonorDashboard />} />
 *   </Route>
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Redirect to their correct dashboard
    const redirectTo = user?.role === 'donor' ? '/donor/dashboard' : '/doctor/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
