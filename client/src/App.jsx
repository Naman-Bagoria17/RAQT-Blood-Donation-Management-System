import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Home — visible to everyone */}
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Donor-only dashboard */}
        <Route
          path="/donor/dashboard"
          element={
            <ProtectedRoute allowedRole="donor">
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Doctor-only dashboard */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
