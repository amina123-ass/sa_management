// src/pages/VerifyEmailPage.jsx

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
  MenuItem,
  IconButton,
  InputAdornment,
  Avatar,
} from '@mui/material';
import { Visibility, VisibilityOff, VerifiedUser } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';

const validationSchema = Yup.object({
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
  question1: Yup.string().required('Veuillez choisir une question'),
  answer1: Yup.string().required('La réponse est obligatoire'),
  question2: Yup.string().required('Veuillez choisir une question'),
  answer2: Yup.string().required('La réponse est obligatoire'),
  question3: Yup.string().required('Veuillez choisir une question'),
  answer3: Yup.string().required('La réponse est obligatoire'),
});

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!email || !token) {
      setError('Lien de vérification invalide');
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await authService.getAllSecurityQuestions();
        if (response.data.success) {
          setQuestions(response.data.data);
        }
      } catch (err) {
        setError('Erreur lors du chargement des questions de sécurité');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [email, token]);

  const formik = useFormik({
    initialValues: {
      password: '',
      password_confirmation: '',
      question1: '',
      answer1: '',
      question2: '',
      answer2: '',
      question3: '',
      answer3: '',
    },
    validationSchema,
    validate: (values) => {
      const errors = {};
      const selectedQuestions = [values.question1, values.question2, values.question3];
      const uniqueQuestions = new Set(selectedQuestions.filter(Boolean));
      
      if (uniqueQuestions.size !== 3) {
        errors.question1 = 'Veuillez sélectionner 3 questions différentes';
        errors.question2 = 'Veuillez sélectionner 3 questions différentes';
        errors.question3 = 'Veuillez sélectionner 3 questions différentes';
      }
      
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      setSuccess(false);

      const security_answers = [
        { question_id: parseInt(values.question1), answer: values.answer1 },
        { question_id: parseInt(values.question2), answer: values.answer2 },
        { question_id: parseInt(values.question3), answer: values.answer3 },
      ];

      try {
        const response = await authService.verifyEmail({
          email,
          token,
          password: values.password,
          password_confirmation: values.password_confirmation,
          security_answers,
        });

        if (response.data.success) {
          setSuccess(true);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!email || !token) {
    return (
      <Container component="main" maxWidth="sm">
        <Box 
          sx={{ 
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              p: 4,
              borderRadius: 2,
              boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
            }}
          >
            <Alert severity="error" sx={{ borderRadius: 2 }}>Lien de vérification invalide</Alert>
            <Button 
              variant="contained" 
              sx={{ 
                mt: 2,
                backgroundColor: '#1976d2',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#1565c0',
                }
              }} 
              onClick={() => navigate('/login')}
            >
              Retour à la connexion
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  const getAvailableQuestions = (currentField) => {
    const selectedQuestions = [
      formik.values.question1,
      formik.values.question2,
      formik.values.question3,
    ].filter(q => q && q !== formik.values[currentField]);

    return questions.filter(q => !selectedQuestions.includes(q.id.toString()));
  };

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
              <VerifiedUser sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight={600} color="#1976d2" gutterBottom>
              Finalisation de votre compte
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {email}
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2, borderRadius: 2 }}>
              Compte finalisé avec succès ! Redirection vers la page de connexion...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              Créer votre mot de passe
            </Typography>

            <TextField
              fullWidth
              margin="normal"
              id="password"
              name="password"
              label="Mot de passe *"
              type={showPassword ? 'text' : 'password'}
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

            <TextField
              fullWidth
              margin="normal"
              id="password_confirmation"
              name="password_confirmation"
              label="Confirmer le mot de passe *"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formik.values.password_confirmation}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password_confirmation && Boolean(formik.errors.password_confirmation)}
              helperText={formik.touched.password_confirmation && formik.errors.password_confirmation}
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

            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
              Questions de sécurité (Choisissez 3 questions différentes)
            </Typography>

            {[1, 2, 3].map((num) => (
              <Box key={num} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  select
                  margin="normal"
                  id={`question${num}`}
                  name={`question${num}`}
                  label={`Question ${num} *`}
                  value={formik.values[`question${num}`]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched[`question${num}`] && Boolean(formik.errors[`question${num}`])}
                  helperText={formik.touched[`question${num}`] && formik.errors[`question${num}`]}
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
                >
                  {getAvailableQuestions(`question${num}`).map((q) => (
                    <MenuItem key={q.id} value={q.id.toString()}>
                      {q.question_fr}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  margin="normal"
                  id={`answer${num}`}
                  name={`answer${num}`}
                  label={`Réponse ${num} *`}
                  value={formik.values[`answer${num}`]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched[`answer${num}`] && Boolean(formik.errors[`answer${num}`])}
                  helperText={formik.touched[`answer${num}`] && formik.errors[`answer${num}`]}
                  disabled={!formik.values[`question${num}`]}
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
              </Box>
            ))}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 4, 
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
              disabled={formik.isSubmitting || success}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Finaliser mon compte'
              )}
            </Button>
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

export default VerifyEmailPage;