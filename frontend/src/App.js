// src/App.js - Version complète avec 5 pages Réception

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages publiques
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Pages Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import DictionaryManagement from './pages/admin/DictionaryManagement';

// Pages UAS
import CampagnesPage from './pages/uas/CampagnesPage';
import BeneficiairesPage from './pages/uas/BeneficiairesPage';
import KafalaPage from './pages/uas/KafalaPage';
import AssistancesMedicalesPage from './pages/uas/AssistancesMedicalesPage';
import StatistiquesCampagnePage from './pages/uas/StatistiquesCampagnePage';

// Pages Réception - NOUVEAU (5 pages)
import CampagnesReceptionPage from './pages/reception/CampagnesPage';
import ImportExcelPage from './pages/reception/ImportExcelPage';
import GestionAppelsPage from './pages/reception/GestionAppelsPage';
import ParticipantsConfirmesPage from './pages/reception/ParticipantsConfirmesPage';
import ParticipantsNonConfirmesPage from './pages/reception/ParticipantsNonConfirmesPage';

// Layouts
import AdminLayout from './components/layouts/AdminLayout';
import UASLayout from './components/layouts/UASLayout';
import ReceptionLayout from './components/layouts/ReceptionLayout';
import UnauthorizedPage from './pages/UnauthorizedPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    success: {
      main: '#28a745',
    },
    error: {
      main: '#dc3545',
    },
    warning: {
      main: '#ffc107',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Routes Admin */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="roles" element={<RoleManagement />} />
                      <Route path="dictionaries/:type" element={<DictionaryManagement />} />
                      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Routes UAS */}
            <Route
              path="/uas/*"
              element={
                <ProtectedRoute requiredRole="responsable_uas">
                  <UASLayout>
                    <Routes>
                      <Route path="campagnes" element={<CampagnesPage />} />
                      <Route path="beneficiaires" element={<BeneficiairesPage />} />
                      <Route path="kafala" element={<KafalaPage />} />
                      <Route path="assistances-medicales" element={<AssistancesMedicalesPage />} />
                      <Route path="statistiques" element={<StatistiquesCampagnePage />} />
                      <Route path="*" element={<Navigate to="/uas/campagnes" replace />} />
                    </Routes>
                  </UASLayout>
                </ProtectedRoute>
              }
            />

            {/* Routes Réception - NOUVEAU avec 5 pages */}
            <Route
              path="/reception/*"
              element={
                <ProtectedRoute requiredRole="reception">
                  <ReceptionLayout>
                    <Routes>
                      {/* Page 1: Campagnes avec téléchargement Canva */}
                      <Route path="campagnes" element={<CampagnesReceptionPage />} />
                      
                      {/* Page 2: Import Excel */}
                      <Route path="import" element={<ImportExcelPage />} />
                      
                      {/* Page 3: Gestion d'Appels */}
                      <Route path="gestion-appels" element={<GestionAppelsPage />} />
                      
                      {/* Page 4: Participants Confirmés */}
                      <Route path="confirmes" element={<ParticipantsConfirmesPage />} />
                      
                      {/* Page 5: Participants Non Confirmés */}
                      <Route path="non-confirmes" element={<ParticipantsNonConfirmesPage />} />
                      
                      {/* Redirection par défaut */}
                      <Route path="*" element={<Navigate to="/reception/campagnes" replace />} />
                    </Routes>
                  </ReceptionLayout>
                </ProtectedRoute>
              }
            />

            {/* Route par défaut */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;