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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Divider,
} from '@mui/material';
import { PersonAdd, Security } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Liste des questions de sécurité disponibles
const SECURITY_QUESTIONS = [
  'Quelle est votre ville de naissance ?',
  'Quel est le nom de jeune fille de votre mère ?',
  'Quel était le nom de votre premier animal de compagnie ?',
  'Quel est votre plat préféré ?',
  'Quel est le nom de votre école primaire ?',
  'Quel est votre film préféré ?',
  'Quelle est votre couleur préférée ?',
  'Quel est le nom de votre meilleur ami d\'enfance ?',
  'Dans quelle ville avez-vous rencontré votre conjoint(e) ?',
  'Quel est le nom de votre premier employeur ?',
];

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
  
  // Validation des questions de sécurité
  security_question_1: Yup.string().required('Veuillez choisir la première question'),
  security_answer_1: Yup.string().required('La réponse est obligatoire'),
  security_question_2: Yup.string()
    .required('Veuillez choisir la deuxième question')
    .test('different-from-1', 'Cette question est déjà sélectionnée', function(value) {
      return value !== this.parent.security_question_1;
    }),
  security_answer_2: Yup.string().required('La réponse est obligatoire'),
  security_question_3: Yup.string()
    .required('Veuillez choisir la troisième question')
    .test('different-from-1-2', 'Cette question est déjà sélectionnée', function(value) {
      return value !== this.parent.security_question_1 && value !== this.parent.security_question_2;
    }),
  security_answer_3: Yup.string().required('La réponse est obligatoire'),
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
      security_question_1: '',
      security_answer_1: '',
      security_question_2: '',
      security_answer_2: '',
      security_question_3: '',
      security_answer_3: '',
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

  // Fonction pour filtrer les questions déjà sélectionnées
  const getAvailableQuestions = (currentQuestion, excludeQuestions = []) => {
    return SECURITY_QUESTIONS.filter(
      q => q === currentQuestion || !excludeQuestions.includes(q)
    );
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
              <PersonAdd sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight={600} color="#1976d2" gutterBottom>
              SA Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
            {/* Informations personnelles */}
            <Typography variant="h6" fontWeight={600} color="#1976d2" sx={{ mb: 2 }}>
              Informations personnelles
            </Typography>
            
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

            <Divider sx={{ my: 4 }} />

            {/* Questions de sécurité */}
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
              <Security sx={{ fontSize: 32, color: '#1976d2', mr: 2 }} />
              <Box>
                <Typography variant="h6" fontWeight={600} color="#1976d2">
                  Questions de sécurité
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choisissez 3 questions différentes pour sécuriser votre compte
                </Typography>
              </Box>
            </Box>

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
                color="#000000"
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
                Question 1
              </Typography>
              
              <FormControl 
                fullWidth 
                error={formik.touched.security_question_1 && Boolean(formik.errors.security_question_1)}
                sx={{ mb: 2 }}
              >
                <InputLabel id="security-question-1-label">Choisissez une question *</InputLabel>
                <Select
                  labelId="security-question-1-label"
                  id="security_question_1"
                  name="security_question_1"
                  value={formik.values.security_question_1}
                  label="Choisissez une question *"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  sx={{
                    bgcolor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: '#999' }}>Sélectionnez une question</em>
                  </MenuItem>
                  {getAvailableQuestions(
                    formik.values.security_question_1,
                    [formik.values.security_question_2, formik.values.security_question_3]
                  ).map((question, index) => (
                    <MenuItem 
                      key={`q1-${index}`} 
                      value={question}
                      style={{
                        color: '#000',
                        backgroundColor: 'white',
                        padding: '10px 16px',
                        fontSize: '14px',
                      }}
                    >
                      {question}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.security_question_1 && formik.errors.security_question_1 && (
                  <FormHelperText>{formik.errors.security_question_1}</FormHelperText>
                )}
              </FormControl>

              <TextField
                fullWidth
                id="security_answer_1"
                name="security_answer_1"
                label="Votre réponse *"
                placeholder="Tapez votre réponse"
                value={formik.values.security_answer_1}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.security_answer_1 && Boolean(formik.errors.security_answer_1)}
                helperText={formik.touched.security_answer_1 && formik.errors.security_answer_1}
                disabled={!formik.values.security_question_1}
                sx={{
                  bgcolor: 'white',
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
                color="#000000"
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
                Question 2
              </Typography>
              
              <FormControl 
                fullWidth 
                error={formik.touched.security_question_2 && Boolean(formik.errors.security_question_2)}
                sx={{ mb: 2 }}
              >
                <InputLabel id="security-question-2-label">Choisissez une question *</InputLabel>
                <Select
                  labelId="security-question-2-label"
                  id="security_question_2"
                  name="security_question_2"
                  value={formik.values.security_question_2}
                  label="Choisissez une question *"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  sx={{
                    bgcolor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: '#999' }}>Sélectionnez une question</em>
                  </MenuItem>
                  {getAvailableQuestions(
                    formik.values.security_question_2,
                    [formik.values.security_question_1, formik.values.security_question_3]
                  ).map((question, index) => (
                    <MenuItem 
                      key={`q2-${index}`} 
                      value={question}
                      style={{
                        color: '#000',
                        backgroundColor: 'white',
                        padding: '10px 16px',
                        fontSize: '14px',
                      }}
                    >
                      {question}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.security_question_2 && formik.errors.security_question_2 && (
                  <FormHelperText>{formik.errors.security_question_2}</FormHelperText>
                )}
              </FormControl>

              <TextField
                fullWidth
                id="security_answer_2"
                name="security_answer_2"
                label="Votre réponse *"
                placeholder="Tapez votre réponse"
                value={formik.values.security_answer_2}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.security_answer_2 && Boolean(formik.errors.security_answer_2)}
                helperText={formik.touched.security_answer_2 && formik.errors.security_answer_2}
                disabled={!formik.values.security_question_2}
                sx={{
                  bgcolor: 'white',
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
                color="#000000"
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
                Question 3
              </Typography>
              
              <FormControl 
                fullWidth 
                error={formik.touched.security_question_3 && Boolean(formik.errors.security_question_3)}
                sx={{ mb: 2 }}
              >
                <InputLabel id="security-question-3-label">Choisissez une question *</InputLabel>
                <Select
                  labelId="security-question-3-label"
                  id="security_question_3"
                  name="security_question_3"
                  value={formik.values.security_question_3}
                  label="Choisissez une question *"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  sx={{
                    bgcolor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: '#999' }}>Sélectionnez une question</em>
                  </MenuItem>
                  {getAvailableQuestions(
                    formik.values.security_question_3,
                    [formik.values.security_question_1, formik.values.security_question_2]
                  ).map((question, index) => (
                    <MenuItem 
                      key={`q3-${index}`} 
                      value={question}
                      style={{
                        color: '#000',
                        backgroundColor: 'white',
                        padding: '10px 16px',
                        fontSize: '14px',
                      }}
                    >
                      {question}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.security_question_3 && formik.errors.security_question_3 && (
                  <FormHelperText>{formik.errors.security_question_3}</FormHelperText>
                )}
              </FormControl>

              <TextField
                fullWidth
                id="security_answer_3"
                name="security_answer_3"
                label="Votre réponse *"
                placeholder="Tapez votre réponse"
                value={formik.values.security_answer_3}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.security_answer_3 && Boolean(formik.errors.security_answer_3)}
                helperText={formik.touched.security_answer_3 && formik.errors.security_answer_3}
                disabled={!formik.values.security_question_3}
                sx={{
                  bgcolor: 'white',
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