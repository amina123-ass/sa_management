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

// ✅ Fonction robuste pour extraire le texte de la question
const getQuestionText = (questionObj) => {
  // 🔍 DEBUG: Afficher la structure complète de l'objet question
  console.log('📋 Structure de la question:', JSON.stringify(questionObj, null, 2));
  
  // Cas 1: Objet avec propriété security_question imbriquée
  if (questionObj.security_question) {
    console.log('✅ Trouvé security_question:', questionObj.security_question);
    return questionObj.security_question.question_fr || 
           questionObj.security_question.question || 
           questionObj.security_question.text;
  }
  
  // Cas 2: Objet avec propriété question imbriquée
  if (questionObj.question && typeof questionObj.question === 'object') {
    console.log('✅ Trouvé question object:', questionObj.question);
    return questionObj.question.question_fr || 
           questionObj.question.text;
  }
  
  // Cas 3: Propriétés directes
  const directText = questionObj.question_fr || 
                     questionObj.question || 
                     questionObj.text || 
                     questionObj.question_text ||
                     questionObj.label ||
                     questionObj.questionFr ||
                     questionObj.questionText ||
                     questionObj.securityQuestion?.question_fr ||
                     questionObj.securityQuestion?.question;
  
  if (directText) {
    console.log('✅ Trouvé texte direct:', directText);
    return directText;
  }
  
  // Cas 4: Fallback - afficher toutes les clés pour debug
  console.warn('⚠️ Aucun texte trouvé. Clés disponibles:', Object.keys(questionObj));
  return `Question ${questionObj.id || 'inconnue'}`;
};

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

    // ✅ Format correct des données
    const payload = {
      email: values.email,
      answers: questions.map((q, index) => ({
        id: q.id,  // ID de la réponse dans user_security_answers
        answer: values[`answer${index + 1}`]
      })),
      password: values.password,
      password_confirmation: values.password_confirmation,
    };

    // ✅ DEBUG : Logger les données envoyées
    console.log('🔍 Payload envoyé:', payload);
    console.log('📋 Questions:', questions);

    try {
      const response = await authService.verifySecurityAnswers(payload);

      console.log('✅ Réponse API:', response.data);

      if (response.data.success) {
        toast.success('Mot de passe réinitialisé avec succès');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ Erreur API:', err.response);
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
      
      // ✅ DEBUG COMPLET
      console.log('🔍 ===== DEBUG RÉCUPÉRATION QUESTIONS =====');
      console.log('📦 Réponse API complète:', response);
      console.log('📦 response.data:', response.data);
      console.log('📦 response.data.data:', response.data.data);
      console.log('📦 Type de response.data.data:', Array.isArray(response.data.data) ? 'Array' : typeof response.data.data);
      
      if (response.data.success) {
        const questionsData = response.data.data;
        
        // ✅ Afficher chaque question individuellement
        console.log('📋 Nombre de questions:', questionsData.length);
        questionsData.forEach((q, index) => {
          console.log(`\n📌 Question ${index + 1}:`);
          console.log('  - Objet complet:', q);
          console.log('  - ID:', q.id);
          console.log('  - Clés disponibles:', Object.keys(q));
          console.log('  - Texte extrait:', getQuestionText(q));
        });
        console.log('🔍 ===== FIN DEBUG =====\n');
        
        setQuestions(questionsData);
        setShowQuestions(true);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ Erreur récupération questions:', err);
      console.error('❌ Détails erreur:', err.response);
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
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                    Répondez à vos questions de sécurité et créez un nouveau mot de passe.
                  </Typography>

                  {/* ✅ Affichage des questions avec extraction robuste */}
                  {questions.map((question, index) => {
                    const questionText = getQuestionText(question);
                    
                    return (
                      <Box key={question.id || index} sx={{ mb: 3 }}>
                        {/* ✅ Question affichée avec style amélioré */}
                        <Box
                          sx={{
                            bgcolor: '#f5f5f5',
                            p: 2,
                            borderRadius: 1,
                            mb: 1.5,
                            border: '1px solid #e0e0e0',
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            color="#1976d2"
                            sx={{ 
                              fontSize: '0.875rem',
                              lineHeight: 1.6,
                            }}
                          >
                            Question {index + 1}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            color="text.primary"
                            sx={{ 
                              mt: 0.5,
                              fontSize: '1rem',
                              lineHeight: 1.5,
                              fontWeight: 500,
                            }}
                          >
                            {questionText}
                          </Typography>
                        </Box>
                        
                        <TextField
                          fullWidth
                          id={`answer${index + 1}`}
                          name={`answer${index + 1}`}
                          label={`Réponse ${index + 1}`}
                          placeholder="Entrez votre réponse"
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
                              bgcolor: '#ffffff',
                              '&:hover fieldset': {
                                borderColor: '#1976d2',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(0, 0, 0, 0.6) !important',
                            },
                          }}
                        />
                      </Box>
                    );
                  })}

                  <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 4, mb: 2 }}>
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
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0, 0, 0, 0.6) !important',
                      },
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
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0, 0, 0, 0.6) !important',
                      },
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
                    onClick={() => {
                      setShowQuestions(false);
                      securityFormik.resetForm();
                    }}
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