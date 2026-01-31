import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Lock,
  LockOpen,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { dictionaryService } from '../../services/api';
import { toast } from 'react-toastify';

const DICTIONARIES = [
  { key: 'etat_dossiers', label: 'États Dossier', hasCode: true },
  { key: 'nature_dons', label: 'Natures de Don', hasCode: false },
  { key: 'type_assistances', label: 'Types Assistance', hasCode: false },
  { key: 'detail_type_assistances', label: 'Détails Type Assistance', hasCode: false, hasParent: true },
  { key: 'etat_dons', label: 'États Don', hasCode: true },
  { key: 'communes', label: 'Communes', hasCode: true, isCommune: true },
  { key: 'milieux', label: 'Milieux', hasCode: false },
  { key: 'security_questions', label: 'Questions de Sécurité', hasCode: false, isQuestion: true },
];

const DictionaryManagement = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [typeAssistances, setTypeAssistances] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [formData, setFormData] = useState({
    libelle: '',
    nom: '',
    question: '',
    code: '',
    type_assistance_id: '',
    is_active: true,
  });

  const currentDictionary = DICTIONARIES.find((d) => d.key === type) || DICTIONARIES[0];

  useEffect(() => {
    if (type) {
      fetchItems();
      if (currentDictionary.hasParent) {
        fetchTypeAssistances();
      }
    }
  }, [type]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await dictionaryService.getAll(type);
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypeAssistances = async () => {
    try {
      const response = await dictionaryService.getAll('type_assistances');
      if (response.data.success) {
        setTypeAssistances(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      libelle: '',
      nom: '',
      question: '',
      code: '',
      type_assistance_id: '',
      is_active: true,
    });
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setCreateDialog(true);
  };

  const handleOpenEditDialog = (item) => {
    setSelectedItem(item);
    setFormData({
      libelle: item.libelle || '',
      nom: item.nom || '',
      question: item.question || '',
      code: item.code || '',
      type_assistance_id: item.type_assistance_id || '',
      is_active: item.is_active,
    });
    setEditDialog(true);
  };

  const handleCreate = async () => {
    // Validation
    if (currentDictionary.isCommune && (!formData.nom || !formData.code)) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (currentDictionary.isQuestion && !formData.question) {
      toast.error('Veuillez remplir la question');
      return;
    }
    if (!currentDictionary.isCommune && !currentDictionary.isQuestion && !formData.libelle) {
      toast.error('Veuillez remplir le libellé');
      return;
    }
    if (currentDictionary.hasCode && !formData.code) {
      toast.error('Le code est obligatoire');
      return;
    }
    if (currentDictionary.hasParent && !formData.type_assistance_id) {
      toast.error('Veuillez sélectionner un type d\'assistance');
      return;
    }

    try {
      const response = await dictionaryService.create(type, formData);
      if (response.data.success) {
        toast.success(response.data.message);
        setCreateDialog(false);
        fetchItems();
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await dictionaryService.update(type, selectedItem.id, formData);
      if (response.data.success) {
        toast.success(response.data.message);
        setEditDialog(false);
        fetchItems();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleToggleStatus = async (itemId) => {
    try {
      const response = await dictionaryService.toggleStatus(type, itemId);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchItems();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleOpenDeleteDialog = (item) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      const response = await dictionaryService.delete(type, selectedItem.id);
      if (response.data.success) {
        toast.success(response.data.message);
        setDeleteDialog(false);
        fetchItems();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleTabChange = (event, newValue) => {
    navigate(`/admin/dictionaries/${DICTIONARIES[newValue].key}`);
  };

  const getDisplayText = (item) => {
    if (currentDictionary.isCommune) {
      return item.nom;
    }
    if (currentDictionary.isQuestion) {
      return item.question;
    }
    return item.libelle;
  };

  const DictionaryDialog = ({ open, onClose, onSave, title }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {currentDictionary.isCommune ? (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom *"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </Grid>
          ) : currentDictionary.isQuestion ? (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question *"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Libellé *"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              />
            </Grid>
          )}

          {currentDictionary.hasCode && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                helperText="Majuscules uniquement"
              />
            </Grid>
          )}

          {currentDictionary.hasParent && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type d'assistance *</InputLabel>
                <Select
                  value={formData.type_assistance_id}
                  label="Type d'assistance *"
                  onChange={(e) => setFormData({ ...formData, type_assistance_id: e.target.value })}
                >
                  {typeAssistances.map((ta) => (
                    <MenuItem key={ta.id} value={ta.id}>
                      {ta.libelle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onSave} variant="contained">
          {editDialog ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestion des Dictionnaires
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={DICTIONARIES.findIndex((d) => d.key === type)}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {DICTIONARIES.map((dict) => (
              <Tab key={dict.key} label={dict.label} />
            ))}
          </Tabs>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">{currentDictionary.label}</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreateDialog}
          >
            Nouveau
          </Button>
        </Box>

        <TableContainer component={Paper}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>
                    {currentDictionary.isCommune 
                      ? 'Nom' 
                      : currentDictionary.isQuestion 
                        ? 'Question' 
                        : 'Libellé'}
                  </TableCell>
                  {currentDictionary.hasCode && <TableCell>Code</TableCell>}
                  {currentDictionary.hasParent && <TableCell>Type Assistance</TableCell>}
                  <TableCell>Statut</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{getDisplayText(item)}</TableCell>
                    {currentDictionary.hasCode && (
                      <TableCell>
                        <code>{item.code}</code>
                      </TableCell>
                    )}
                    {currentDictionary.hasParent && (
                      <TableCell>{item.type_assistance?.libelle || '-'}</TableCell>
                    )}
                    <TableCell>
                      {item.is_active ? (
                        <Chip label="Actif" color="success" size="small" />
                      ) : (
                        <Chip label="Inactif" color="error" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={item.is_active ? 'Désactiver' : 'Activer'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(item.id)}
                          color={item.is_active ? 'success' : 'error'}
                        >
                          {item.is_active ? <LockOpen /> : <Lock />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(item)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeleteDialog(item)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>

      <DictionaryDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSave={handleCreate}
        title={`Créer - ${currentDictionary.label}`}
      />

      <DictionaryDialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        onSave={handleUpdate}
        title={`Modifier - ${currentDictionary.label}`}
      />

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cet élément ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DictionaryManagement;