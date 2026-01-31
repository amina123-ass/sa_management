// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Avatar,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est obligatoire'),
  password: Yup.string().required('Le mot de passe est obligatoire'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');

      const result = await login(values);

      if (result.success) {
        const role = result.user.role?.name;

        console.log('Login successful, role:', role);

        // Redirection selon le rôle
        switch (role) {
          case 'admin_si':
            navigate('/admin/dashboard');
            break;
          case 'responsable_uas':
            navigate('/uas/campagnes');
            break;
          case 'reception':
            navigate('/reception/campagnes');
            break;
          default:
            setError('Aucune page d\'accueil définie pour votre rôle. Contactez l\'administrateur.');
            break;
        }
      } else {
        setError(result.message);
      }

      setSubmitting(false);
    },
  });

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e0e0e0',
          }}
        >
          {/* Header avec Avatar */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#1976d2',
                mb: 2,
              }}
            >
              <LoginIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight={600} color="#1976d2" gutterBottom>
              SA Management
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Connectez-vous à votre compte
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2, 
                mb: 2,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              margin="normal"
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                }
              }}
            />

            <TextField
              fullWidth
              margin="normal"
              id="password"
              name="password"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                backgroundColor: '#1976d2',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Se connecter'
              )}
            </Button>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                mt: 2,
              }}
            >
              <Link
                href="/forgot-password"
                variant="body2"
                sx={{ 
                  cursor: 'pointer',
                  color: '#1976d2',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Mot de passe oublié ?
              </Link>
              <Link 
                href="/register" 
                variant="body2" 
                sx={{ 
                  cursor: 'pointer',
                  color: '#1976d2',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Pas de compte ? S'inscrire
              </Link>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          align="center" 
          sx={{ mt: 4 }}
        >
          © {new Date().getFullYear()} SA Management. Tous droits réservés.
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;