import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { roleService, adminService } from '../services/api';
import { toast } from 'react-toastify';

const UserActivationDialog = ({ open, onClose, user, onSuccess }) => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    if (open) {
      fetchRoles();
      setSelectedRole(user?.role_id || '');
    }
  }, [open, user]);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
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
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedRole) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }

    try {
      setLoading(true);

      // 1. Attribuer le rôle
      const roleResponse = await adminService.assignRole(user.id, selectedRole);
      
      if (!roleResponse.data.success) {
        throw new Error('Erreur lors de l\'attribution du rôle');
      }

      // 2. Activer l'utilisateur (seulement s'il est inactif)
      if (!user.is_active) {
        const activationResponse = await adminService.toggleUserStatus(user.id);
        
        if (!activationResponse.data.success) {
          throw new Error('Erreur lors de l\'activation de l\'utilisateur');
        }
      }

      toast.success('Utilisateur activé et rôle attribué avec succès');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole('');
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Activer l'utilisateur
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Pour activer cet utilisateur, vous devez lui attribuer un rôle.
          </Alert>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Utilisateur :</strong> {user.prenom} {user.nom}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Email :</strong> {user.email}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            <strong>Statut actuel :</strong>{' '}
            <span style={{ color: user.is_active ? 'green' : 'red' }}>
              {user.is_active ? 'Actif' : 'Inactif'}
            </span>
          </Typography>

          {loadingRoles ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <FormControl fullWidth required>
              <InputLabel>Sélectionner un rôle</InputLabel>
              <Select
                value={selectedRole}
                label="Sélectionner un rôle"
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.display_name}
                    {role.description && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {role.description}
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} disabled={loading}>
          Annuler
        </Button>
        <Button 
          onClick={handleActivate} 
          variant="contained" 
          color="success"
          disabled={loading || !selectedRole || loadingRoles}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Activation...
            </>
          ) : (
            'Activer et attribuer le rôle'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserActivationDialog;