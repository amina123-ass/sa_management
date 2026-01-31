import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { Block } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    if (user?.role?.name === 'admin_si') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Block sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          
          <Typography component="h1" variant="h4" gutterBottom>
            Accès non autorisé
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Typography>

          {user && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connecté en tant que: <strong>{user.full_name}</strong>
              <br />
              Rôle: <strong>{user.role?.display_name || 'Aucun rôle'}</strong>
            </Typography>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleGoBack}
            >
              Retour au tableau de bord
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleLogout}
            >
              Se déconnecter
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;