// src/pages/ForgotPasswordPage.jsx

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
  Tabs,
  Tab,
  Avatar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { HelpOutline, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

const emailValidationSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est obligatoire'),
});

const securityQuestionsSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est obligatoire'),
  answer1: Yup.string().required('La réponse est obligatoire'),
  answer2: Yup.string().required('La réponse est obligatoire'),
  answer3: Yup.string().required('La réponse est obligatoire'),
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

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailFormik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: emailValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      setSuccess(false);

      try {
        const response = await authService.forgotPassword(values.email);
        if (response.data.success) {
          setSuccess(true);
          toast.success(response.data.message);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
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

  const securityFormik = useFormik({
    initialValues: {
      email: '',
      answer1: '',
      answer2: '',
      answer3: '',
      password: '',
      password_confirmation: '',
    },
    validationSchema: securityQuestionsSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');

      const answers = questions.map((q, index) => ({
        id: q.id,
        answer: values[`answer${index + 1}`],
      }));

      try {
        const response = await authService.verifySecurityAnswers({
          email: values.email,
          answers,
          password: values.password,
          password_confirmation: values.password_confirmation,
        });

        if (response.data.success) {
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

  const handleGetQuestions = async () => {
    if (!securityFormik.values.email) {
      setError('Veuillez entrer votre email');
      return;
    }

    setError('');
    try {
      const response = await authService.getSecurityQuestions(securityFormik.values.email);
      if (response.data.success) {
        setQuestions(response.data.data);
        setShowQuestions(true);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };

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
              <HelpOutline sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight={600} color="#1976d2" gutterBottom>
              Mot de passe oublié
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Récupérez l'accès à votre compte
            </Typography>
          </Box>

          <Tabs
            value={tabValue}
            onChange={(e, newValue) => {
              setTabValue(newValue);
              setError('');
              setSuccess(false);
              setShowQuestions(false);
            }}
            centered
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
              },
              '& .Mui-selected': {
                color: '#1976d2',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1976d2',
              }
            }}
          >
            <Tab label="Par Email" />
            <Tab label="Questions de sécurité" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2, borderRadius: 2 }}>
              Un email de réinitialisation a été envoyé à votre adresse
            </Alert>
          )}

          {/* Méthode 1: Par Email */}
          {tabValue === 0 && (
            <Box component="form" onSubmit={emailFormik.handleSubmit} sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Entrez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.
              </Typography>

              <TextField
                fullWidth
                margin="normal"
                id="email"
                name="email"
                label="Email"
                type="email"
                autoFocus
                value={emailFormik.values.email}
                onChange={emailFormik.handleChange}
                onBlur={emailFormik.handleBlur}
                error={emailFormik.touched.email && Boolean(emailFormik.errors.email)}
                helperText={emailFormik.touched.email && emailFormik.errors.email}
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
                  }
                }}
                disabled={emailFormik.isSubmitting || success}
              >
                {emailFormik.isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Envoyer le lien de réinitialisation'
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
                  Retour à la connexion
                </Link>
              </Box>
            </Box>
          )}

          {/* Méthode 2: Par Questions de Sécurité */}
          {tabValue === 1 && (
            <Box component="form" onSubmit={securityFormik.handleSubmit} sx={{ mt: 3 }}>
              {!showQuestions ? (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Entrez votre email pour récupérer vos questions de sécurité.
                  </Typography>

                  <TextField
                    fullWidth
                    margin="normal"
                    id="sec-email"
                    name="email"
                    label="Email"
                    type="email"
                    autoFocus
                    value={securityFormik.values.email}
                    onChange={securityFormik.handleChange}
                    onBlur={securityFormik.handleBlur}
                    error={securityFormik.touched.email && Boolean(securityFormik.errors.email)}
                    helperText={securityFormik.touched.email && securityFormik.errors.email}
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

                  <Button
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
                      }
                    }}
                    onClick={handleGetQuestions}
                  >
                    Récupérer mes questions
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Répondez à vos questions de sécurité et créez un nouveau mot de passe.
                  </Typography>

                  {questions.map((question, index) => (
                    <TextField
                      key={question.id}
                      fullWidth
                      margin="normal"
                      id={`answer${index + 1}`}
                      name={`answer${index + 1}`}
                      label={question.question_fr}
                      value={securityFormik.values[`answer${index + 1}`]}
                      onChange={securityFormik.handleChange}
                      onBlur={securityFormik.handleBlur}
                      error={
                        securityFormik.touched[`answer${index + 1}`] &&
                        Boolean(securityFormik.errors[`answer${index + 1}`])
                      }
                      helperText={
                        securityFormik.touched[`answer${index + 1}`] &&
                        securityFormik.errors[`answer${index + 1}`]
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
                    />
                  ))}

                  <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                    Nouveau mot de passe
                  </Typography>

                  <TextField
                    fullWidth
                    margin="normal"
                    id="sec-password"
                    name="password"
                    label="Nouveau mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    value={securityFormik.values.password}
                    onChange={securityFormik.handleChange}
                    onBlur={securityFormik.handleBlur}
                    error={securityFormik.touched.password && Boolean(securityFormik.errors.password)}
                    helperText={securityFormik.touched.password && securityFormik.errors.password}
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
                    id="sec-password-confirmation"
                    name="password_confirmation"
                    label="Confirmer le mot de passe"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={securityFormik.values.password_confirmation}
                    onChange={securityFormik.handleChange}
                    onBlur={securityFormik.handleBlur}
                    error={
                      securityFormik.touched.password_confirmation &&
                      Boolean(securityFormik.errors.password_confirmation)
                    }
                    helperText={
                      securityFormik.touched.password_confirmation &&
                      securityFormik.errors.password_confirmation
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
                      }
                    }}
                    disabled={securityFormik.isSubmitting}
                  >
                    {securityFormik.isSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Réinitialiser le mot de passe'
                    )}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowQuestions(false)}
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
                    Changer d'email
                  </Button>
                </>
              )}

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
                  Retour à la connexion
                </Link>
              </Box>
            </Box>
          )}
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

export default ForgotPasswordPage;