// src/pages/reception/CampagnesPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download,
  Search,
  Campaign as CampaignIcon,
  CalendarToday,
  LocationOn,
  Category,
} from '@mui/icons-material';
import { receptionService } from '../../services/api';
import { toast } from 'react-toastify';

const CampagnesPage = () => {
  const [campagnes, setCampagnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingCanva, setDownloadingCanva] = useState(null);

  useEffect(() => {
    loadCampagnes();
  }, [search]);

  const loadCampagnes = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getCampagnes({
        search: search,
        per_page: 100,
      });

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

  const handleDownloadCanva = async (campagneId, campagneNom) => {
    try {
      setDownloadingCanva(campagneId);
      
      const response = await receptionService.genererCanva(campagneId);
      
      if (!response.data || !(response.data instanceof Blob) || response.data.size === 0) {
        throw new Error('Fichier invalide reçu');
      }
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `canva_${campagneNom.replace(/\s+/g, '_')}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Fichier Canva téléchargé avec succès');
      
    } catch (error) {
      console.error('Erreur téléchargement Canva:', error);
      toast.error('Erreur lors du téléchargement du fichier Canva');
    } finally {
      setDownloadingCanva(null);
    }
  };

  const getStatutChip = (campagne) => {
    const now = new Date();
    const dateDebut = new Date(campagne.date_debut);
    const dateFin = new Date(campagne.date_fin);

    if (now < dateDebut) {
      return <Chip label="À venir" color="info" size="small" />;
    } else if (now >= dateDebut && now <= dateFin) {
      return <Chip label="En cours" color="success" size="small" />;
    } else {
      return <Chip label="Terminée" color="default" size="small" />;
    }
  };

  const filteredCampagnes = campagnes.filter(c => 
    search === '' ||
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.type_assistance?.libelle.toLowerCase().includes(search.toLowerCase()) ||
    c.lieu.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600} color="#1976d2">
          Gestion des Campagnes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Consultez les campagnes et téléchargez le fichier Canva Excel pour chaque campagne
        </Typography>
      </Box>

      {/* Barre de recherche */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Rechercher une campagne par nom, type d'assistance ou lieu..."
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#1976d2',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
              },
            }
          }}
        />
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={5}>
          <CircularProgress />
        </Box>
      ) : filteredCampagnes.length === 0 ? (
        <Alert severity="info" icon={<CampaignIcon />}>
          {search ? 'Aucune campagne trouvée pour votre recherche' : 'Aucune campagne disponible'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredCampagnes.map((campagne) => (
            <Grid item xs={12} md={6} lg={4} key={campagne.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(25, 118, 210, 0.15)',
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <Box sx={{ 
                  backgroundColor: '#1976d2',
                  p: 2.5,
                  color: 'white'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" fontWeight={600}>
                      {campagne.nom}
                    </Typography>
                    {getStatutChip(campagne)}
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, pt: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Category sx={{ mr: 1.5, color: '#1976d2', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Type:</strong> {campagne.type_assistance?.libelle || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarToday sx={{ mr: 1.5, color: '#1976d2', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Période:</strong>{' '}
                      {new Date(campagne.date_debut).toLocaleDateString('fr-FR')}
                      {' → '}
                      {new Date(campagne.date_fin).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1.5, color: '#1976d2', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Lieu:</strong> {campagne.lieu}
                    </Typography>
                  </Box>

                  {campagne.description && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f7fa', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {campagne.description}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={
                      downloadingCanva === campagne.id ? 
                      <CircularProgress size={16} color="inherit" /> : 
                      <Download />
                    }
                    onClick={() => handleDownloadCanva(campagne.id, campagne.nom)}
                    disabled={downloadingCanva === campagne.id}
                    sx={{
                      backgroundColor: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    {downloadingCanva === campagne.id ? 'Téléchargement...' : 'Télécharger Canva Excel'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && filteredCampagnes.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f7fa', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Total: <strong>{filteredCampagnes.length}</strong> campagne(s) affichée(s)
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default CampagnesPage;