import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  MenuItem,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  InputAdornment,
  Divider,
  Stack,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Campaign as CampaignIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { campagneService, dictionaryService } from '../../services/api';

const theme = {
  primary: '#1976d2',
  secondary: '#546e7a',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  background: '#f5f7fa',
  white: '#ffffff',
};

const CampagnesPage = () => {
  const [campagnes, setCampagnes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCampagne, setEditingCampagne] = useState(null);
  const [typesAssistance, setTypesAssistance] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatut, setFilterStatut] = useState('');
  
  const [formData, setFormData] = useState({
    nom: '',
    type_assistance_id: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
    budget: '',
    nombre_beneficiaires_prevus: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [stats, setStats] = useState({ 
    total: 0, 
    enCours: 0, 
    aVenir: 0, 
    terminees: 0,
    budgetTotal: 0 
  });

  useEffect(() => {
    fetchCampagnes();
  }, [page, rowsPerPage, search, filterStatut]);

  useEffect(() => {
    fetchTypesAssistance();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchCampagnes = async () => {
    setLoading(true);
    try {
      const response = await campagneService.getAll({
        page: page + 1,
        per_page: rowsPerPage,
        search,
        statut: filterStatut,
      });
      
      const data = response.data.data.data;
      setCampagnes(data);
      setTotalRows(response.data.data.total);
      
      // Calcul des statistiques
      const enCours = data.filter(c => c.statut === 'En cours').length;
      const aVenir = data.filter(c => c.statut === 'À venir').length;
      const terminees = data.filter(c => c.statut === 'Terminée').length;
      const budgetTotal = data.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0);
      
      setStats({ 
        total: data.length, 
        enCours, 
        aVenir, 
        terminees,
        budgetTotal 
      });
    } catch (error) {
      toast.error('Erreur lors du chargement des campagnes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypesAssistance = async () => {
    try {
      const response = await dictionaryService.getAll('type_assistances', { is_active: 1 });
      setTypesAssistance(response.data.data);
    } catch (error) {
      console.error('Erreur types assistance:', error);
      toast.error('Erreur lors du chargement des types d\'assistance');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validation basique - les champs ne sont plus obligatoires mais on vérifie la cohérence
    if (formData.nom && formData.nom.trim().length > 255) {
      newErrors.nom = 'Le nom ne doit pas dépasser 255 caractères';
    }
    
    if (formData.date_debut && formData.date_fin && formData.date_fin < formData.date_debut) {
      newErrors.date_fin = 'La date de fin doit être égale ou postérieure à la date de début';
    }
    
    if (formData.budget && parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Le budget doit être un nombre positif';
    }
    
    if (formData.nombre_beneficiaires_prevus && parseInt(formData.nombre_beneficiaires_prevus) < 0) {
      newErrors.nombre_beneficiaires_prevus = 'Le nombre doit être positif';
    }

    if (formData.lieu && formData.lieu.trim().length > 255) {
      newErrors.lieu = 'Le lieu ne doit pas dépasser 255 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (campagne = null) => {
    if (campagne) {
      setEditingCampagne(campagne);
      setFormData({
        nom: campagne.nom || '',
        type_assistance_id: campagne.type_assistance_id || '',
        date_debut: campagne.date_debut || '',
        date_fin: campagne.date_fin || '',
        lieu: campagne.lieu || '',
        budget: campagne.budget || '',
        nombre_beneficiaires_prevus: campagne.nombre_beneficiaires_prevus || '',
        description: campagne.description || '',
      });
    } else {
      setEditingCampagne(null);
      setFormData({
        nom: '',
        type_assistance_id: '',
        date_debut: '',
        date_fin: '',
        lieu: '',
        budget: '',
        nombre_beneficiaires_prevus: '',
        description: '',
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCampagne(null);
    setErrors({});
    setFormData({
      nom: '',
      type_assistance_id: '',
      date_debut: '',
      date_fin: '',
      lieu: '',
      budget: '',
      nombre_beneficiaires_prevus: '',
      description: '',
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setSubmitting(true);
    try {
      // Nettoyer les champs vides avant l'envoi
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '' && value !== null)
      );

      if (editingCampagne) {
        await campagneService.update(editingCampagne.id, cleanedData);
        toast.success('Campagne mise à jour avec succès');
      } else {
        await campagneService.create(cleanedData);
        toast.success('Campagne créée avec succès');
      }
      handleCloseDialog();
      fetchCampagnes();
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      toast.error(message);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nom) => {
    if (window.confirm(`Confirmer la suppression de la campagne "${nom || 'Sans nom'}" ?`)) {
      try {
        await campagneService.delete(id);
        toast.success('Campagne supprimée avec succès');
        fetchCampagnes();
      } catch (error) {
        const message = error.response?.data?.message || 'Erreur lors de la suppression';
        toast.error(message);
      }
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'À venir': return 'info';
      case 'En cours': return 'success';
      case 'Terminée': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0,00 DH';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-MA');
  };

  // Composant Carte Statistique
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" color={color}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color: color,
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* En-tête avec bouton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Gestion des Campagnes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Planifiez et gérez vos campagnes d'assistance
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: theme.primary,
            '&:hover': { bgcolor: '#1565c0' },
            textTransform: 'none',
            px: 3,
          }}
        >
          Nouvelle Campagne
        </Button>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Campagnes"
            value={stats.total}
            icon={CampaignIcon}
            color={theme.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="En cours"
            value={stats.enCours}
            icon={TrendingUpIcon}
            color={theme.success}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="À venir"
            value={stats.aVenir}
            icon={PeopleIcon}
            color={theme.info}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Budget Total"
            value={formatCurrency(stats.budgetTotal)}
            icon={MoneyIcon}
            color={theme.warning}
          />
        </Grid>
      </Grid>

      {/* Barre de recherche et filtres */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Rechercher une campagne..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { border: 'none' },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filtrer par statut"
              value={filterStatut}
              onChange={(e) => {
                setFilterStatut(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="À venir">À venir</MenuItem>
              <MenuItem value="En cours">En cours</MenuItem>
              <MenuItem value="Terminée">Terminée</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : campagnes.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CampaignIcon sx={{ fontSize: 64, color: theme.secondary, mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Aucune campagne trouvée
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {search || filterStatut 
                ? 'Aucun résultat ne correspond à vos critères de recherche'
                : 'Commencez par créer votre première campagne'
              }
            </Typography>
            {!search && !filterStatut && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Créer une campagne
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.background }}>
                    <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date début</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date fin</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Lieu</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Bénéficiaires</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campagnes.map((campagne) => (
                    <TableRow key={campagne.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {campagne.nom || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {campagne.type_assistance?.libelle || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(campagne.date_debut)}</TableCell>
                      <TableCell>{formatDate(campagne.date_fin)}</TableCell>
                      <TableCell>{campagne.lieu || '-'}</TableCell>
                      <TableCell>{formatCurrency(campagne.budget)}</TableCell>
                      <TableCell align="center">
                        {campagne.nombre_beneficiaires_prevus || 0}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={campagne.statut}
                          color={getStatutColor(campagne.statut)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(campagne)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(campagne.id, campagne.nom)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <TablePagination
              component="div"
              count={totalRows}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Lignes par page"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </>
        )}
      </Paper>

      {/* Dialog Formulaire */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: theme.background, borderBottom: `2px solid ${theme.primary}` }}>
          <Typography variant="h6" fontWeight={600}>
            {editingCampagne ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Tous les champs sont optionnels
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom de la campagne"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                error={!!errors.nom}
                helperText={errors.nom}
                placeholder="Ex: Campagne Lunettes 2025"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Type d'assistance"
                value={formData.type_assistance_id}
                onChange={(e) => handleChange('type_assistance_id', e.target.value)}
                error={!!errors.type_assistance_id}
                helperText={errors.type_assistance_id}
              >
                <MenuItem value="">
                  <em>Non spécifié</em>
                </MenuItem>
                {typesAssistance.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.libelle}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lieu"
                value={formData.lieu}
                onChange={(e) => handleChange('lieu', e.target.value)}
                error={!!errors.lieu}
                helperText={errors.lieu}
                placeholder="Ex: Rabat, Casablanca..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date de début"
                InputLabelProps={{ shrink: true }}
                value={formData.date_debut}
                onChange={(e) => handleChange('date_debut', e.target.value)}
                error={!!errors.date_debut}
                helperText={errors.date_debut}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date de fin"
                InputLabelProps={{ shrink: true }}
                value={formData.date_fin}
                onChange={(e) => handleChange('date_fin', e.target.value)}
                error={!!errors.date_fin}
                helperText={errors.date_fin}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Budget (DH)"
                value={formData.budget}
                onChange={(e) => handleChange('budget', e.target.value)}
                error={!!errors.budget}
                helperText={errors.budget}
                inputProps={{ min: 0, step: 0.01 }}
                placeholder="0.00"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Nombre de bénéficiaires prévus"
                value={formData.nombre_beneficiaires_prevus}
                onChange={(e) => handleChange('nombre_beneficiaires_prevus', e.target.value)}
                error={!!errors.nombre_beneficiaires_prevus}
                helperText={errors.nombre_beneficiaires_prevus}
                inputProps={{ min: 0 }}
                placeholder="0"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Détails supplémentaires sur la campagne..."
              />
            </Grid>
          </Grid>

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Veuillez corriger les erreurs avant de continuer
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={submitting}
            sx={{ textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            sx={{ textTransform: 'none', minWidth: 100 }}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              editingCampagne ? 'Modifier' : 'Créer'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampagnesPage;