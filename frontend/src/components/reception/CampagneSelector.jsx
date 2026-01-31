// src/components/reception/CampagneSelector.jsx

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Campaign } from '@mui/icons-material';
import { receptionService } from '../../services/api';
import { toast } from 'react-toastify';

const CampagneSelector = ({ value, onChange, label = "Sélectionner une campagne" }) => {
  const [campagnes, setCampagnes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampagnes();
  }, []);

  const loadCampagnes = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getCampagnes({ per_page: 100 });
      if (response.data.success) {
        setCampagnes(response.data.data.data);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des campagnes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutChip = (campagne) => {
    const now = new Date();
    const dateDebut = new Date(campagne.date_debut);
    const dateFin = new Date(campagne.date_fin);

    if (now < dateDebut) {
      return <Chip label="À venir" color="info" size="small" sx={{ ml: 1 }} />;
    } else if (now >= dateDebut && now <= dateFin) {
      return <Chip label="En cours" color="success" size="small" sx={{ ml: 1 }} />;
    } else {
      return <Chip label="Terminée" color="default" size="small" sx={{ ml: 1 }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Chargement des campagnes...
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth sx={{ bgcolor: 'white', borderRadius: 1 }}>
      <InputLabel>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Campaign fontSize="small" />
          {label}
        </Box>
      </InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        sx={{
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1976d2',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1976d2',
          }
        }}
      >
        <MenuItem value="">
          <em>-- Sélectionner une campagne --</em>
        </MenuItem>
        {campagnes.map((campagne) => (
          <MenuItem key={campagne.id} value={campagne.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {campagne.nom} - {campagne.type_assistance?.libelle}
              </Typography>
              {getStatutChip(campagne)}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CampagneSelector;