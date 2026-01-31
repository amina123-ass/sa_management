// src/pages/ResetPasswordPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, LockReset, Security, CheckCircle } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

const securityValidationSchema = Yup.object({
  answer1: Yup.string().required('Cette réponse est obligatoire'),
  answer2: Yup.string().required('Cette réponse est obligatoire'),
  answer3: Yup.string().required('Cette réponse est obligatoire'),
});

const passwordValidationSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .matches(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Le mot de passe doit contenir au moins un symbole')
    .required('Le mot de passe est obligatoire'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Les mots de passe ne correspondent pas')
    .required('La confirmation est obligatoire'),
});

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  // Charger les questions de sécurité
  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      if (email) {
        try {
          setLoadingQuestions(true);
          const response = await authService.getSecurityQuestions(email);
          setSecurityQuestions(response.data.questions || []);
        } catch (err) {
          setError('Impossible de charger les questions de sécurité');
        } finally {
          setLoadingQuestions(false);
        }
      }
    };

    fetchSecurityQuestions();
  }, [email]);

  // Formik pour les questions de sécurité
  const securityFormik = useFormik({
    initialValues: {
      answer1: '',
      answer2: '',
      answer3: '',
    },
    validationSchema: securityValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');

      try {
        const response = await authService.verifySecurityAnswers({
          email,
          answers: [values.answer1, values.answer2, values.answer3],
        });

        if (response.data.success) {
          toast.success('Questions de sécurité validées');
          setActiveStep(1);
        } else {
          setError('Les réponses aux questions de sécurité sont incorrectes');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la vérification');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Formik pour le mot de passe
  const passwordFormik = useFormik({
    initialValues: {
      password: '',
      password_confirmation: '',
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      setSuccess(false);

      try {
        const response = await authService.resetPassword({
          email,
          token,
          password: values.password,
          password_confirmation: values.password_confirmation,
        });

        if (response.data.success) {
          setSuccess(true);
          toast.success('Mot de passe réinitialisé avec succès');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Une erreur est survenue');
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!email || !token) {
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
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Lien de réinitialisation invalide ou expiré.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              sx={{ 
                mt: 2,
                py: 1.5,
                backgroundColor: '#1976d2',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#1565c0',
                }
              }}
              onClick={() => navigate('/forgot-password')}
            >
              Demander un nouveau lien
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

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
              <LockReset sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight={600} color="#1976d2" gutterBottom>
              Réinitialiser le mot de passe
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {email}
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Questions de sécurité</StepLabel>
            </Step>
            <Step>
              <StepLabel>Nouveau mot de passe</StepLabel>
            </Step>
          </Stepper>

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Étape 1 : Questions de sécurité */}
          {activeStep === 0 && (
            <Box>
              {/* En-tête de la section */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  p: 2,
                  bgcolor: '#e3f2fd',
                  borderRadius: 2,
                  border: '2px solid #1976d2',
                }}
              >
                <Security sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight={600} color="#1976d2">
                    Vérification de sécurité
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Répondez aux questions de sécurité pour continuer
                  </Typography>
                </Box>
              </Box>

              {loadingQuestions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box component="form" onSubmit={securityFormik.handleSubmit}>
                  {/* Question 1 */}
                  <Box 
                    sx={{ 
                      mb: 3, 
                      p: 3, 
                      bgcolor: '#f8f9fa', 
                      borderRadius: 2,
                      border: '1px solid #dee2e6',
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600} 
                      color="#1976d2"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: '#1976d2',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          mr: 1.5,
                        }}
                      >
                        1
                      </Box>
                      {securityQuestions[0] || 'Quelle est votre ville de naissance ?'}
                    </Typography>
                    <TextField
                      fullWidth
                      id="answer1"
                      name="answer1"
                      placeholder="Votre réponse"
                      value={securityFormik.values.answer1}
                      onChange={securityFormik.handleChange}
                      onBlur={securityFormik.handleBlur}
                      error={securityFormik.touched.answer1 && Boolean(securityFormik.errors.answer1)}
                      helperText={securityFormik.touched.answer1 && securityFormik.errors.answer1}
                      sx={{
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                            borderWidth: 2,
                          },
                        }
                      }}
                    />
                  </Box>

                  {/* Question 2 */}
                  <Box 
                    sx={{ 
                      mb: 3, 
                      p: 3, 
                      bgcolor: '#f8f9fa', 
                      borderRadius: 2,
                      border: '1px solid #dee2e6',
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600} 
                      color="#1976d2"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: '#1976d2',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          mr: 1.5,
                        }}
                      >
                        2
                      </Box>
                      {securityQuestions[1] || 'Quel est le nom de jeune fille de votre mère ?'}
                    </Typography>
                    <TextField
                      fullWidth
                      id="answer2"
                      name="answer2"
                      placeholder="Votre réponse"
                      value={securityFormik.values.answer2}
                      onChange={securityFormik.handleChange}
                      onBlur={securityFormik.handleBlur}
                      error={securityFormik.touched.answer2 && Boolean(securityFormik.errors.answer2)}
                      helperText={securityFormik.touched.answer2 && securityFormik.errors.answer2}
                      sx={{
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                            borderWidth: 2,
                          },
                        }
                      }}
                    />
                  </Box>

                  {/* Question 3 */}
                  <Box 
                    sx={{ 
                      mb: 3, 
                      p: 3, 
                      bgcolor: '#f8f9fa', 
                      borderRadius: 2,
                      border: '1px solid #dee2e6',
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600} 
                      color="#1976d2"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: '#1976d2',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          mr: 1.5,
                        }}
                      >
                        3
                      </Box>
                      {securityQuestions[2] || 'Quel était le nom de votre premier animal de compagnie ?'}
                    </Typography>
                    <TextField
                      fullWidth
                      id="answer3"
                      name="answer3"
                      placeholder="Votre réponse"
                      value={securityFormik.values.answer3}
                      onChange={securityFormik.handleChange}
                      onBlur={securityFormik.handleBlur}
                      error={securityFormik.touched.answer3 && Boolean(securityFormik.errors.answer3)}
                      helperText={securityFormik.touched.answer3 && securityFormik.errors.answer3}
                      sx={{
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                            borderWidth: 2,
                          },
                        }
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ 
                      py: 1.5,
                      backgroundColor: '#1976d2',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      }
                    }}
                    disabled={securityFormik.isSubmitting}
                  >
                    {securityFormik.isSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Vérifier les réponses'
                    )}
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Étape 2 : Nouveau mot de passe */}
          {activeStep === 1 && (
            <Box>
              {/* En-tête de la section */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  p: 2,
                  bgcolor: '#e8f5e9',
                  borderRadius: 2,
                  border: '2px solid #4caf50',
                }}
              >
                <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight={600} color="#2e7d32">
                    Questions validées ✓
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Créez maintenant votre nouveau mot de passe
                  </Typography>
                </Box>
              </Box>

              <Box component="form" onSubmit={passwordFormik.handleSubmit}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="password"
                  name="password"
                  label="Nouveau mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordFormik.values.password}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.password && Boolean(passwordFormik.errors.password)}
                  helperText={passwordFormik.touched.password && passwordFormik.errors.password}
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

                <TextField
                  fullWidth
                  margin="normal"
                  id="password_confirmation"
                  name="password_confirmation"
                  label="Confirmer le mot de passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordFormik.values.password_confirmation}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={
                    passwordFormik.touched.password_confirmation &&
                    Boolean(passwordFormik.errors.password_confirmation)
                  }
                  helperText={
                    passwordFormik.touched.password_confirmation &&
                    passwordFormik.errors.password_confirmation
                  }
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
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f7fa', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Le mot de passe doit contenir au moins :
                  </Typography>
                  <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
                    <li><Typography variant="caption" color="text.secondary">8 caractères</Typography></li>
                    <li><Typography variant="caption" color="text.secondary">Une lettre majuscule</Typography></li>
                    <li><Typography variant="caption" color="text.secondary">Une lettre minuscule</Typography></li>
                    <li><Typography variant="caption" color="text.secondary">Un chiffre</Typography></li>
                    <li><Typography variant="caption" color="text.secondary">Un caractère spécial</Typography></li>
                  </ul>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ 
                    mt: 3, 
                    mb: 2,
                    py: 1.5,
                    backgroundColor: '#1976d2',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    }
                  }}
                  disabled={passwordFormik.isSubmitting || success}
                >
                  {passwordFormik.isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setActiveStep(0)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    color: '#1976d2',
                  }}
                  disabled={passwordFormik.isSubmitting || success}
                >
                  ← Retour aux questions de sécurité
                </Button>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              }
            }}
          >
            Retour à la connexion
          </Button>
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

export default ResetPasswordPage;