// src/theme/uasTheme.js
import { createTheme } from '@mui/material/styles';

const uasTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#455a64',
      light: '#718792',
      dark: '#1c313a',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#263238',
      secondary: '#546e7a',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
      letterSpacing: '-0.01562em',
      color: '#263238',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
      letterSpacing: '-0.00833em',
      color: '#263238',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.75rem',
      letterSpacing: '0em',
      color: '#263238',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
      letterSpacing: '0.00735em',
      color: '#263238',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      letterSpacing: '0em',
      color: '#263238',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.125rem',
      letterSpacing: '0.0075em',
      color: '#263238',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.02857em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 4,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.08)',
    '0px 2px 4px rgba(0, 0, 0, 0.1)',
    '0px 4px 6px rgba(0, 0, 0, 0.1)',
    '0px 6px 8px rgba(0, 0, 0, 0.12)',
    '0px 8px 12px rgba(0, 0, 0, 0.12)',
    '0px 10px 16px rgba(0, 0, 0, 0.14)',
    '0px 12px 20px rgba(0, 0, 0, 0.14)',
    '0px 1px 3px rgba(0,0,0,0.12)',
    '0px 1px 5px rgba(0,0,0,0.2)',
    '0px 1px 8px rgba(0,0,0,0.24)',
    '0px 1px 10px rgba(0,0,0,0.28)',
    '0px 1px 14px rgba(0,0,0,0.32)',
    '0px 1px 18px rgba(0,0,0,0.36)',
    '0px 2px 16px rgba(0,0,0,0.4)',
    '0px 3px 14px rgba(0,0,0,0.44)',
    '0px 3px 16px rgba(0,0,0,0.48)',
    '0px 4px 18px rgba(0,0,0,0.52)',
    '0px 4px 20px rgba(0,0,0,0.56)',
    '0px 5px 22px rgba(0,0,0,0.6)',
    '0px 5px 24px rgba(0,0,0,0.64)',
    '0px 5px 26px rgba(0,0,0,0.68)',
    '0px 6px 28px rgba(0,0,0,0.72)',
    '0px 6px 30px rgba(0,0,0,0.76)',
    '0px 6px 32px rgba(0,0,0,0.8)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e0e0e0',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: '#ffffff',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#90caf9',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
              borderColor: '#1976d2',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#f5f7fa',
            color: '#263238',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderBottom: '2px solid #e0e0e0',
            padding: '16px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f5f7fa',
          },
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: '#f5f7fa',
          borderBottom: '1px solid #e0e0e0',
          color: '#263238',
          fontWeight: 500,
          fontSize: '1.25rem',
          padding: '16px 24px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e0e0e0',
          boxShadow: 'none',
        },
      },
    },
  },
});

export default uasTheme;