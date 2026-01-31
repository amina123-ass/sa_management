import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  Lock,
  LockOpen,
  Search,
  Refresh,
  VpnKey,
} from '@mui/icons-material';
import { adminService, roleService } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import UserActivationDialog from '../../components/UserActivationDialog';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [error, setError] = useState(null);
  
  // Dialogs
  const [activationDialog, setActivationDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, rowsPerPage, searchTerm, filterActive, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterActive !== '') params.is_active = filterActive;
      if (filterRole !== '') params.role_id = filterRole;

      const response = await adminService.getUsers(params);

      if (response.data.success) {
        const paginationData = response.data.data;
        setUsers(paginationData.data || []);
        setTotalUsers(paginationData.total || 0);
      } else {
        setError('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des utilisateurs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleService.getAll({ is_active: 1 });
      
      if (response.data.success) {
        const rolesData = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data.data || [];
        setRoles(rolesData);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Erreur lors du chargement des rôles');
    }
  };

  const handleToggleStatus = (user) => {
    // Si l'utilisateur est inactif, on ouvre le dialog d'activation
    if (!user.is_active) {
      handleOpenActivationDialog(user);
    } else {
      // Si l'utilisateur est actif, on le désactive directement
      handleDeactivateUser(user.id);
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      const response = await adminService.toggleUserStatus(userId);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleOpenActivationDialog = (user) => {
    setSelectedUser(user);
    setActivationDialog(true);
  };

  const handleCloseActivationDialog = () => {
    setActivationDialog(false);
    setSelectedUser(null);
  };

  const handleActivationSuccess = () => {
    fetchUsers();
  };

  const handleOpenRoleDialog = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role_id || '');
    setRoleDialog(true);
  };

  const handleAssignRole = async () => {
    if (!selectedRole) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }

    try {
      const response = await adminService.assignRole(selectedUser.id, selectedRole);
      if (response.data.success) {
        toast.success(response.data.message);
        setRoleDialog(false);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'attribution du rôle');
    }
  };

  const handleOpenPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordDialog(true);
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      const response = await adminService.resetUserPassword(
        selectedUser.id,
        newPassword,
        confirmPassword
      );
      if (response.data.success) {
        toast.success(response.data.message);
        setPasswordDialog(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  };

  const handleUnlock = async (userId) => {
    try {
      const response = await adminService.unlockUser(userId);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du déverrouillage');
    }
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    try {
      const response = await adminService.deleteUser(selectedUser.id);
      if (response.data.success) {
        toast.success(response.data.message);
        setDeleteDialog(false);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusChip = (user) => {
    if (!user.email_verified_at) {
      return <Chip label="Email non vérifié" color="warning" size="small" />;
    }
    if (!user.is_active) {
      return <Chip label="Inactif" color="error" size="small" />;
    }
    if (!user.role_id) {
      return <Chip label="Sans rôle" color="warning" size="small" />;
    }
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return <Chip label="Verrouillé" color="error" size="small" />;
    }
    return <Chip label="Actif" color="success" size="small" />;
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestion des Utilisateurs
        </Typography>

        {/* Filtres et recherche */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filterActive}
                  label="Statut"
                  onChange={(e) => setFilterActive(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="1">Actifs</MenuItem>
                  <MenuItem value="0">Inactifs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={filterRole}
                  label="Rôle"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="null">Sans rôle</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.display_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchUsers}
              >
                Actualiser
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Box p={4} textAlign="center">
              <Typography color="text.secondary">
                Aucun utilisateur trouvé
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom complet</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date création</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.prenom} {user.nom}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.telephone || '-'}</TableCell>
                      <TableCell>
                        {user.role ? (
                          <Chip label={user.role.display_name} size="small" variant="outlined" />
                        ) : (
                          <Chip label="Aucun" size="small" color="default" />
                        )}
                      </TableCell>
                      <TableCell>{getStatusChip(user)}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={user.is_active ? 'Désactiver' : 'Activer et attribuer un rôle'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(user)}
                            color={user.is_active ? 'success' : 'error'}
                          >
                            {user.is_active ? <LockOpen /> : <Lock />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Modifier le rôle">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenRoleDialog(user)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Réinitialiser le mot de passe">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPasswordDialog(user)}
                            color="warning"
                          >
                            <VpnKey />
                          </IconButton>
                        </Tooltip>

                        {user.locked_until && new Date(user.locked_until) > new Date() && (
                          <Tooltip title="Déverrouiller">
                            <IconButton
                              size="small"
                              onClick={() => handleUnlock(user.id)}
                              color="info"
                            >
                              <LockOpen />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(user)}
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

              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                }
              />
            </>
          )}
        </TableContainer>
      </Box>

      {/* Dialog Activation avec attribution de rôle */}
      <UserActivationDialog
        open={activationDialog}
        onClose={handleCloseActivationDialog}
        user={selectedUser}
        onSuccess={handleActivationSuccess}
      />

      {/* Dialog Modification de Rôle */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le rôle</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
            Utilisateur: {selectedUser?.prenom} {selectedUser?.nom}
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={selectedRole}
              label="Rôle"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.display_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(false)}>Annuler</Button>
          <Button onClick={handleAssignRole} variant="contained">
            Modifier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Réinitialisation Mot de Passe */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
            Utilisateur: {selectedUser?.prenom} {selectedUser?.nom}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            type="password"
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Au moins 8 caractères avec majuscules, minuscules, chiffres et symboles"
          />
          <TextField
            fullWidth
            margin="normal"
            type="password"
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Annuler</Button>
          <Button onClick={handleResetPassword} variant="contained" color="warning">
            Réinitialiser
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
            <strong>
              {selectedUser?.prenom} {selectedUser?.nom}
            </strong>{' '}
            ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;