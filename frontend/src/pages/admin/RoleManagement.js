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
  FormControlLabel,
  Checkbox,
  Grid,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Lock,
  LockOpen,
  Security,
} from '@mui/icons-material';
import { roleService } from '../../services/api';
import { toast } from 'react-toastify';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
    is_active: true,
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAll();
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des rôles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await roleService.getPermissions();
      if (response.data.success) {
        setPermissions(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permissions: [],
      is_active: true,
    });
    setCreateDialog(true);
  };

  const handleOpenEditDialog = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      permissions: role.permissions || [],
      is_active: role.is_active,
    });
    
    setEditDialog(true);
  };

  const handleCreateRole = async () => {
    if (!formData.name || !formData.display_name) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await roleService.create(formData);
      if (response.data.success) {
        toast.success(response.data.message);
        setCreateDialog(false);
        fetchRoles();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateRole = async () => {
    if (!formData.name || !formData.display_name) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await roleService.update(selectedRole.id, formData);
      if (response.data.success) {
        toast.success(response.data.message);
        setEditDialog(false);
        fetchRoles();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleToggleStatus = async (roleId) => {
    try {
      const response = await roleService.toggleStatus(roleId);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchRoles();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleOpenDeleteDialog = (role) => {
    setSelectedRole(role);
    setDeleteDialog(true);
  };

  const handleDeleteRole = async () => {
    try {
      const response = await roleService.delete(selectedRole.id);
      if (response.data.success) {
        toast.success(response.data.message);
        setDeleteDialog(false);
        fetchRoles();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handlePermissionChange = (permission) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter((p) => p !== permission)
      : [...formData.permissions, permission];
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const RoleDialog = ({ open, onClose, onSave, title, isEdit = false }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nom technique *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isEdit && selectedRole?.name === 'admin_si'}
              helperText="Minuscules et underscores uniquement (ex: gestionnaire)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nom d'affichage *"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={isEdit && selectedRole?.name === 'admin_si'}
                />
              }
              label="Rôle actif"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Permissions
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
              <Grid container spacing={1}>
                {Object.entries(permissions).map(([key, label]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.permissions.includes(key)}
                          onChange={() => handlePermissionChange(key)}
                        />
                      }
                      label={label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onSave} variant="contained">
          {isEdit ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Gestion des Rôles</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreateDialog}
          >
            Nouveau Rôle
          </Button>
        </Box>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Security color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Rôles
                    </Typography>
                    <Typography variant="h4">{roles.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <LockOpen color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Rôles Actifs
                    </Typography>
                    <Typography variant="h4">
                      {roles.filter((r) => r.is_active).length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Lock color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Rôles Inactifs
                    </Typography>
                    <Typography variant="h4">
                      {roles.filter((r) => !r.is_active).length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Nom d'affichage</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Utilisateurs</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <code>{role.name}</code>
                    </TableCell>
                    <TableCell>{role.display_name}</TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${role.permissions?.length || 0} permissions`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${role.users_count || 0} utilisateurs`}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {role.is_active ? (
                        <Chip label="Actif" color="success" size="small" />
                      ) : (
                        <Chip label="Inactif" color="error" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={role.is_active ? 'Désactiver' : 'Activer'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(role.id)}
                            color={role.is_active ? 'success' : 'error'}
                            disabled={role.name === 'admin_si'}
                          >
                            {role.is_active ? <LockOpen /> : <Lock />}
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(role)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Supprimer">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(role)}
                            color="error"
                            disabled={role.name === 'admin_si' || role.users_count > 0}
                          >
                            <Delete />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>

      {/* Dialog Création */}
      <RoleDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSave={handleCreateRole}
        title="Créer un nouveau rôle"
      />

      {/* Dialog Édition */}
      <RoleDialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        onSave={handleUpdateRole}
        title="Modifier le rôle"
        isEdit={true}
      />

      {/* Dialog Suppression */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le rôle{' '}
            <strong>{selectedRole?.display_name}</strong> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDeleteRole} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoleManagement;