import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  MenuItem,
  Typography,
  Chip,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Stack,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Avatar,
  Snackbar,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  KeyboardReturn as ReturnIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  LocalHospital,
  CheckCircle,
  Error,
  Schedule,
  Warning,
  CardGiftcard,
  ErrorOutline,
  Save,
  TrendingUp,
  AttachMoney,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, isBefore, parseISO, differenceInDays } from 'date-fns';
import { assistanceMedicaleService, beneficiaireService, dictionaryService } from '../../services/api';

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

const AssistancesMedicalesPage = () => {
  // ===== ÉTATS =====
  const [assistances, setAssistances] = useState([]);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [typesAssistance, setTypesAssistance] = useState([]);
  const [detailsTypes, setDetailsTypes] = useState([]);
  const [naturesDon, setNaturesDon] = useState([]);
  const [etatsDon, setEtatsDon] = useState([]);
  const [etatsDossier, setEtatsDossier] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openRetourDialog, setOpenRetourDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [editingAssistance, setEditingAssistance] = useState(null);
  const [selectedForRetour, setSelectedForRetour] = useState(null);
  const [selectedForView, setSelectedForView] = useState(null);
  const [assistanceToDelete, setAssistanceToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [appState, setAppState] = useState('boot');
  const [bootError, setBootError] = useState(null);
  const bootCompleted = useRef(false);
  const isCurrentlyLoading = useRef(false);

  const [stats, setStats] = useState({
    total: 0,
    prets_actifs: 0,
    prets_en_retard: 0,
    prets_retournes: 0,
    dons_definitifs: 0,
    montant_total: 0,
  });

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [formData, setFormData] = useState({
    type_assistance_id: '',
    detail_type_assistance_id: '',
    beneficiaire_id: '',
    nature_don_id: '',
    etat_don_id: '',
    etat_dossier_id: '',
    date_assistance: '',
    montant: '',
    assistance_pour_moi_meme: false,
    observation: '',
    duree_utilisation: '',
  });

  const [retourData, setRetourData] = useState({
    date_retour_effective: '',
    observation_retour: '',
  });

  // ===== FONCTIONS UTILITAIRES =====
  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({ 
      open: true, 
      message: typeof message === 'string' ? message : 'Erreur inconnue',
      severity 
    });
  }, []);

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const formatDateSafe = (dateValue, formatString = 'dd/MM/yyyy') => {
    try {
      if (!dateValue) return '';
      const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
      return format(date, formatString, { locale: fr });
    } catch (error) {
      return '';
    }
  };

  const isAPret = (assistance) => {
    return assistance.nature_don?.libelle?.toLowerCase().includes('prêt') ||
           assistance.nature_don?.libelle?.toLowerCase().includes('pret');
  };

  const getStatutPret = (assistance) => {
    if (!isAPret(assistance)) return 'don';
    if (assistance.est_retourne) return 'retourne';
    if (assistance.date_retour_prevue) {
      const dateRetour = parseISO(assistance.date_retour_prevue);
      if (isBefore(dateRetour, new Date())) return 'en_retard';
    }
    return 'en_cours';
  };

  const getJoursRestants = (assistance) => {
    if (!isAPret(assistance) || assistance.est_retourne || !assistance.date_retour_prevue) {
      return null;
    }
    const dateRetour = parseISO(assistance.date_retour_prevue);
    return differenceInDays(dateRetour, new Date());
  };

  const renderStatutBadge = (assistance) => {
    const statut = getStatutPret(assistance);
    const joursRestants = getJoursRestants(assistance);

    switch (statut) {
      case 'retourne':
        return (
          <Chip
            icon={<CheckCircle />}
            label="Retourné"
            color="success"
            size="small"
          />
        );
      case 'en_retard':
        const joursRetard = Math.abs(joursRestants || 0);
        return (
          <Tooltip title={`En retard de ${joursRetard} jour${joursRetard > 1 ? 's' : ''}`}>
            <Chip
              icon={<Error />}
              label={`En retard (${joursRetard}j)`}
              color="error"
              size="small"
            />
          </Tooltip>
        );
      case 'en_cours':
        const joursRestantsText = joursRestants !== null ? 
          (joursRestants > 0 ? `${joursRestants}j restants` : 'Échéance aujourd\'hui') : 
          'En cours';
        const isUrgent = joursRestants !== null && joursRestants <= 3 && joursRestants >= 0;
        return (
          <Chip
            icon={isUrgent ? <Warning /> : <Schedule />}
            label={joursRestantsText}
            color={isUrgent ? "warning" : "info"}
            size="small"
          />
        );
      case 'don':
      default:
        return (
          <Chip
            icon={<CardGiftcard />}
            label="Don définitif"
            color="default"
            size="small"
            variant="outlined"
          />
        );
    }
  };

  const calculateStats = useCallback((assistancesList) => {
    let stats = {
      total: assistancesList.length,
      prets_actifs: 0,
      prets_en_retard: 0,
      prets_retournes: 0,
      dons_definitifs: 0,
      montant_total: 0,
    };

    let totalMontant = 0;

    assistancesList.forEach(assistance => {
      const montant = parseFloat(assistance.montant) || 0;
      totalMontant += montant;

      const estPret = isAPret(assistance);
      
      if (estPret) {
        if (assistance.est_retourne) {
          stats.prets_retournes++;
        } else {
          const statut = getStatutPret(assistance);
          if (statut === 'en_retard') {
            stats.prets_en_retard++;
          } else {
            stats.prets_actifs++;
          }
        }
      } else {
        stats.dons_definitifs++;
      }
    });

    stats.montant_total = Math.round(totalMontant * 100) / 100;
    return stats;
  }, []);

  // ===== FONCTIONS DE CHARGEMENT =====
  const fetchAssistances = useCallback(async (forceRefresh = false) => {
    if (isCurrentlyLoading.current && !forceRefresh) return;

    isCurrentlyLoading.current = true;
    setLoading(true);

    try {
      const response = await assistanceMedicaleService.getAll({
        page: page + 1,
        per_page: rowsPerPage,
        search,
      });
      
      const assistancesList = response.data.data.data || [];
      setAssistances(assistancesList);
      setTotalRows(response.data.data.total || 0);
      
      const calculatedStats = calculateStats(assistancesList);
      setStats(calculatedStats);

    } catch (error) {
      console.error('Erreur fetch assistances:', error);
      showNotification(error.response?.data?.message || 'Erreur lors du chargement', 'error');
      setAssistances([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
      isCurrentlyLoading.current = false;
    }
  }, [page, rowsPerPage, search, calculateStats, showNotification]);

  const fetchBeneficiaires = async () => {
    try {
      const response = await beneficiaireService.getAll({ per_page: 1000 });
      setBeneficiaires(response.data.data.data || []);
    } catch (error) {
      console.error('Erreur fetch bénéficiaires:', error);
    }
  };

  const fetchDictionaries = async () => {
    try {
      const [types, natures, etatsDon, etatsDossier] = await Promise.all([
        dictionaryService.getAll('type_assistances', { is_active: 1 }),
        dictionaryService.getAll('nature_dons', { is_active: 1 }),
        dictionaryService.getAll('etat_dons', { is_active: 1 }),
        dictionaryService.getAll('etat_dossiers', { is_active: 1 }),
      ]);

      setTypesAssistance(types.data.data || []);
      setNaturesDon(natures.data.data || []);
      setEtatsDon(etatsDon.data.data || []);
      setEtatsDossier(etatsDossier.data.data || []);
    } catch (error) {
      console.error('Erreur fetch dictionnaires:', error);
    }
  };

  const fetchDetailsTypes = async (typeId) => {
    try {
      const response = await dictionaryService.getAll('detail_type_assistances', {
        is_active: 1,
        type_assistance_id: typeId,
      });
      setDetailsTypes(response.data.data || []);
    } catch (error) {
      console.error('Erreur fetch détails types:', error);
      setDetailsTypes([]);
    }
  };

  // ===== BOOT PRINCIPAL =====
  const performBoot = useCallback(async () => {
    if (bootCompleted.current || isCurrentlyLoading.current) return;

    isCurrentlyLoading.current = true;
    setAppState('boot');
    setBootError(null);

    try {
      await Promise.all([
        fetchDictionaries(),
        fetchBeneficiaires(),
      ]);
      
      await fetchAssistances(true);

      bootCompleted.current = true;
      setAppState('ready');
      setInitialLoading(false);
      
    } catch (error) {
      console.error('❌ Erreur durant le boot:', error);
      setBootError(error.message || 'Erreur lors du chargement initial');
      setAppState('error');
    } finally {
      isCurrentlyLoading.current = false;
    }
  }, [fetchAssistances]);

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAssistances(true);
      showNotification('Données actualisées avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de l\'actualisation', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAssistances, showNotification]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.beneficiaire_id) newErrors.beneficiaire_id = 'Le bénéficiaire est requis';
    if (!formData.type_assistance_id) newErrors.type_assistance_id = 'Le type est requis';
    if (!formData.nature_don_id) newErrors.nature_don_id = 'La nature est requise';
    if (!formData.etat_don_id) newErrors.etat_don_id = 'L\'état du don est requis';
    if (!formData.etat_dossier_id) newErrors.etat_dossier_id = 'L\'état du dossier est requis';
    if (!formData.date_assistance) newErrors.date_assistance = 'La date est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (assistance = null) => {
    if (assistance) {
      setEditingAssistance(assistance);
      setFormData({
        type_assistance_id: assistance.type_assistance_id || '',
        detail_type_assistance_id: assistance.detail_type_assistance_id || '',
        beneficiaire_id: assistance.beneficiaire_id || '',
        nature_don_id: assistance.nature_don_id || '',
        etat_don_id: assistance.etat_don_id || '',
        etat_dossier_id: assistance.etat_dossier_id || '',
        date_assistance: assistance.date_assistance || '',
        montant: assistance.montant || '',
        assistance_pour_moi_meme: assistance.assistance_pour_moi_meme || false,
        observation: assistance.observation || '',
        duree_utilisation: assistance.duree_utilisation || '',
      });
    } else {
      setEditingAssistance(null);
      setFormData({
        type_assistance_id: '',
        detail_type_assistance_id: '',
        beneficiaire_id: '',
        nature_don_id: '',
        etat_don_id: '',
        etat_dossier_id: '',
        date_assistance: new Date().toISOString().split('T')[0],
        montant: '',
        assistance_pour_moi_meme: false,
        observation: '',
        duree_utilisation: '',
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssistance(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs du formulaire', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const dataToSend = {
        type_assistance_id: parseInt(formData.type_assistance_id),
        detail_type_assistance_id: formData.detail_type_assistance_id ? parseInt(formData.detail_type_assistance_id) : null,
        beneficiaire_id: parseInt(formData.beneficiaire_id),
        nature_don_id: parseInt(formData.nature_don_id),
        etat_don_id: parseInt(formData.etat_don_id),
        etat_dossier_id: parseInt(formData.etat_dossier_id),
        date_assistance: formData.date_assistance,
        montant: formData.montant ? parseFloat(formData.montant) : null,
        assistance_pour_moi_meme: formData.assistance_pour_moi_meme ? 1 : 0,
        observation: formData.observation || null,
        duree_utilisation: formData.duree_utilisation ? parseInt(formData.duree_utilisation) : null,
      };

      if (editingAssistance) {
        await assistanceMedicaleService.update(editingAssistance.id, dataToSend);
        showNotification('Assistance mise à jour avec succès', 'success');
      } else {
        await assistanceMedicaleService.create(dataToSend);
        showNotification('Assistance créée avec succès', 'success');
      }
      handleCloseDialog();
      fetchAssistances(true);
    } catch (error) {
      console.error('Erreur submit:', error);
      const message = error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      showNotification(message, 'error');
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!assistanceToDelete) return;

    try {
      await assistanceMedicaleService.delete(assistanceToDelete.id);
      showNotification('Assistance supprimée avec succès', 'success');
      setOpenConfirmDelete(false);
      setAssistanceToDelete(null);
      fetchAssistances(true);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleOpenRetourDialog = (assistance) => {
    setSelectedForRetour(assistance);
    setRetourData({
      date_retour_effective: new Date().toISOString().split('T')[0],
      observation_retour: '',
    });
    setOpenRetourDialog(true);
  };

  const handleRetourMateriel = async () => {
    if (!retourData.date_retour_effective) {
      showNotification('La date de retour est requise', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await assistanceMedicaleService.retourMateriel(selectedForRetour.id, retourData);
      showNotification('Retour matériel enregistré avec succès', 'success');
      setOpenRetourDialog(false);
      fetchAssistances(true);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintRecu = (assistance) => {
    const printWindow = window.open('', '', 'height=800,width=800');
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('fr-MA');
    };
    
    const beneficiaire = assistance.beneficiaire || {};
    const typeAssistance = assistance.type_assistance?.libelle || '';
    const detailType = assistance.detail_type_assistance?.libelle || '';
    const natureDon = assistance.nature_don?.libelle || '';
    const dateAssistance = formatDate(assistance.date_assistance);
    
    let materielChecks = { chaise: '', bequilles: '', cannes: '' };
    
    if (detailType.toLowerCase().includes('chaise')) {
      materielChecks.chaise = '☒';
      materielChecks.bequilles = '☐';
      materielChecks.cannes = '☐';
    } else if (detailType.toLowerCase().includes('béquille')) {
      materielChecks.chaise = '☐';
      materielChecks.bequilles = '☒';
      materielChecks.cannes = '☐';
    } else if (detailType.toLowerCase().includes('canne')) {
      materielChecks.chaise = '☐';
      materielChecks.bequilles = '☐';
      materielChecks.cannes = '☒';
    } else {
      materielChecks.chaise = '☐';
      materielChecks.bequilles = '☐';
      materielChecks.cannes = '☐';
    }
    
    const isDefinitif = natureDon.toLowerCase().includes('définitivement');
    const isPret = natureDon.toLowerCase().includes('prêt');
    const pourMoiMeme = assistance.assistance_pour_moi_meme;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Accusé de réception</title>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 1.5cm 2cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4; padding: 20px 40px; margin: 0; color: #000; }
            .header { text-align: center; margin-bottom: 15px; }
            .header .title { font-size: 10pt; font-weight: normal; letter-spacing: 2px; margin-bottom: 20px; }
            .main-title { text-align: center; font-size: 15pt; font-weight: bold; text-decoration: underline; margin: 20px 0 30px 0; }
            .content { margin-top: 20px; line-height: 1.8; }
            .field { margin: 12px 0; display: flex; align-items: baseline; }
            .field-value { display: inline-block; border-bottom: 1px dotted #000; min-width: 280px; padding: 0 8px; }
            .checkbox-group { margin: 10px 0 10px 30px; }
            .checkbox-item { margin: 6px 0; display: flex; align-items: center; }
            .checkbox { font-size: 16pt; margin-right: 8px; font-weight: bold; }
            .signature-section { margin-top: 30px; text-align: right; padding-right: 80px; }
            .signature-line { margin-top: 30px; border-bottom: 1px solid #000; width: 180px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header"><div class="title">UNITÉ D'ASSISTANCE SOCIALE</div></div>
          <div class="main-title">Accusé de réception</div>
          <div class="content">
            <div class="field"><span>Je soussigné <span class="field-value">${beneficiaire.nom || ''} ${beneficiaire.prenom || ''}</span> titulaire de la C.I.N N°</span></div>
            <div class="field"><span class="field-value">${beneficiaire.cin || ''}</span> résident à <span class="field-value">${beneficiaire.commune?.nom || ''}</span></div>
            <div class="field"><span>N° de tél : <span class="field-value">${beneficiaire.telephone || ''}</span></span></div>
            <div class="field"><span>certifie avoir reçu ce jour :</span></div>
            <div class="checkbox-group">
              <div class="checkbox-item"><span class="checkbox">${materielChecks.chaise}</span><span>Une chaise roulante ;</span></div>
              <div class="checkbox-item"><span class="checkbox">${materielChecks.bequilles}</span><span>Béquilles ;</span></div>
              <div class="checkbox-item"><span class="checkbox">${materielChecks.cannes}</span><span>Cannes anglaises.</span></div>
            </div>
            <div style="font-weight: bold; margin: 15px 0 8px 0;">Neuve du service social de Sefrou :</div>
            <div class="checkbox-group">
              <div class="checkbox-item"><span class="checkbox">${isDefinitif ? '☒' : '☐'}</span><span>Définitivement ;</span></div>
              <div class="checkbox-item"><span class="checkbox">${isPret ? '☒' : '☐'}</span><span>À titre de prêt.</span></div>
            </div>
            <div style="font-weight: bold; margin: 15px 0 8px 0;">Au profit de</div>
            <div class="checkbox-group">
              <div class="checkbox-item"><span class="checkbox">${pourMoiMeme ? '☒' : '☐'}</span><span>Moi-même ;</span></div>
              <div class="checkbox-item"><span class="checkbox">${!pourMoiMeme ? '☒' : '☐'}</span><span>Tierce personne.</span></div>
            </div>
            ${assistance.observation ? `<div class="field" style="margin-top: 15px;"><span>Observation : <span class="field-value">${assistance.observation}</span></span></div>` : ''}
            ${isPret && assistance.date_retour_prevue ? `<div class="field" style="margin-top: 10px;"><span>Date de retour prévue : <span class="field-value">${formatDate(assistance.date_retour_prevue)}</span></span></div>` : ''}
            <div class="signature-section">
              <div>Sefrou, le <strong>${dateAssistance}</strong></div>
              <div style="margin-top: 30px; margin-bottom: 8px;">Signature :</div>
              <div class="signature-line"></div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  // ===== EFFECTS =====
  useEffect(() => {
    if (!bootCompleted.current) {
      performBoot();
    }
  }, [performBoot]);

  useEffect(() => {
    if (appState === 'ready') {
      fetchAssistances();
    }
  }, [page, rowsPerPage, search, appState, fetchAssistances]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (formData.type_assistance_id) {
      fetchDetailsTypes(formData.type_assistance_id);
    } else {
      setDetailsTypes([]);
      setFormData(prev => ({ ...prev, detail_type_assistance_id: '' }));
    }
  }, [formData.type_assistance_id]);

  const retryBoot = () => {
    bootCompleted.current = false;
    performBoot();
  };

  // Composant Carte Statistique
  const StatCard = ({ title, value, color, icon: Icon }) => (
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
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color: color }}>
            <Icon sx={{ fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // ===== RENDU CONDITIONNEL =====
  if (appState === 'boot') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>Chargement des données...</Typography>
        <Typography variant="body2" color="text.secondary">Veuillez patienter pendant l'initialisation</Typography>
      </Box>
    );
  }

  if (appState === 'error') {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ErrorOutline sx={{ fontSize: 64, color: theme.error, mb: 2 }} />
          <Typography variant="h5" gutterBottom>Erreur de chargement</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {bootError || 'Une erreur est survenue lors du chargement des données.'}
          </Typography>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={retryBoot} sx={{ mt: 2 }}>
            Réessayer
          </Button>
        </Paper>
      </Box>
    );
  }

  // ===== RENDU PRINCIPAL =====
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box>
        {/* En-tête */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Gestion des Assistances Médicales
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Gestion des prêts et dons de matériel médical
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? <CircularProgress size={20} /> : 'Actualiser'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: theme.primary, '&:hover': { bgcolor: '#1565c0' }, textTransform: 'none' }}
            >
              Nouvelle Assistance
            </Button>
          </Stack>
        </Box>

        {/* Statistiques */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Total Assistances" value={stats.total} color={theme.primary} icon={LocalHospital} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Prêts Actifs" value={stats.prets_actifs} color={theme.warning} icon={TrendingUp} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Prêts en Retard" value={stats.prets_en_retard} color={theme.error} icon={Error} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Prêts Retournés" value={stats.prets_retournes} color={theme.success} icon={CheckCircle} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Montant Total (DH)" value={stats.montant_total.toLocaleString('fr-FR')} color={theme.info} icon={AttachMoney} />
          </Grid>
        </Grid>

        {/* Barre de recherche */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par bénéficiaire..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'action.active' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } }}
          />
        </Paper>

        {/* Table */}
        <Paper>
          {loading && initialLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : assistances.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <LocalHospital sx={{ fontSize: 64, color: theme.secondary, mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Aucune assistance médicale trouvée
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Créez votre première assistance médicale
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Nouvelle Assistance
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.background }}>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Bénéficiaire</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Détails</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Nature</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>État don</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>État dossier</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Montant</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assistances.map((assistance) => (
                      <TableRow key={assistance.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(assistance.date_assistance).toLocaleDateString('fr-MA')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.primary }}>
                              {(assistance.beneficiaire?.nom || '').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {assistance.beneficiaire?.nom} {assistance.beneficiaire?.prenom}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {assistance.beneficiaire?.telephone || ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{assistance.type_assistance?.libelle}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{assistance.detail_type_assistance?.libelle || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={assistance.nature_don?.libelle} color={isAPret(assistance) ? 'warning' : 'success'} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{assistance.etat_don?.libelle}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{assistance.etat_dossier?.libelle}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {assistance.montant ? `${assistance.montant} DH` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {renderStatutBadge(assistance)}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Voir détails">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => {
                                  setSelectedForView(assistance);
                                  setOpenViewDialog(true);
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Imprimer accusé">
                              <IconButton size="small" onClick={() => handlePrintRecu(assistance)}>
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {isAPret(assistance) && !assistance.est_retourne && (
                              <Tooltip title="Retour matériel">
                                <IconButton size="small" color="primary" onClick={() => handleOpenRetourDialog(assistance)}>
                                  <ReturnIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="Modifier">
                              <IconButton size="small" onClick={() => handleOpenDialog(assistance)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setAssistanceToDelete(assistance);
                                  setOpenConfirmDelete(true);
                                }}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
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
                rowsPerPageOptions={[10, 15, 25, 50]}
                labelRowsPerPage="Lignes par page"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
              />
            </>
          )}
        </Paper>

        {/* Dialog Formulaire */}
        <Dialog open={openDialog} onClose={() => !submitting && handleCloseDialog()} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: theme.background, borderBottom: `2px solid ${theme.primary}` }}>
            <Typography variant="h6" fontWeight={600}>
              {editingAssistance ? 'Modifier l\'assistance' : 'Nouvelle assistance médicale'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth select label="Bénéficiaire"
                value={formData.beneficiaire_id}
                onChange={(e) => setFormData({ ...formData, beneficiaire_id: e.target.value })}
                error={!!errors.beneficiaire_id}
                helperText={errors.beneficiaire_id}
                required
              >
                {beneficiaires.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.nom} {b.prenom} - {b.cin}</MenuItem>
                ))}
              </TextField>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth select label="Type d'assistance"
                  value={formData.type_assistance_id}
                  onChange={(e) => setFormData({ ...formData, type_assistance_id: e.target.value, detail_type_assistance_id: '' })}
                  error={!!errors.type_assistance_id}
                  helperText={errors.type_assistance_id}
                  required
                >
                  {typesAssistance.map((type) => (
                    <MenuItem key={type.id} value={type.id}>{type.libelle}</MenuItem>
                  ))}
                </TextField>
              
                {detailsTypes.length > 0 && (
                  <TextField
                    fullWidth select label="Détails du type"
                    value={formData.detail_type_assistance_id}
                    onChange={(e) => setFormData({ ...formData, detail_type_assistance_id: e.target.value })}
                  >
                    <MenuItem value="">Aucun</MenuItem>
                    {detailsTypes.map((detail) => (
                      <MenuItem key={detail.id} value={detail.id}>{detail.libelle}</MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth select label="Nature du don"
                  value={formData.nature_don_id}
                  onChange={(e) => setFormData({ ...formData, nature_don_id: e.target.value })}
                  error={!!errors.nature_don_id}
                  helperText={errors.nature_don_id}
                  required
                >
                  {naturesDon.map((nature) => (
                    <MenuItem key={nature.id} value={nature.id}>{nature.libelle}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth select label="État du don"
                  value={formData.etat_don_id}
                  onChange={(e) => setFormData({ ...formData, etat_don_id: e.target.value })}
                  error={!!errors.etat_don_id}
                  helperText={errors.etat_don_id}
                  required
                >
                  {etatsDon.map((etat) => (
                    <MenuItem key={etat.id} value={etat.id}>{etat.libelle}</MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                fullWidth select label="État du dossier"
                value={formData.etat_dossier_id}
                onChange={(e) => setFormData({ ...formData, etat_dossier_id: e.target.value })}
                error={!!errors.etat_dossier_id}
                helperText={errors.etat_dossier_id}
                required
              >
                {etatsDossier.map((etat) => (
                  <MenuItem key={etat.id} value={etat.id}>{etat.libelle}</MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth type="date" label="Date de l'assistance"
                  InputLabelProps={{ shrink: true }}
                  value={formData.date_assistance}
                  onChange={(e) => setFormData({ ...formData, date_assistance: e.target.value })}
                  error={!!errors.date_assistance}
                  helperText={errors.date_assistance}
                  required
                />
                <TextField
                  fullWidth type="number" label="Montant (DH)"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Box>

              {naturesDon.find(n => n.id == formData.nature_don_id)?.libelle?.toLowerCase().includes('prêt') && (
                <TextField
                  fullWidth type="number" label="Durée d'utilisation (jours)"
                  value={formData.duree_utilisation}
                  onChange={(e) => setFormData({ ...formData, duree_utilisation: e.target.value })}
                  helperText="La date de retour sera calculée automatiquement"
                  inputProps={{ min: 1 }}
                />
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.assistance_pour_moi_meme}
                    onChange={(e) => setFormData({ ...formData, assistance_pour_moi_meme: e.target.checked })}
                  />
                }
                label="Assistance au profit de moi-même"
              />

              <TextField
                fullWidth multiline rows={3} label="Observation"
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
            <Button onClick={handleCloseDialog} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={20} /> : <Save />}>
              {submitting ? 'Enregistrement...' : (editingAssistance ? 'Modifier' : 'Créer')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Retour Matériel */}
        <Dialog open={openRetourDialog} onClose={() => !submitting && setOpenRetourDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: theme.background, borderBottom: `2px solid ${theme.primary}` }}>
            <Typography variant="h6" fontWeight={600}>Retour de matériel</Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={2}>
              {selectedForRetour && (
                <Alert severity="info">
                  <Typography variant="body2"><strong>Bénéficiaire:</strong> {selectedForRetour.beneficiaire?.nom} {selectedForRetour.beneficiaire?.prenom}</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {selectedForRetour.type_assistance?.libelle}</Typography>
                  {selectedForRetour.date_retour_prevue && (
                    <Typography variant="body2">
                      <strong>Date de retour prévue:</strong> {new Date(selectedForRetour.date_retour_prevue).toLocaleDateString('fr-MA')}
                    </Typography>
                  )}
                </Alert>
              )}
              <TextField
                fullWidth type="date" label="Date de retour effective"
                InputLabelProps={{ shrink: true }}
                value={retourData.date_retour_effective}
                onChange={(e) => setRetourData({ ...retourData, date_retour_effective: e.target.value })}
                required
              />
              <TextField
                fullWidth multiline rows={3} label="Observation sur l'état du matériel"
                value={retourData.observation_retour}
                onChange={(e) => setRetourData({ ...retourData, observation_retour: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
            <Button onClick={() => setOpenRetourDialog(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleRetourMateriel} variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Enregistrer le retour'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Visualisation Détails */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ bgcolor: theme.background, borderBottom: `2px solid ${theme.primary}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VisibilityIcon sx={{ color: theme.primary }} />
              <Typography variant="h6" fontWeight={600}>
                Détails complets de l'assistance
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedForView && (
              <Box>
                {/* En-tête avec statut */}
                <Box sx={{ mb: 3, p: 2, bgcolor: theme.background, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Assistance N°
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color={theme.primary}>
                        #{selectedForView.id}
                      </Typography>
                    </Box>
                    <Box>
                      {renderStatutBadge(selectedForView)}
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  {/* Section Bénéficiaire */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Avatar sx={{ bgcolor: theme.primary, width: 40, height: 40 }}>
                          {(selectedForView.beneficiaire?.nom || '').charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Bénéficiaire
                        </Typography>
                      </Box>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Nom complet</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedForView.beneficiaire?.prenom} {selectedForView.beneficiaire?.nom}
                          </Typography>
                        </Box>
                        {selectedForView.beneficiaire?.cin && (
                          <Box>
                            <Typography variant="caption" color="textSecondary">CIN</Typography>
                            <Typography variant="body1">{selectedForView.beneficiaire?.cin}</Typography>
                          </Box>
                        )}
                        {selectedForView.beneficiaire?.telephone && (
                          <Box>
                            <Typography variant="caption" color="textSecondary">Téléphone</Typography>
                            <Typography variant="body1">{selectedForView.beneficiaire?.telephone}</Typography>
                          </Box>
                        )}
                        {selectedForView.beneficiaire?.commune && (
                          <Box>
                            <Typography variant="caption" color="textSecondary">Commune</Typography>
                            <Typography variant="body1">
                              {selectedForView.beneficiaire?.commune?.nom || selectedForView.beneficiaire?.commune}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ pt: 1 }}>
                          <Chip 
                            label={selectedForView.assistance_pour_moi_meme ? "Pour moi-même" : "Pour tierce personne"}
                            color={selectedForView.assistance_pour_moi_meme ? "success" : "default"}
                            size="small"
                            icon={selectedForView.assistance_pour_moi_meme ? <CheckCircle /> : <PersonIcon />}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Section Assistance */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LocalHospital sx={{ color: theme.primary }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Détails de l'assistance
                        </Typography>
                      </Box>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Type d'assistance</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedForView.type_assistance?.libelle}
                          </Typography>
                        </Box>
                        {selectedForView.detail_type_assistance && (
                          <Box>
                            <Typography variant="caption" color="textSecondary">Détails du type</Typography>
                            <Typography variant="body1">{selectedForView.detail_type_assistance?.libelle}</Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="caption" color="textSecondary">Nature du don</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={selectedForView.nature_don?.libelle}
                              color={isAPret(selectedForView) ? 'warning' : 'success'}
                              size="small"
                            />
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Date de l'assistance</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatDateSafe(selectedForView.date_assistance)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Section État et Montant */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AssignmentIcon sx={{ color: theme.success }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          État et Montant
                        </Typography>
                      </Box>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">État du don</Typography>
                          <Typography variant="body1">{selectedForView.etat_don?.libelle}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">État du dossier</Typography>
                          <Typography variant="body1">{selectedForView.etat_dossier?.libelle}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Montant</Typography>
                          <Typography variant="h5" fontWeight="bold" color={theme.primary}>
                            {selectedForView.montant ? `${selectedForView.montant} DH` : 'Non spécifié'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Section Prêt (si applicable) */}
                  {isAPret(selectedForView) && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, bgcolor: '#fff3e0', borderLeft: `4px solid ${theme.warning}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Schedule sx={{ color: theme.warning }} />
                          <Typography variant="subtitle1" fontWeight={600}>
                            Informations de prêt
                          </Typography>
                        </Box>
                        <Stack spacing={1.5}>
                          <Box>
                            <Typography variant="caption" color="textSecondary">Durée d'utilisation</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedForView.duree_utilisation ? `${selectedForView.duree_utilisation} jours` : 'Non spécifiée'}
                            </Typography>
                          </Box>
                          {selectedForView.date_retour_prevue && (
                            <Box>
                              <Typography variant="caption" color="textSecondary">Date de retour prévue</Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {formatDateSafe(selectedForView.date_retour_prevue)}
                              </Typography>
                            </Box>
                          )}
                          <Box>
                            <Typography variant="caption" color="textSecondary">Jours restants</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {getJoursRestants(selectedForView) !== null && !selectedForView.est_retourne ? (
                                <Chip
                                  label={getJoursRestants(selectedForView) > 0 
                                    ? `${getJoursRestants(selectedForView)} jours restants`
                                    : getJoursRestants(selectedForView) === 0
                                    ? "Échéance aujourd'hui"
                                    : `En retard de ${Math.abs(getJoursRestants(selectedForView))} jours`
                                  }
                                  color={
                                    getJoursRestants(selectedForView) < 0 ? 'error' :
                                    getJoursRestants(selectedForView) <= 3 ? 'warning' : 'info'
                                  }
                                  icon={
                                    getJoursRestants(selectedForView) < 0 ? <Error /> :
                                    getJoursRestants(selectedForView) <= 3 ? <Warning /> : <Schedule />
                                  }
                                />
                              ) : (
                                <Chip 
                                  label={selectedForView.est_retourne ? "Matériel retourné" : "En cours"}
                                  color={selectedForView.est_retourne ? "success" : "default"}
                                  icon={selectedForView.est_retourne ? <CheckCircle /> : <Schedule />}
                                />
                              )}
                            </Box>
                          </Box>
                          {selectedForView.est_retourne && selectedForView.date_retour_effective && (
                            <Box>
                              <Typography variant="caption" color="textSecondary">Date de retour effective</Typography>
                              <Typography variant="body1" fontWeight="medium" color={theme.success}>
                                {formatDateSafe(selectedForView.date_retour_effective)}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Section Observations */}
                  {(selectedForView.observation || selectedForView.observation_retour) && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <DescriptionIcon sx={{ color: theme.info }} />
                          <Typography variant="subtitle1" fontWeight={600}>
                            Observations
                          </Typography>
                        </Box>
                        <Stack spacing={2}>
                          {selectedForView.observation && (
                            <Box>
                              <Typography variant="body2" color="textSecondary" gutterBottom>
                                Observations générales
                              </Typography>
                              <Paper sx={{ p: 2, bgcolor: theme.background }}>
                                <Typography variant="body2">{selectedForView.observation}</Typography>
                              </Paper>
                            </Box>
                          )}
                          {selectedForView.observation_retour && (
                            <Box>
                              <Typography variant="body2" color="textSecondary" gutterBottom>
                                Observation sur le retour
                              </Typography>
                              <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                                <Typography variant="body2">{selectedForView.observation_retour}</Typography>
                              </Paper>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Timeline pour les prêts */}
                  {isAPret(selectedForView) && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 3 }}>
                          Chronologie du prêt
                        </Typography>
                        <Box sx={{ position: 'relative', pl: 3 }}>
                          {/* Ligne verticale */}
                          <Box sx={{
                            position: 'absolute',
                            left: 11,
                            top: 10,
                            bottom: 10,
                            width: 2,
                            bgcolor: theme.primary,
                          }} />
                          
                          {/* Événements */}
                          <Stack spacing={3}>
                            {/* Date d'assistance */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: theme.primary }}>
                                <CheckCircle sx={{ fontSize: 16 }} />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  Assistance accordée
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatDateSafe(selectedForView.date_assistance)}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Date de retour prévue */}
                            {selectedForView.date_retour_prevue && (
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Avatar sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  bgcolor: selectedForView.est_retourne ? theme.success : 
                                           getStatutPret(selectedForView) === 'en_retard' ? theme.error : theme.warning
                                }}>
                                  <Schedule sx={{ fontSize: 16 }} />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    Date de retour prévue
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {formatDateSafe(selectedForView.date_retour_prevue)}
                                  </Typography>
                                </Box>
                              </Box>
                            )}

                            {/* Date de retour effective */}
                            {selectedForView.est_retourne && (
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: theme.success }}>
                                  <CheckCircle sx={{ fontSize: 16 }} />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    Matériel retourné
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {formatDateSafe(selectedForView.date_retour_effective || new Date())}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      </Paper>
                    </Grid>
                  )}

                  {/* Métadonnées */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: theme.background }}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Informations système
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary">ID Assistance</Typography>
                          <Typography variant="body2" fontWeight="medium">#{selectedForView.id}</Typography>
                        </Grid>
                        {selectedForView.created_at && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="textSecondary">Créée le</Typography>
                            <Typography variant="body2">{formatDateSafe(selectedForView.created_at)}</Typography>
                          </Grid>
                        )}
                        {selectedForView.updated_at && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="textSecondary">Modifiée le</Typography>
                            <Typography variant="body2">{formatDateSafe(selectedForView.updated_at)}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
            <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => {
              setOpenViewDialog(false);
              handleOpenDialog(selectedForView);
            }}>
              Modifier
            </Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrintRecu(selectedForView)}>
              Imprimer l'accusé
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Confirmation Suppression */}
        <Dialog open={openConfirmDelete} onClose={() => setOpenConfirmDelete(false)}>
          <DialogTitle sx={{ bgcolor: theme.background }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ErrorOutline sx={{ color: theme.error }} />
              <span>Confirmer la suppression</span>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>Cette action est irréversible</Alert>
            <Typography>Êtes-vous sûr de vouloir supprimer cette assistance ?</Typography>
            {assistanceToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: theme.background, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Bénéficiaire:</strong> {assistanceToDelete.beneficiaire?.nom} {assistanceToDelete.beneficiaire?.prenom}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {assistanceToDelete.type_assistance?.libelle}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
            <Button onClick={() => setOpenConfirmDelete(false)}>Annuler</Button>
            <Button color="error" variant="contained" onClick={handleDelete} startIcon={<DeleteIcon />}>
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AssistancesMedicalesPage;