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
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  Cancel as CancelIcon,
  Campaign as CampaignIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { beneficiaireService, campagneService, dictionaryService } from '../../services/api';

const theme = {
  primary: '#1976d2',
  secondary: '#546e7a',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  background: '#f5f7fa',
  white: '#ffffff',
  tableHeader: '#e3f2fd',
  tableBorder: '#e0e0e0',
  tableHover: '#f5f5f5',
};

const BeneficiairesPage = () => {
  // States pour les bénéficiaires
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [beneficiairesPage, setBeneficiairesPage] = useState(0);
  const [beneficiairesRowsPerPage, setBeneficiairesRowsPerPage] = useState(10);
  const [beneficiaresTotalRows, setBeneficiaresTotalRows] = useState(0);
  const [beneficiairesSearch, setBeneficiairesSearch] = useState('');
  const [beneficiairesSearchInput, setBeneficiairesSearchInput] = useState('');
  const [beneficiairesLoading, setBeneficiairesLoading] = useState(false);
  
  // States pour les listes
  const [listeData, setListeData] = useState([]);
  const [listePage, setListePage] = useState(0);
  const [listeRowsPerPage, setListeRowsPerPage] = useState(10);
  const [listeTotalRows, setListeTotalRows] = useState(0);
  const [listeSearch, setListeSearch] = useState('');
  const [listeSearchInput, setListeSearchInput] = useState('');
  const [listeLoading, setListeLoading] = useState(false);
  const [listeTabValue, setListeTabValue] = useState(0);
  const [listeStats, setListeStats] = useState({
    total_participants: 0,
    total_participants_oui: 0,
    total_acceptes: 0,
    total_attente: 0,
    total_refuses: 0,
  });
  const [exportLoading, setExportLoading] = useState(false);
  
  // States communs
  const [campagnes, setCampagnes] = useState([]);
  const [typesAssistance, setTypesAssistance] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedCampagne, setSelectedCampagne] = useState('');
  const [selectedCampagneData, setSelectedCampagneData] = useState(null);
  
  // States pour les dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingBeneficiaire, setEditingBeneficiaire] = useState(null);
  const [viewingBeneficiaire, setViewingBeneficiaire] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importTypeAssistance, setImportTypeAssistance] = useState('');
  const [importCampagne, setImportCampagne] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    sexe: '',
    date_naissance: '',
    cin: '',
    telephone: '',
    email: '',
    adresse: '',
    commune_id: '',
    type_assistance_id: '',
    hors_campagne: false,
    campagne_id: '',
    decision: 'En attente',
    a_beneficie: false,
    observation: '',
    enfant_scolarise: null,
    cote: null,
  });

  const decisions = ['Accepté', 'En attente', 'Refusé'];

  // Effets
  useEffect(() => {
    fetchBeneficiaires();
  }, [beneficiairesPage, beneficiairesRowsPerPage, beneficiairesSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBeneficiairesSearch(beneficiairesSearchInput);
      setBeneficiairesPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [beneficiairesSearchInput]);

  useEffect(() => {
    if (selectedCampagne) {
      fetchListeData();
      fetchListeStats();
      fetchSelectedCampagneData();
    } else {
      setListeData([]);
      setListeTotalRows(0);
      setSelectedCampagneData(null);
      setListeStats({
        total_participants: 0,
        total_participants_oui: 0,
        total_acceptes: 0,
        total_attente: 0,
        total_refuses: 0,
      });
    }
  }, [selectedCampagne, listePage, listeRowsPerPage, listeSearch, listeTabValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setListeSearch(listeSearchInput);
      setListePage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [listeSearchInput]);

  useEffect(() => {
    fetchCampagnes();
    fetchTypesAssistance();
    fetchCommunes();
  }, []);

  useEffect(() => {
    if (importCampagne && openImportDialog) {
      const campagne = campagnes.find(c => c.id === parseInt(importCampagne));
      if (campagne && campagne.type_assistance_id) {
        setImportTypeAssistance(campagne.type_assistance_id);
      }
    }
  }, [importCampagne, openImportDialog, campagnes]);

  // Charger automatiquement le type d'assistance quand on sélectionne une campagne
  useEffect(() => {
    if (formData.campagne_id && campagnes.length > 0) {
      const selectedCamp = campagnes.find(c => c.id === parseInt(formData.campagne_id));
      if (selectedCamp && selectedCamp.type_assistance_id) {
        setFormData(prev => ({
          ...prev,
          type_assistance_id: selectedCamp.type_assistance_id
        }));
      }
    }
  }, [formData.campagne_id, campagnes]);

  // Vider la campagne si "Hors campagne" est coché
  useEffect(() => {
    if (formData.hors_campagne) {
      setFormData(prev => ({
        ...prev,
        campagne_id: ''
      }));
    }
  }, [formData.hors_campagne]);

  // Fonctions de chargement
  const fetchBeneficiaires = async () => {
    setBeneficiairesLoading(true);
    try {
      const response = await beneficiaireService.getAll({
        page: beneficiairesPage + 1,
        per_page: beneficiairesRowsPerPage,
        search: beneficiairesSearch,
      });
      setBeneficiaires(response.data.data.data);
      setBeneficiaresTotalRows(response.data.data.total);
    } catch (error) {
      toast.error('Erreur lors du chargement des bénéficiaires');
      console.error(error);
    } finally {
      setBeneficiairesLoading(false);
    }
  };
  
  const fetchListeData = async () => {
    if (!selectedCampagne) return;
    
    setListeLoading(true);
    try {
      let response;
      
      if (listeTabValue === 0) {
        response = await beneficiaireService.getParticipantsByCampagne(selectedCampagne, {
          page: listePage + 1,
          per_page: listeRowsPerPage,
          search: listeSearch,
          statut: 'tous',
        });
      } else if (listeTabValue === 1) {
        response = await beneficiaireService.getListePrincipale(selectedCampagne, {
          page: listePage + 1,
          per_page: listeRowsPerPage,
          search: listeSearch,
        });
      } else if (listeTabValue === 2) {
        response = await beneficiaireService.getListeAttente(selectedCampagne, {
          page: listePage + 1,
          per_page: listeRowsPerPage,
          search: listeSearch,
        });
      } else {
        response = await beneficiaireService.getListeRefusee(selectedCampagne, {
          page: listePage + 1,
          per_page: listeRowsPerPage,
          search: listeSearch,
        });
      }
      
      setListeData(response.data.data.data);
      setListeTotalRows(response.data.data.total);
    } catch (error) {
      toast.error('Erreur lors du chargement de la liste');
      console.error(error);
    } finally {
      setListeLoading(false);
    }
  };

  const fetchListeStats = async () => {
    if (!selectedCampagne) return;
    
    try {
      const response = await beneficiaireService.getStatistiquesListes(selectedCampagne);
      setListeStats(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const fetchSelectedCampagneData = async () => {
    if (!selectedCampagne) return;
    
    try {
      const response = await campagneService.getOne(selectedCampagne);
      setSelectedCampagneData(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement de la campagne:', error);
    }
  };

  const fetchCampagnes = async () => {
    try {
      const response = await campagneService.getAll({});
      setCampagnes(response.data.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTypesAssistance = async () => {
    try {
      const response = await dictionaryService.getAll('type_assistances', { is_active: 1 });
      setTypesAssistance(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCommunes = async () => {
    try {
      const response = await dictionaryService.getAll('communes', { is_active: 1 });
      setCommunes(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fonctions de gestion
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.sexe) newErrors.sexe = 'Le sexe est requis';
    if (!formData.date_naissance) newErrors.date_naissance = 'La date de naissance est requise';
    if (!formData.cin.trim()) newErrors.cin = 'Le CIN est requis';
    if (!formData.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!formData.adresse.trim()) newErrors.adresse = 'L\'adresse est requise';
    if (!formData.commune_id) newErrors.commune_id = 'La commune est requise';
    if (!formData.type_assistance_id) newErrors.type_assistance_id = 'Le type d\'assistance est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (beneficiaire = null) => {
    if (beneficiaire) {
      setEditingBeneficiaire(beneficiaire);
      setFormData({
        nom: beneficiaire.nom,
        prenom: beneficiaire.prenom,
        sexe: beneficiaire.sexe,
        date_naissance: beneficiaire.date_naissance,
        cin: beneficiaire.cin,
        telephone: beneficiaire.telephone,
        email: beneficiaire.email || '',
        adresse: beneficiaire.adresse,
        commune_id: beneficiaire.commune_id,
        type_assistance_id: beneficiaire.type_assistance_id,
        hors_campagne: beneficiaire.hors_campagne,
        campagne_id: beneficiaire.campagne_id || '',
        decision: beneficiaire.decision,
        a_beneficie: beneficiaire.a_beneficie,
        observation: beneficiaire.observation || '',
        enfant_scolarise: beneficiaire.enfant_scolarise,
        cote: beneficiaire.cote || null,
      });
    } else {
      setEditingBeneficiaire(null);
      setFormData({
        nom: '',
        prenom: '',
        sexe: '',
        date_naissance: '',
        cin: '',
        telephone: '',
        email: '',
        adresse: '',
        commune_id: '',
        type_assistance_id: '',
        hors_campagne: false,
        campagne_id: '',
        decision: 'En attente',
        a_beneficie: false,
        observation: '',
        enfant_scolarise: null,
        cote: null,
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBeneficiaire) {
        await beneficiaireService.update(editingBeneficiaire.id, formData);
        toast.success('Bénéficiaire mis à jour avec succès');
      } else {
        await beneficiaireService.create(formData);
        toast.success('Bénéficiaire créé avec succès');
      }
      setOpenDialog(false);
      fetchBeneficiaires();
      if (selectedCampagne) {
        fetchListeData();
        fetchListeStats();
      }
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

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
      return;
    }

    try {
      await beneficiaireService.delete(id);
      toast.success('Bénéficiaire supprimé avec succès');
      fetchBeneficiaires();
      if (selectedCampagne) {
        fetchListeData();
        fetchListeStats();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  };

  const handleToggleBeneficiaireStatus = async (beneficiaire) => {
    const newStatus = !beneficiaire.a_beneficie;
    const statusText = newStatus ? 'A bénéficié' : 'En attente';
    
    const confirmed = window.confirm(
      `Changer le statut de ${beneficiaire.nom} ${beneficiaire.prenom} vers "${statusText}" ?`
    );
    
    if (!confirmed) return;
    
    try {
      await beneficiaireService.update(beneficiaire.id, {
        ...beneficiaire,
        a_beneficie: newStatus
      });

      const action = newStatus ? 'marqué comme ayant bénéficié' : 'remis en attente';
      toast.success(`${beneficiaire.nom} ${beneficiaire.prenom} ${action} avec succès !`);
      
      fetchBeneficiaires();
      
      if (selectedCampagne) {
        fetchListeData();
        fetchListeStats();
      }

    } catch (error) {
      console.error('Erreur changement statut:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de statut';
      toast.error(errorMessage);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importCampagne || !importTypeAssistance) {
      toast.error('Veuillez sélectionner une campagne, un type d\'assistance et un fichier');
      return;
    }

    const formDataImport = new FormData();
    formDataImport.append('file', importFile);
    formDataImport.append('campagne_id', importCampagne);
    formDataImport.append('type_assistance_id', importTypeAssistance);

    setSubmitting(true);
    try {
      const response = await beneficiaireService.import(formDataImport);
      
      const { imported, errors: importErrors, skipped, message } = response.data;
      
      if (imported > 0) {
        toast.success(message);
        setOpenImportDialog(false);
        setImportFile(null);
        setImportTypeAssistance('');
        setImportCampagne('');
        fetchBeneficiaires();
        if (selectedCampagne) {
          fetchListeData();
          fetchListeStats();
        }
      } else {
        toast.warning('Aucun bénéficiaire importé');
      }
      
      if (importErrors && importErrors.length > 0) {
        console.error('Erreurs d\'importation:', importErrors);
        importErrors.slice(0, 3).forEach(error => {
          toast.error(error, { autoClose: 8000 });
        });
        if (importErrors.length > 3) {
          toast.info(`... et ${importErrors.length - 3} autres erreurs (voir console)`);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Erreur lors de l\'importation';
      toast.error(errorMsg);
      console.error('Import error:', error.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportParticipants = async () => {
    if (!selectedCampagne) {
      toast.error('Veuillez sélectionner une campagne');
      return;
    }

    setExportLoading(true);
    try {
      const response = await beneficiaireService.exportParticipantsAcceptes(selectedCampagne);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const campagneName = campagnes.find(c => c.id === parseInt(selectedCampagne))?.nom || 'campagne';
      link.setAttribute('download', `participants_acceptes_${campagneName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export réussi !');
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de l\'export';
      toast.error(message);
    } finally {
      setExportLoading(false);
    }
  };

  const showConditionalFields = () => {
    const selectedType = typesAssistance.find(t => t.id === formData.type_assistance_id);
    return selectedType?.libelle === 'Lunettes' || selectedType?.libelle === 'Appareil auditif';
  };

  const showCoteField = () => {
    const selectedType = typesAssistance.find(t => t.id === formData.type_assistance_id);
    return selectedType?.libelle === 'Appareil auditif';
  };

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Fonction pour obtenir le nom de la campagne
  const getCampagneName = (beneficiaire) => {
    if (beneficiaire.hors_campagne) {
      return 'Hors campagne';
    }
    if (beneficiaire.campagne_id) {
      const campagne = campagnes.find(c => c.id === beneficiaire.campagne_id);
      return campagne?.nom || '-';
    }
    return '-';
  };

  // Composant StatCard
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card 
      sx={{ 
        height: '100%', 
        borderLeft: `5px solid ${theme[color]}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" color={theme[color]}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${theme[color]}20`,
              color: theme[color],
            }}
          >
            <Icon sx={{ fontSize: 32 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Style pour les cellules d'en-tête de tableau
  const tableHeaderStyle = {
    fontWeight: 700,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.primary,
    bgcolor: theme.tableHeader,
    borderBottom: `2px solid ${theme.primary}`,
    py: 2,
  };

  // Style pour les lignes du tableau
  const tableRowStyle = {
    '&:hover': { 
      bgcolor: theme.tableHover,
      transition: 'background-color 0.2s ease',
    },
    borderBottom: `1px solid ${theme.tableBorder}`,
  };

  // Chargement initial
  if (beneficiairesLoading && beneficiaires.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          Chargement des bénéficiaires...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: theme.primary }}>
            Gestion des Bénéficiaires
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Système UPAS - Gestion des campagnes d'assistance médicale
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => setOpenImportDialog(true)}
            sx={{ 
              borderWidth: 2,
              '&:hover': { borderWidth: 2 },
            }}
          >
            Importer Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: theme.primary,
              '&:hover': { bgcolor: '#1565c0' },
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            }}
          >
            Nouveau Bénéficiaire
          </Button>
        </Stack>
      </Box>

      {/* Section Listes par Campagne */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: `1px solid ${theme.tableBorder}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <CampaignIcon sx={{ color: theme.primary, fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700} sx={{ color: theme.primary }}>
            Listes par campagne
          </Typography>
        </Box>

        {/* Filtres */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Sélectionner une campagne</InputLabel>
              <Select
                value={selectedCampagne}
                onChange={(e) => {
                  setSelectedCampagne(e.target.value);
                  setListePage(0);
                  setListeTabValue(0);
                }}
                label="Sélectionner une campagne"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  }
                }}
              >
                <MenuItem value="">Aucune campagne</MenuItem>
                {campagnes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher dans les listes..."
              value={listeSearchInput}
              onChange={(e) => setListeSearchInput(e.target.value)}
              disabled={!selectedCampagne}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderWidth: 2,
                  }
                }
              }}
            />
          </Grid>
        </Grid>

        {selectedCampagne ? (
          <>
            {/* Info campagne et export */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Alert 
                severity="info" 
                sx={{ 
                  flex: 1, 
                  minWidth: 300,
                  borderLeft: `4px solid ${theme.info}`,
                  bgcolor: '#e3f2fd',
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  {campagnes.find(c => c.id === parseInt(selectedCampagne))?.nom}
                </Typography>
                {selectedCampagneData && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Type d'assistance : <strong>{selectedCampagneData.type_assistance?.libelle || 'N/A'}</strong>
                  </Typography>
                )}
              </Alert>
              <Button
                variant="contained"
                startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                onClick={handleExportParticipants}
                disabled={exportLoading || listeStats.total_participants_oui === 0}
                sx={{ 
                  bgcolor: theme.success, 
                  '&:hover': { bgcolor: '#1b5e20' },
                  fontWeight: 600,
                  px: 3,
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                }}
              >
                Exporter ({listeStats.total_participants_oui})
              </Button>
            </Box>

            {/* Statistiques */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Tous les participants"
                  value={listeStats.total_participants}
                  icon={PeopleIcon}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Acceptés"
                  value={listeStats.total_acceptes}
                  icon={CheckCircleIcon}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="En attente"
                  value={listeStats.total_attente}
                  icon={HourglassIcon}
                  color="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Refusés"
                  value={listeStats.total_refuses}
                  icon={CancelIcon}
                  color="error"
                />
              </Grid>
            </Grid>

            {/* Tabs */}
            <Box sx={{ borderBottom: 2, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={listeTabValue}
                onChange={(e, newValue) => {
                  setListeTabValue(newValue);
                  setListePage(0);
                }}
                TabIndicatorProps={{
                  sx: { height: 3, borderRadius: '3px 3px 0 0' }
                }}
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    minHeight: 56,
                  }
                }}
              >
                <Tab label="Tous les participants" />
                <Tab label="Liste principale (Acceptés)" />
                <Tab label="Liste d'attente" />
                <Tab label="Liste refusée" />
              </Tabs>
            </Box>

            {/* Table des listes */}
            {listeLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress size={50} />
              </Box>
            ) : listeData.length === 0 ? (
              <Alert severity="info" sx={{ borderLeft: `4px solid ${theme.info}` }}>
                Aucune donnée trouvée dans cette liste
              </Alert>
            ) : (
              <>
                <TableContainer 
                  sx={{ 
                    borderRadius: 2,
                    border: `1px solid ${theme.tableBorder}`,
                    overflow: 'auto',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={tableHeaderStyle}>CIN</TableCell>
                        <TableCell sx={tableHeaderStyle}>Nom complet</TableCell>
                        <TableCell sx={tableHeaderStyle}>Sexe</TableCell>
                        <TableCell sx={tableHeaderStyle}>Téléphone</TableCell>
                        <TableCell sx={tableHeaderStyle}>Commune</TableCell>
                        <TableCell sx={tableHeaderStyle}>
                          {listeTabValue === 0 ? 'Statut' : 'Décision'}
                        </TableCell>
                        <TableCell sx={tableHeaderStyle}>Date Appel</TableCell>
                        <TableCell sx={tableHeaderStyle}>Observation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {listeData.map((item) => {
                        const isParticipant = item.type === 'participant' || listeTabValue === 0;
                        return (
                          <TableRow key={item.id} sx={tableRowStyle}>
                            <TableCell sx={{ fontWeight: 600, color: theme.primary }}>{item.cin}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {`${item.nom} ${item.prenom}`}
                              </Typography>
                            </TableCell>
                            <TableCell>{item.sexe === 'M' ? 'Masculin' : 'Féminin'}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{item.telephone}</TableCell>
                            <TableCell>{item.commune?.nom || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={isParticipant ? item.statut : item.decision}
                                color={
                                  (isParticipant ? item.statut : item.decision) === 'Accepté' || item.statut === 'Oui' ? 'success' :
                                  (isParticipant ? item.statut : item.decision) === 'En attente' ? 'warning' :
                                  'error'
                                }
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>{item.date_appel || '-'}</TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: 200, 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  color: 'text.secondary',
                                }}
                              >
                                {(isParticipant ? item.observation_appel : item.observation) || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Divider />
                <TablePagination
                  component="div"
                  count={listeTotalRows}
                  page={listePage}
                  onPageChange={(e, newPage) => setListePage(newPage)}
                  rowsPerPage={listeRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setListeRowsPerPage(parseInt(e.target.value, 10));
                    setListePage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                  labelRowsPerPage="Lignes par page"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                  sx={{
                    '& .MuiTablePagination-toolbar': {
                      minHeight: 64,
                    }
                  }}
                />
              </>
            )}
          </>
        ) : (
          <Alert severity="info" sx={{ borderLeft: `4px solid ${theme.info}`, py: 3 }}>
            <Typography variant="body1" fontWeight={500}>
              Sélectionnez une campagne pour afficher les listes
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Section Liste des Bénéficiaires */}
      <Paper 
        sx={{ 
          p: 3,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: `1px solid ${theme.tableBorder}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon sx={{ color: theme.primary, fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700} sx={{ color: theme.primary }}>
              Liste des bénéficiaires
            </Typography>
          </Box>
          <TextField
            size="medium"
            placeholder="Rechercher..."
            value={beneficiairesSearchInput}
            onChange={(e) => setBeneficiairesSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ 
              width: 350,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderWidth: 2,
                }
              }
            }}
          />
        </Box>

        {beneficiairesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={50} />
          </Box>
        ) : beneficiaires.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 80, color: theme.secondary, mb: 2, opacity: 0.5 }} />
            <Typography variant="h5" color="textSecondary" gutterBottom fontWeight={600}>
              Aucun bénéficiaire trouvé
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
              Commencez par ajouter un nouveau bénéficiaire
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<AddIcon />} 
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: theme.primary,
                fontWeight: 600,
                px: 4,
                py: 1.5,
              }}
            >
              Ajouter un bénéficiaire
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ position: 'relative', overflow: 'auto' }}>
              <TableContainer 
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${theme.tableBorder}`,
                  overflow: 'auto',
                  maxWidth: '100%',
                }}
              >
                <Table sx={{ minWidth: 1400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 120 }}>CIN</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 180 }}>Nom complet</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 100 }}>Sexe</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 80 }}>Âge</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 130 }}>Téléphone</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 130 }}>Commune</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 150 }}>Type assistance</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 150 }}>Campagne</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 120 }}>Décision</TableCell>
                      <TableCell sx={{ ...tableHeaderStyle, minWidth: 120 }}>Statut</TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          ...tableHeaderStyle, 
                          minWidth: 200,
                          position: 'sticky', 
                          right: 0, 
                          bgcolor: theme.tableHeader,
                          zIndex: 2,
                          boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {beneficiaires.map((b) => {
                      const age = calculateAge(b.date_naissance);
                      return (
                        <TableRow key={b.id} sx={tableRowStyle}>
                          <TableCell sx={{ fontWeight: 600, color: theme.primary }}>{b.cin}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {b.full_name || `${b.nom} ${b.prenom}`}
                            </Typography>
                          </TableCell>
                          <TableCell>{b.sexe === 'M' ? 'Masculin' : 'Féminin'}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{age ? `${age} ans` : '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{b.telephone}</TableCell>
                          <TableCell>{b.commune?.nom || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={b.type_assistance?.libelle || '-'} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            {b.hors_campagne ? (
                              <Chip 
                                label="Hors campagne" 
                                size="small" 
                                color="info"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {getCampagneName(b)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={b.decision}
                              color={
                                b.decision === 'Accepté' ? 'success' :
                                b.decision === 'En attente' ? 'warning' :
                                'error'
                              }
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={b.a_beneficie ? 'A bénéficié' : 'En attente'}
                              color={b.a_beneficie ? 'success' : 'warning'}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{
                              position: 'sticky',
                              right: 0,
                              bgcolor: theme.white,
                              zIndex: 1,
                              boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
                            }}
                          >
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Voir détails">
                                <IconButton 
                                  size="small" 
                                  color="info"
                                  onClick={() => {
                                    setViewingBeneficiaire(b);
                                    setOpenViewDialog(true);
                                  }}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: '#e3f2fd',
                                    }
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Modifier">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleOpenDialog(b)}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: '#e8eaf6',
                                    }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={b.a_beneficie ? "Marquer comme 'En attente'" : "Marquer comme 'A bénéficié'"}>
                                <IconButton
                                  size="small"
                                  color={b.a_beneficie ? "warning" : "success"}
                                  onClick={() => handleToggleBeneficiaireStatus(b)}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: b.a_beneficie ? '#fff3e0' : '#e8f5e9',
                                    }
                                  }}
                                >
                                  {b.a_beneficie ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleDelete(b.id)}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: '#ffebee',
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Divider />
            <TablePagination
              component="div"
              count={beneficiaresTotalRows}
              page={beneficiairesPage}
              onPageChange={(e, newPage) => setBeneficiairesPage(newPage)}
              rowsPerPage={beneficiairesRowsPerPage}
              onRowsPerPageChange={(e) => {
                setBeneficiairesRowsPerPage(parseInt(e.target.value, 10));
                setBeneficiairesPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Lignes par page"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
              sx={{
                '& .MuiTablePagination-toolbar': {
                  minHeight: 64,
                }
              }}
            />
          </>
        )}
      </Paper>

      {/* Dialog Formulaire Bénéficiaire */}
      <Dialog 
        open={openDialog} 
        onClose={() => !submitting && setOpenDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: theme.tableHeader, borderBottom: `3px solid ${theme.primary}`, py: 2.5 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: theme.primary }}>
            {editingBeneficiaire ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                error={!!errors.nom}
                helperText={errors.nom}
                required
                InputLabelProps={{ sx: { fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prénom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                error={!!errors.prenom}
                helperText={errors.prenom}
                required
                InputLabelProps={{ sx: { fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!errors.sexe} required>
                <InputLabel sx={{ fontWeight: 600 }}>Sexe</InputLabel>
                <Select
                  value={formData.sexe}
                  onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                  label="Sexe"
                >
                  <MenuItem value="M">Masculin</MenuItem>
                  <MenuItem value="F">Féminin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Date de naissance"
                InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
                value={formData.date_naissance}
                onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                error={!!errors.date_naissance}
                helperText={errors.date_naissance}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CIN"
                value={formData.cin}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                error={!!errors.cin}
                helperText={errors.cin}
                required
                InputLabelProps={{ sx: { fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                error={!!errors.telephone}
                helperText={errors.telephone}
                required
                InputLabelProps={{ sx: { fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                error={!!errors.adresse}
                helperText={errors.adresse}
                required
                InputLabelProps={{ sx: { fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.commune_id} required>
                <InputLabel sx={{ fontWeight: 600 }}>Commune</InputLabel>
                <Select
                  value={formData.commune_id}
                  onChange={(e) => setFormData({ ...formData, commune_id: e.target.value })}
                  label="Commune"
                >
                  {communes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.type_assistance_id} required>
                <InputLabel sx={{ fontWeight: 600 }}>Type d'assistance</InputLabel>
                <Select
                  value={formData.type_assistance_id}
                  onChange={(e) => setFormData({ ...formData, type_assistance_id: e.target.value })}
                  label="Type d'assistance"
                >
                  {typesAssistance.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.libelle}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hors_campagne || false}
                    onChange={(e) => setFormData({ ...formData, hors_campagne: e.target.checked })}
                  />
                }
                label={
                  <Typography fontWeight={600}>
                    Hors campagne
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <FormControl fullWidth disabled={formData.hors_campagne}>
                <InputLabel sx={{ fontWeight: 600 }}>Campagne</InputLabel>
                <Select
                  value={formData.campagne_id}
                  onChange={(e) => setFormData({ ...formData, campagne_id: e.target.value })}
                  label="Campagne"
                >
                  <MenuItem value="">Aucune</MenuItem>
                  {campagnes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.hors_campagne && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  La campagne est désactivée car "Hors campagne" est coché
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 600 }}>Décision</InputLabel>
                <Select
                  value={formData.decision}
                  onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                  label="Décision"
                >
                  {decisions.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.a_beneficie || false}
                    onChange={(e) => setFormData({ ...formData, a_beneficie: e.target.checked })}
                  />
                }
                label={
                  <Typography fontWeight={600}>
                    A bénéficié
                  </Typography>
                }
              />
            </Grid>
            {showConditionalFields() && (
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enfant_scolarise || false}
                      onChange={(e) => setFormData({ ...formData, enfant_scolarise: e.target.checked })}
                    />
                  }
                  label={
                    <Typography fontWeight={600}>
                      Enfant scolarisé
                    </Typography>
                  }
                />
              </Grid>
            )}
            {showCoteField() && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ fontWeight: 600 }}>Côté</InputLabel>
                  <Select
                    value={formData.cote || ''}
                    onChange={(e) => setFormData({ ...formData, cote: e.target.value })}
                    label="Côté"
                  >
                    <MenuItem value="">Aucun</MenuItem>
                    <MenuItem value="Unilatéral">Unilatéral</MenuItem>
                    <MenuItem value="Bilatéral">Bilatéral</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observation"
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                InputLabelProps={{ sx: { fontWeight: 600 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: theme.background, gap: 1 }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            disabled={submitting}
            variant="outlined"
            sx={{ px: 3 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
              px: 3,
              fontWeight: 600,
            }}
          >
            {submitting ? 'Enregistrement...' : (editingBeneficiaire ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Import */}
      <Dialog 
        open={openImportDialog} 
        onClose={() => !submitting && setOpenImportDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: theme.tableHeader, borderBottom: `3px solid ${theme.primary}`, py: 2.5 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: theme.primary }}>
            Importer des bénéficiaires
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 600 }}>Campagne</InputLabel>
              <Select
                value={importCampagne}
                onChange={(e) => setImportCampagne(e.target.value)}
                label="Campagne"
              >
                {campagnes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 600 }}>Type d'assistance</InputLabel>
              <Select
                value={importTypeAssistance}
                onChange={(e) => setImportTypeAssistance(e.target.value)}
                label="Type d'assistance"
              >
                {typesAssistance.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.libelle}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <input
                type="file"
                id="import-file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <label htmlFor="import-file">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ 
                    py: 1.5,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 },
                  }}
                >
                  {importFile ? importFile.name : 'Choisir un fichier Excel'}
                </Button>
              </label>
            </Box>

            <Alert 
              severity="info" 
              sx={{ 
                borderLeft: `4px solid ${theme.info}`,
                bgcolor: '#e3f2fd',
              }}
            >
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Format du fichier Excel requis :
              </Typography>
              <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                • Ligne 1 : En-têtes (Nom, Prénom, Sexe, Date naissance, CIN, Téléphone, Email, Adresse, Commune)
              </Typography>
              <Typography variant="caption" component="div">
                • Lignes suivantes : Données des bénéficiaires
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: theme.background, gap: 1 }}>
          <Button 
            onClick={() => setOpenImportDialog(false)} 
            disabled={submitting}
            variant="outlined"
            sx={{ px: 3 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleImport} 
            variant="contained" 
            disabled={submitting || !importFile || !importCampagne || !importTypeAssistance}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
              px: 3,
              fontWeight: 600,
            }}
          >
            {submitting ? 'Importation...' : 'Importer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Visualisation Détails */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: theme.tableHeader, borderBottom: `3px solid ${theme.primary}`, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <VisibilityIcon sx={{ color: theme.primary, fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700} sx={{ color: theme.primary }}>
              Détails du bénéficiaire
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {viewingBeneficiaire && (
            <Box>
              {/* En-tête avec statuts */}
              <Box sx={{ mb: 3, p: 3, bgcolor: theme.background, borderRadius: 2, border: `2px solid ${theme.tableBorder}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: theme.primary }}>
                    {viewingBeneficiaire.full_name || `${viewingBeneficiaire.nom} ${viewingBeneficiaire.prenom}`}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={viewingBeneficiaire.decision}
                      color={
                        viewingBeneficiaire.decision === 'Accepté' ? 'success' :
                        viewingBeneficiaire.decision === 'En attente' ? 'warning' :
                        'error'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={viewingBeneficiaire.a_beneficie ? 'A bénéficié' : 'En attente'}
                      color={viewingBeneficiaire.a_beneficie ? 'success' : 'warning'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </Box>
                <Typography variant="body2" color="textSecondary" fontWeight={500}>
                  ID: #{viewingBeneficiaire.id} • CIN: {viewingBeneficiaire.cin}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Informations Personnelles */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, bgcolor: theme.background, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                      <PeopleIcon sx={{ color: theme.primary, fontSize: 28 }} />
                      <Typography variant="h6" fontWeight={700}>
                        Informations Personnelles
                      </Typography>
                    </Box>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Nom complet
                          </Typography>
                          <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                            {viewingBeneficiaire.prenom} {viewingBeneficiaire.nom}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Sexe
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {viewingBeneficiaire.sexe === 'M' ? 'Masculin' : 'Féminin'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Date de naissance
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {viewingBeneficiaire.date_naissance ? 
                              new Date(viewingBeneficiaire.date_naissance).toLocaleDateString('fr-FR') : 
                              '-'
                            }
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Âge
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {calculateAge(viewingBeneficiaire.date_naissance) 
                              ? `${calculateAge(viewingBeneficiaire.date_naissance)} ans` 
                              : '-'
                            }
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            CIN
                          </Typography>
                          <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                            {viewingBeneficiaire.cin}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Téléphone
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {viewingBeneficiaire.telephone}
                          </Typography>
                        </Box>
                      </Grid>
                      {viewingBeneficiaire.email && (
                        <Grid item xs={12}>
                          <Box>
                            <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Email
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {viewingBeneficiaire.email}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>

                {/* Adresse */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, height: '100%', borderRadius: 2, border: `1px solid ${theme.tableBorder}` }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Adresse
                    </Typography>
                    <Box>
                      <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Adresse complète
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, mt: 0.5 }}>
                        {viewingBeneficiaire.adresse}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Commune
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={viewingBeneficiaire.commune?.nom || 'Non spécifiée'} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Assistance */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, height: '100%', borderRadius: 2, border: `1px solid ${theme.tableBorder}` }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Assistance
                    </Typography>
                    <Box>
                      <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Type d'assistance
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ mb: 2, mt: 0.5 }}>
                        {viewingBeneficiaire.type_assistance?.libelle || '-'}
                      </Typography>
                      
                      {viewingBeneficiaire.campagne_id && (
                        <>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Campagne
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 2, mt: 0.5 }}>
                            {getCampagneName(viewingBeneficiaire)}
                          </Typography>
                        </>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        {viewingBeneficiaire.hors_campagne && (
                          <Chip label="Hors campagne" size="small" color="info" sx={{ fontWeight: 600 }} />
                        )}
                        {viewingBeneficiaire.enfant_scolarise && (
                          <Chip label="Enfant scolarisé" size="small" color="success" sx={{ fontWeight: 600 }} />
                        )}
                        {viewingBeneficiaire.cote && (
                          <Chip label={`Côté: ${viewingBeneficiaire.cote}`} size="small" sx={{ fontWeight: 600 }} />
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Observation */}
                {viewingBeneficiaire.observation && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, bgcolor: '#fff8e1', borderRadius: 2, border: '2px solid #ffe082' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#f57c00' }}>
                        Observation
                      </Typography>
                      <Typography variant="body1">
                        {viewingBeneficiaire.observation}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Métadonnées */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2.5, bgcolor: theme.background, borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="textSecondary" gutterBottom fontWeight={700}>
                      Informations système
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      {viewingBeneficiaire.created_at && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Date de création
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {new Date(viewingBeneficiaire.created_at).toLocaleString('fr-FR')}
                          </Typography>
                        </Grid>
                      )}
                      {viewingBeneficiaire.updated_at && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Dernière modification
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {new Date(viewingBeneficiaire.updated_at).toLocaleString('fr-FR')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: theme.background, gap: 1 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)}
            variant="outlined"
            sx={{ px: 3 }}
          >
            Fermer
          </Button>
          <Button 
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setOpenViewDialog(false);
              handleOpenDialog(viewingBeneficiaire);
            }}
            sx={{ px: 3, fontWeight: 600 }}
          >
            Modifier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BeneficiairesPage;