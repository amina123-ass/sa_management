import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Badge,
  Paper,
  Chip,
  Stack,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  FamilyRestroom as FamilyIcon,
  MedicalServices as MedicalIcon,
  BarChart as StatsIcon,
  Logout,
  ChevronLeft,
  ChevronRight,
  Notifications,
  Error,
  Warning,
  Close,
  KeyboardArrowRight,
  CheckCircle,
  Event,
  DoneAll,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAllNotifications } from '../../hooks/useAllNotifications';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const drawerWidth = 260;
const collapsedDrawerWidth = 72;

const UASLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  // Hook de notifications combiné
  const {
    pretsEnRetard,
    pretsProchesEcheance,
    assistanceCount,
    campagnesTerminees,
    campagnesProcheFin,
    campagneCount,
    totalCount,
    loading,
    markAssistanceAsViewed,
    markCampagneAsViewed,
    markAllAsViewed,
    resetViewed,
  } = useAllNotifications();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setIsDrawerCollapsed(!isDrawerCollapsed);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigateToAssistance = (assistanceId) => {
    markAssistanceAsViewed(assistanceId);
    handleNotificationClose();
    navigate('/uas/assistances-medicales', { state: { highlightId: assistanceId } });
  };

  const handleNavigateToCampagne = (campagneId) => {
    markCampagneAsViewed(campagneId);
    handleNotificationClose();
    navigate('/uas/campagnes', { state: { highlightId: campagneId } });
  };

  const handleMarkAllAsRead = () => {
    markAllAsViewed();
  };

  const handleShowAllNotifications = () => {
    resetViewed();
  };

  const menuItems = [
    {
      text: 'Campagnes',
      icon: <CampaignIcon />,
      path: '/uas/campagnes',
      notificationCount: campagneCount,
    },
    {
      text: 'Bénéficiaires',
      icon: <PeopleIcon />,
      path: '/uas/beneficiaires',
    },
    {
      text: 'Kafala',
      icon: <FamilyIcon />,
      path: '/uas/kafala',
    },
    {
      text: 'Assistances Médicales',
      icon: <MedicalIcon />,
      path: '/uas/assistances-medicales',
      notificationCount: assistanceCount,
    },
    {
      text: 'Statistiques',
      icon: <StatsIcon />,
      path: '/uas/statistiques',
    },
  ];

  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.text : 'Module UAS';
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header */}
      <Toolbar
        sx={{
          justifyContent: isDrawerCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#1976d2',
          minHeight: 64,
          px: 2,
        }}
      >
        {!isDrawerCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: 'white',
                color: '#1976d2',
                width: 40,
                height: 40,
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              UAS
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                Module UAS
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.75rem',
                }}
              >
                Système de Gestion
              </Typography>
            </Box>
          </Box>
        )}

        <IconButton
          onClick={handleDrawerCollapse}
          size="small"
          sx={{
            display: { xs: 'none', sm: 'flex' },
            color: 'white',
            ml: isDrawerCollapsed ? 0 : 'auto',
          }}
        >
          {isDrawerCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Toolbar>

      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={isDrawerCollapsed ? item.text : ''} placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 1,
                  minHeight: 44,
                  justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
                  px: isDrawerCollapsed ? 1 : 2,
                  position: 'relative',
                  '&.Mui-selected': {
                    backgroundColor: '#e3f2fd',
                    borderLeft: '3px solid #1976d2',
                    '& .MuiListItemIcon-root': {
                      color: '#1976d2',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isDrawerCollapsed ? 0 : 2,
                    justifyContent: 'center',
                    color: '#546e7a',
                  }}
                >
                  {item.notificationCount > 0 ? (
                    <Badge badgeContent={item.notificationCount} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                {!isDrawerCollapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                )}
                {!isDrawerCollapsed && item.notificationCount > 0 && (
                  <Chip
                    label={item.notificationCount}
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* User Info */}
      {!isDrawerCollapsed && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f5f7fa',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: '#1976d2',
                width: 40,
                height: 40,
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {user?.prenom?.charAt(0)}
              {user?.nom?.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {user?.prenom} {user?.nom}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Responsable UAS
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const currentDrawerWidth = isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth;

  return (
    <Box sx={{ display: 'flex' }}>

      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          backgroundColor: '#ffffff',
          color: '#263238',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {menuItems.find(item => item.path === location.pathname)?.icon}
            </Box>
            <Typography variant="h6" fontWeight={600} noWrap>
              {getPageTitle()}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            
            {/* Notifications */}
            <Tooltip title={totalCount > 0 ? `${totalCount} alerte${totalCount > 1 ? 's' : ''}` : 'Aucune alerte'}>
              <IconButton onClick={handleNotificationClick} size="small">
                <Badge badgeContent={totalCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* User Menu */}
            <Tooltip title="Profil">
              <IconButton onClick={handleMenu} size="small">
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#1976d2',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {user?.prenom?.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          {/* Notification Menu */}
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                width: 450,
                maxHeight: 650,
                boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
              }
            }}
          >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Notifications
                </Typography>
                <IconButton size="small" onClick={handleNotificationClose}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              {totalCount > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  {totalCount} alerte{totalCount > 1 ? 's' : ''} nécessitant votre attention
                </Typography>
              )}
              {/* Boutons d'action */}
              {totalCount > 0 && (
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<DoneAll />}
                    onClick={handleMarkAllAsRead}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Tout marquer comme lu
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={handleShowAllNotifications}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Tout afficher
                  </Button>
                </Stack>
              )}
            </Box>

            {/* Content */}
            <Box sx={{ maxHeight: 550, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Chargement...
                  </Typography>
                </Box>
              ) : totalCount === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Notifications sx={{ fontSize: 48, color: '#90caf9', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Aucune notification
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tout est à jour
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={handleShowAllNotifications}
                    sx={{ mt: 2, fontSize: '0.75rem' }}
                  >
                    Afficher toutes les notifications
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1} sx={{ p: 1 }}>
                  
                  {/* SECTION CAMPAGNES */}
                  {(campagnesTerminees.length > 0 || campagnesProcheFin.length > 0) && (
                    <>
                      <Box sx={{ px: 1, py: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="primary">
                          📅 CAMPAGNES ({campagneCount})
                        </Typography>
                      </Box>

                      {/* Campagnes terminées */}
                      {campagnesTerminees.length > 0 && (
                        <Box>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="error.main"
                            sx={{ px: 1, py: 0.5, display: 'block' }}
                          >
                            Campagnes terminées ({campagnesTerminees.length})
                          </Typography>
                          {campagnesTerminees.map((campagne) => (
                            <Paper
                              key={campagne.id}
                              sx={{
                                p: 1.5,
                                mb: 1,
                                cursor: 'pointer',
                                borderLeft: '3px solid #d32f2f',
                                '&:hover': { bgcolor: '#ffebee' },
                                position: 'relative',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <CheckCircle sx={{ color: '#d32f2f', fontSize: 20, mt: 0.2 }} />
                                <Box sx={{ flex: 1 }} onClick={() => handleNavigateToCampagne(campagne.id)}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {campagne.nom}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {campagne.type_assistance?.libelle} - {campagne.lieu}
                                  </Typography>
                                  <Chip
                                    label={`Terminée il y a ${campagne.joursDepuisFin} jour${campagne.joursDepuisFin > 1 ? 's' : ''}`}
                                    size="small"
                                    color="error"
                                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                  />
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Date de fin: {formatDate(campagne.date_fin)}
                                  </Typography>
                                </Box>
                                <Tooltip title="Marquer comme lu">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markCampagneAsViewed(campagne.id);
                                    }}
                                  >
                                    <VisibilityOff fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      )}

                      {/* Campagnes proche de la fin */}
                      {campagnesProcheFin.length > 0 && (
                        <Box>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="warning.main"
                            sx={{ px: 1, py: 0.5, display: 'block' }}
                          >
                            Fin prochaine ({campagnesProcheFin.length})
                          </Typography>
                          {campagnesProcheFin.map((campagne) => (
                            <Paper
                              key={campagne.id}
                              sx={{
                                p: 1.5,
                                mb: 1,
                                cursor: 'pointer',
                                borderLeft: '3px solid #ed6c02',
                                '&:hover': { bgcolor: '#fff3e0' },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Event sx={{ color: '#ed6c02', fontSize: 20, mt: 0.2 }} />
                                <Box sx={{ flex: 1 }} onClick={() => handleNavigateToCampagne(campagne.id)}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {campagne.nom}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {campagne.type_assistance?.libelle} - {campagne.lieu}
                                  </Typography>
                                  <Chip
                                    label={`Se termine dans ${campagne.joursRestants} jour${campagne.joursRestants > 1 ? 's' : ''}`}
                                    size="small"
                                    color="warning"
                                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                  />
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Date de fin: {formatDate(campagne.date_fin)}
                                  </Typography>
                                </Box>
                                <Tooltip title="Marquer comme lu">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markCampagneAsViewed(campagne.id);
                                    }}
                                  >
                                    <VisibilityOff fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      )}
                    </>
                  )}

                  {/* SECTION ASSISTANCES MÉDICALES */}
                  {(pretsEnRetard.length > 0 || pretsProchesEcheance.length > 0) && (
                    <>
                      <Box sx={{ px: 1, py: 1, bgcolor: '#f5f5f5', borderRadius: 1, mt: campagneCount > 0 ? 1 : 0 }}>
                        <Typography variant="caption" fontWeight={700} color="primary">
                          🏥 ASSISTANCES MÉDICALES ({assistanceCount})
                        </Typography>
                      </Box>

                      {/* Prêts en retard */}
                      {pretsEnRetard.length > 0 && (
                        <Box>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="error.main"
                            sx={{ px: 1, py: 0.5, display: 'block' }}
                          >
                            Prêts en retard ({pretsEnRetard.length})
                          </Typography>
                          {pretsEnRetard.map((pret) => (
                            <Paper
                              key={pret.id}
                              sx={{
                                p: 1.5,
                                mb: 1,
                                cursor: 'pointer',
                                borderLeft: '3px solid #d32f2f',
                                '&:hover': { bgcolor: '#ffebee' },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Error sx={{ color: '#d32f2f', fontSize: 20, mt: 0.2 }} />
                                <Box sx={{ flex: 1 }} onClick={() => handleNavigateToAssistance(pret.id)}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {pret.beneficiaire?.nom} {pret.beneficiaire?.prenom}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {pret.type_assistance?.libelle}
                                    {pret.detail_type_assistance && ` - ${pret.detail_type_assistance.libelle}`}
                                  </Typography>
                                  <Chip
                                    label={`En retard de ${pret.joursRetard} jour${pret.joursRetard > 1 ? 's' : ''}`}
                                    size="small"
                                    color="error"
                                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                  />
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Retour prévu: {formatDate(pret.date_retour_prevue)}
                                  </Typography>
                                </Box>
                                <Tooltip title="Marquer comme lu">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAssistanceAsViewed(pret.id);
                                    }}
                                  >
                                    <VisibilityOff fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      )}

                      {/* Prêts proches de l'échéance */}
                      {pretsProchesEcheance.length > 0 && (
                        <Box>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="warning.main"
                            sx={{ px: 1, py: 0.5, display: 'block' }}
                          >
                            Échéances proches ({pretsProchesEcheance.length})
                          </Typography>
                          {pretsProchesEcheance.map((pret) => (
                            <Paper
                              key={pret.id}
                              sx={{
                                p: 1.5,
                                mb: 1,
                                cursor: 'pointer',
                                borderLeft: '3px solid #ed6c02',
                                '&:hover': { bgcolor: '#fff3e0' },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Warning sx={{ color: '#ed6c02', fontSize: 20, mt: 0.2 }} />
                                <Box sx={{ flex: 1 }} onClick={() => handleNavigateToAssistance(pret.id)}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {pret.beneficiaire?.nom} {pret.beneficiaire?.prenom}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {pret.type_assistance?.libelle}
                                    {pret.detail_type_assistance && ` - ${pret.detail_type_assistance.libelle}`}
                                  </Typography>
                                  <Chip
                                    label={`${pret.joursRestants} jour${pret.joursRestants > 1 ? 's' : ''} restant${pret.joursRestants > 1 ? 's' : ''}`}
                                    size="small"
                                    color="warning"
                                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                  />
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Retour prévu: {formatDate(pret.date_retour_prevue)}
                                  </Typography>
                                </Box>
                                <Tooltip title="Marquer comme lu">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAssistanceAsViewed(pret.id);
                                    }}
                                  >
                                    <VisibilityOff fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      )}
                    </>
                  )}
                </Stack>
              )}
            </Box>
          </Menu>

          {/* User Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <MenuItem
              disabled
              sx={{
                p: 2,
                '&.Mui-disabled': {
                  opacity: 1,
                },
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {user?.prenom} {user?.nom}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleLogout}
              sx={{
                color: '#d32f2f',
                gap: 1,
                '&:hover': {
                  bgcolor: 'rgba(211, 47, 47, 0.08)',
                },
              }}
            >
              <Logout fontSize="small" />
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer - Mobile */}
      <Box
        component="nav"
        sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer - Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              transition: 'width 0.2s ease-in-out',
              overflowX: 'hidden',
              borderRight: '1px solid #e0e0e0',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }} />
        <Box>{children}</Box>
      </Box>
    </Box>
  );
};

export default UASLayout;