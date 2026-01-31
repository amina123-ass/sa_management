// src/components/layouts/ReceptionLayout.jsx - Version professionnelle

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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Campaign,
  Upload,
  Phone,
  CheckCircle,
  Cancel,
  Logout,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 260;
const collapsedDrawerWidth = 72;

const ReceptionLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Campagnes',
      icon: <Campaign />,
      path: '/reception/campagnes',
    },
    {
      text: 'Import Excel',
      icon: <Upload />,
      path: '/reception/import',
    },
    {
      text: 'Gestion d\'Appels',
      icon: <Phone />,
      path: '/reception/gestion-appels',
    },
    {
      text: 'Participants Confirmés',
      icon: <CheckCircle />,
      path: '/reception/confirmes',
    },
    {
      text: 'Participants Non Confirmés',
      icon: <Cancel />,
      path: '/reception/non-confirmes',
    },
  ];

  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.text : 'Module Réception';
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
              SA
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
                Module Réception
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.75rem',
                }}
              >
                Gestion des Appels
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
                  {item.icon}
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
                Agent Réception
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
              },
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

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
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

        {/* Desktop drawer */}
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

export default ReceptionLayout;