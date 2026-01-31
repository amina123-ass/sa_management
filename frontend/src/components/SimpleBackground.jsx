// src/components/SimpleBackground.jsx
import React from 'react';
import { Box } from '@mui/material';

const SimpleBackground = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        backgroundColor: '#f5f7fa',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
          opacity: 0.05,
        },
      }}
    />
  );
};

export default SimpleBackground;