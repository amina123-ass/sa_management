// src/pages/reception/GestionAppelsPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Phone,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Search,
  PersonAdd,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import CampagneSelector from '../../components/reception/CampagneSelector';
import { receptionService, dictionaryService } from '../../services/api';
import { toast } from 'react-toastify';

const validationSchema = Yup.object({
  nom: Yup.string().required('Le nom est obligatoire'),
  prenom: Yup.string().required('Le prénom est obligatoire'),
  cin: Yup.string().required('Le CIN est obligatoire'),
  date_naissance: Yup.date().required('La date de naissance est obligatoire'),
  sexe: Yup.string().oneOf(['M', 'F']).required('Le sexe est obligatoire'),
  telephone: Yup.string().required('Le téléphone est obligatoire'),
  adresse: Yup.string().required('L\'adresse est obligatoire'),
});

const GestionAppelsPage = () => {
  const [selectedCampagne, setSelectedCampagne] = useState('');
  const [participants, setParticipants] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);

  useEffect(() => {
    loadCommunes();
  }, []);

  useEffect(() => {
    if (selectedCampagne) {
      loadParticipants();
    }
  }, [selectedCampagne, page, rowsPerPage, search]);

  const loadCommunes = async () => {
    try {
      const response = await dictionaryService.getAll('communes', { is_active: 1 });
      if (response.data.success) {
        setCommunes(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement communes:', error);
    }
  };

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getParticipants(selectedCampagne, {
        page: page + 1,
        per_page: rowsPerPage,
        search: search,
      });

      if (response.data.success) {
        setParticipants(response.data.data.data);
        setTotalParticipants(response.data.data.total);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des participants');
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      nom: '',
      prenom: '',
      cin: '',
      date_naissance: '',
      sexe: 'M',
      telephone: '',
      email: '',
      adresse: '',
      commune_id: '',
      statut: 'En attente',
      observation_appel: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const data = {
          ...values,
          campagne_id: selectedCampagne,
        };

        if (editingParticipant) {
          await receptionService.updateParticipant(editingParticipant.id, data);
          toast.success('Participant modifié avec succès');
        } else {
          await receptionService.createParticipant(data);
          toast.success('Participant ajouté avec succès');
        }

        setOpenDialog(false);
        resetForm();
        setEditingParticipant(null);
        loadParticipants();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (participant) => {
    setEditingParticipant(participant);
    formik.setValues({
      nom: participant.nom,
      prenom: participant.prenom,
      cin: participant.cin,
      date_naissance: participant.date_naissance,
      sexe: participant.sexe,
      telephone: participant.telephone,
      email: participant.email || '',
      adresse: participant.adresse,
      commune_id: participant.commune_id || '',
      statut: participant.statut,
      observation_appel: participant.observation_appel || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      try {
        await receptionService.deleteParticipant(id);
        toast.success('Participant supprimé');
        loadParticipants();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleQuickStatusUpdate = async (participantId, newStatus) => {
    try {
      await receptionService.updateParticipant(participantId, {
        statut: newStatus,
        date_appel: new Date().toISOString().split('T')[0],
        appel_effectue: true,
      });
      toast.success(`Statut mis à jour: ${newStatus}`);
      loadParticipants();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatutChip = (statut) => {
    const colors = {
      'Oui': { color: 'success', icon: <CheckCircle /> },
      'Non': { color: 'error', icon: <Cancel /> },
      'En attente': { color: 'warning', icon: <HourglassEmpty /> },
    };
    return (
      <Chip
        label={statut}
        color={colors[statut]?.color || 'default'}
        size="small"
        icon={colors[statut]?.icon}
      />
    );
  };

  const stats = {
    total: totalParticipants,
    confirmes: participants.filter(p => p.statut === 'Oui').length,
    refuses: participants.filter(p => p.statut === 'Non').length,
    enAttente: participants.filter(p => p.statut === 'En attente').length,
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600} color="#1976d2">
          Gestion d'Appels
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gérez les appels et mettez à jour le statut des participants
        </Typography>
      </Box>

      {/* Sélection campagne */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CampagneSelector
          value={selectedCampagne}
          onChange={setSelectedCampagne}
        />
      </Paper>

      {selectedCampagne && (
        <>
          {/* Statistiques */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: '#e3f2fd',
                boxShadow: 'none',
                borderRadius: 2,
                border: '1px solid #bbdefb'
              }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" fontWeight={600} color="#1976d2">
                    {stats.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Total Participants
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: '#e8f5e9',
                boxShadow: 'none',
                borderRadius: 2,
                border: '1px solid #c8e6c9'
              }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" fontWeight={600} color="success.main">
                    {stats.confirmes}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Confirmés (Oui)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: '#ffebee',
                boxShadow: 'none',
                borderRadius: 2,
                border: '1px solid #ffcdd2'
              }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" fontWeight={600} color="error.main">
                    {stats.refuses}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Refusés (Non)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: '#fff3e0',
                boxShadow: 'none',
                borderRadius: 2,
                border: '1px solid #ffe0b2'
              }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" fontWeight={600} color="warning.main">
                    {stats.enAttente}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    En Attente
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Actions et recherche */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, prénom, CIN, téléphone..."
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                size="small"
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
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => {
                  setEditingParticipant(null);
                  formik.resetForm();
                  setOpenDialog(true);
                }}
                sx={{
                  backgroundColor: '#1976d2',
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  }
                }}
              >
                Ajouter
              </Button>
            </Box>
          </Paper>

          {/* Table */}
          <Paper sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
              </Box>
            ) : participants.length === 0 ? (
              <Alert severity="info" sx={{ m: 3 }}>
                Aucun participant trouvé
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                        <TableCell sx={{ fontWeight: 600 }}>CIN</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Nom & Prénom</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Téléphone</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Commune</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions Rapides</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant.id} hover>
                          <TableCell>{participant.cin}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {participant.prenom} {participant.nom}
                            </Typography>
                          </TableCell>
                          <TableCell>{participant.telephone}</TableCell>
                          <TableCell>{participant.commune?.nom || 'N/A'}</TableCell>
                          <TableCell>{getStatutChip(participant.statut)}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Confirmer (Oui)">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleQuickStatusUpdate(participant.id, 'Oui')}
                                  disabled={participant.statut === 'Oui'}
                                >
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Refuser (Non)">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleQuickStatusUpdate(participant.id, 'Non')}
                                  disabled={participant.statut === 'Non'}
                                >
                                  <Cancel fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="En attente">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleQuickStatusUpdate(participant.id, 'En attente')}
                                  disabled={participant.statut === 'En attente'}
                                >
                                  <HourglassEmpty fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Modifier">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEdit(participant)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(participant.id)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={totalParticipants}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  labelRowsPerPage="Lignes par page:"
                />
              </>
            )}
          </Paper>
        </>
      )}

      {/* Dialog Ajout/Modification */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle sx={{ 
            backgroundColor: '#1976d2',
            color: 'white',
            fontWeight: 600,
          }}>
            {editingParticipant ? 'Modifier le participant' : 'Ajouter un participant'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  name="nom"
                  value={formik.values.nom}
                  onChange={formik.handleChange}
                  error={formik.touched.nom && Boolean(formik.errors.nom)}
                  helperText={formik.touched.nom && formik.errors.nom}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  name="prenom"
                  value={formik.values.prenom}
                  onChange={formik.handleChange}
                  error={formik.touched.prenom && Boolean(formik.errors.prenom)}
                  helperText={formik.touched.prenom && formik.errors.prenom}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CIN"
                  name="cin"
                  value={formik.values.cin}
                  onChange={formik.handleChange}
                  error={formik.touched.cin && Boolean(formik.errors.cin)}
                  helperText={formik.touched.cin && formik.errors.cin}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date de naissance"
                  type="date"
                  name="date_naissance"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.date_naissance}
                  onChange={formik.handleChange}
                  error={formik.touched.date_naissance && Boolean(formik.errors.date_naissance)}
                  helperText={formik.touched.date_naissance && formik.errors.date_naissance}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sexe</InputLabel>
                  <Select
                    name="sexe"
                    value={formik.values.sexe}
                    onChange={formik.handleChange}
                    label="Sexe"
                  >
                    <MenuItem value="M">Masculin</MenuItem>
                    <MenuItem value="F">Féminin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  name="telephone"
                  value={formik.values.telephone}
                  onChange={formik.handleChange}
                  error={formik.touched.telephone && Boolean(formik.errors.telephone)}
                  helperText={formik.touched.telephone && formik.errors.telephone}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Commune</InputLabel>
                  <Select
                    name="commune_id"
                    value={formik.values.commune_id}
                    onChange={formik.handleChange}
                    label="Commune"
                  >
                    <MenuItem value="">Aucune</MenuItem>
                    {communes.map((commune) => (
                      <MenuItem key={commune.id} value={commune.id}>
                        {commune.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresse"
                  name="adresse"
                  multiline
                  rows={2}
                  value={formik.values.adresse}
                  onChange={formik.handleChange}
                  error={formik.touched.adresse && Boolean(formik.errors.adresse)}
                  helperText={formik.touched.adresse && formik.errors.adresse}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    name="statut"
                    value={formik.values.statut}
                    onChange={formik.handleChange}
                    label="Statut"
                  >
                    <MenuItem value="En attente">En attente</MenuItem>
                    <MenuItem value="Oui">Confirmé (Oui)</MenuItem>
                    <MenuItem value="Non">Refusé (Non)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Observation"
                  name="observation_appel"
                  value={formik.values.observation_appel}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={formik.isSubmitting}
              sx={{
                backgroundColor: '#1976d2',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#1565c0',
                }
              }}
            >
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Enregistrer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default GestionAppelsPage;