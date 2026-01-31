import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  People,
  PersonAdd,
  PersonOff,
  HourglassEmpty,
  Lock,
  LockOpen,
  Visibility,
} from '@mui/icons-material';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import UserActivationDialog from '../../components/UserActivationDialog';

const StatCard = ({ title, value, icon, color }) => (
  <Card elevation={3}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="text.secondary" gutterBottom variant="subtitle2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  
  // Dialog d'activation
  const [activationDialog, setActivationDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchInactiveUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminService.getDashboard();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInactiveUsers = async () => {
    try {
      setLoadingInactive(true);
      const response = await adminService.getUsers({
        is_active: 0,
        per_page: 10,
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      
      if (response.data.success) {
        setInactiveUsers(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs inactifs:', error);
    } finally {
      setLoadingInactive(false);
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
    fetchDashboardData();
    fetchInactiveUsers();
  };

  const getStatusChip = (user) => {
    if (!user.email_verified_at) {
      return <Chip label="Email non vérifié" color="warning" size="small" />;
    }
    if (!user.role_id) {
      return <Chip label="Sans rôle" color="warning" size="small" />;
    }
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return <Chip label="Verrouillé" color="error" size="small" />;
    }
    return <Chip label="Inactif" color="error" size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Container>
        <Typography variant="h5" color="error" align="center">
          Erreur lors du chargement des données
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Administrateur
      </Typography>

      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Utilisateurs"
            value={stats.total_users}
            icon={<People sx={{ fontSize: 40, color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utilisateurs Actifs"
            value={stats.active_users}
            icon={<PersonAdd sx={{ fontSize: 40, color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utilisateurs Inactifs"
            value={stats.inactive_users}
            icon={<PersonOff sx={{ fontSize: 40, color: 'error.main' }} />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="En Attente"
            value={stats.pending_activation}
            icon={<HourglassEmpty sx={{ fontSize: 40, color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Statistiques supplémentaires */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Répartition par Rôle
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rôle</TableCell>
                    <TableCell align="right">Nombre</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.roles_distribution.map((role, index) => (
                    <TableRow key={index}>
                      <TableCell>{role.role_name}</TableCell>
                      <TableCell align="right">{role.count}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell><strong>Sans rôle</strong></TableCell>
                    <TableCell align="right"><strong>{stats.users_without_role}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistiques Email
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography>Emails vérifiés:</Typography>
                <Typography fontWeight="bold">
                  {stats.total_users - stats.unverified_users}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography>Emails non vérifiés:</Typography>
                <Typography fontWeight="bold" color="error">
                  {stats.unverified_users}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography>Avec rôle attribué:</Typography>
                <Typography fontWeight="bold" color="success.main">
                  {stats.users_with_role}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Utilisateurs Inactifs */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Utilisateurs Inactifs ({stats.inactive_users})
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/admin/users?filter=inactive')}
          >
            Voir tout
          </Button>
        </Box>
        
        {loadingInactive ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={30} />
          </Box>
        ) : inactiveUsers.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary">
              Aucun utilisateur inactif
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom complet</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date création</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactiveUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.prenom} {user.nom}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Chip 
                          label={user.role.display_name} 
                          size="small" 
                          variant="outlined" 
                        />
                      ) : (
                        <Chip label="Aucun" size="small" color="default" />
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(user)}</TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Activer et attribuer un rôle">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenActivationDialog(user)}
                          color="success"
                        >
                          <LockOpen />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Voir détails">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Activités récentes */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Activités Récentes
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.recent_activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell>{activity.user}</TableCell>
                  <TableCell>
                    {format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog d'activation */}
      <UserActivationDialog
        open={activationDialog}
        onClose={handleCloseActivationDialog}
        user={selectedUser}
        onSuccess={handleActivationSuccess}
      />
    </Container>
  );
};

export default AdminDashboard;