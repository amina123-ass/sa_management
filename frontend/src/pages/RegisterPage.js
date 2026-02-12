// src/pages/RegisterPage.jsx

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
  Avatar,
  Grid,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const validationSchema = Yup.object({
  nom: Yup.string().required('Le nom est obligatoire'),
  prenom: Yup.string().required('Le prénom est obligatoire'),
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est obligatoire'),
  telephone: Yup.string()
    .matches(/^[+]?[\d\s-()]+$/, 'Numéro de téléphone invalide')
    .required('Le téléphone est obligatoire'),
  adresse: Yup.string().required('L\'adresse est obligatoire'),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      setSuccess(false);

      const result = await register(values);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || 'Une erreur est survenue');
      }

      setSubmitting(false);
    },
  });

  return (
    <Container component="main" maxWidth="md">
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
              <PersonAdd sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight={600} color="#1976d2" gutterBottom>
              SA Management
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Créez votre compte
            </Typography>
          </Box>

          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mt: 2, 
                mb: 2,
                borderRadius: 2,
              }}
            >
              Inscription réussie ! Un email de vérification vous a été envoyé. Veuillez vérifier votre boîte de réception.
            </Alert>
          )}

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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="nom"
                  name="nom"
                  label="Nom *"
                  value={formik.values.nom}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.nom && Boolean(formik.errors.nom)}
                  helperText={formik.touched.nom && formik.errors.nom}
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
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="prenom"
                  name="prenom"
                  label="Prénom *"
                  value={formik.values.prenom}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.prenom && Boolean(formik.errors.prenom)}
                  helperText={formik.touched.prenom && formik.errors.prenom}
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
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email *"
                  type="email"
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
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="telephone"
                  name="telephone"
                  label="Téléphone *"
                  value={formik.values.telephone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.telephone && Boolean(formik.errors.telephone)}
                  helperText={formik.touched.telephone && formik.errors.telephone}
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
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="adresse"
                  name="adresse"
                  label="Adresse *"
                  multiline
                  rows={2}
                  value={formik.values.adresse}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.adresse && Boolean(formik.errors.adresse)}
                  helperText={formik.touched.adresse && formik.errors.adresse}
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
              </Grid>
            </Grid>

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
              disabled={formik.isSubmitting || success}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'S\'inscrire'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                href="/login"
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
                Vous avez déjà un compte ? Se connecter
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

export default RegisterPage;