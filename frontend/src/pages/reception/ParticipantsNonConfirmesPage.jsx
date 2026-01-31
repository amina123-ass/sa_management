// src/pages/reception/ParticipantsNonConfirmesPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Cancel,
  HourglassEmpty,
  CheckCircle,
  Person,
  Phone,
  FilterList,
} from '@mui/icons-material';
import CampagneSelector from '../../components/reception/CampagneSelector';
import { receptionService } from '../../services/api';
import { toast } from 'react-toastify';

const ParticipantsNonConfirmesPage = () => {
  const [selectedCampagne, setSelectedCampagne] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState(''); // '', 'Non', ou 'En attente'

  useEffect(() => {
    if (selectedCampagne) {
      loadParticipants();
    }
  }, [selectedCampagne, page, rowsPerPage, search, statutFilter]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getParticipants(selectedCampagne, {
        page: page + 1,
        per_page: rowsPerPage,
        search: search,
        statut: statutFilter || undefined,
      });

      if (response.data.success) {
        // Filtrer côté client pour exclure les "Oui"
        const filtered = response.data.data.data.filter(p => p.statut !== 'Oui');
        setParticipants(filtered);
        setTotalParticipants(response.data.data.total);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des participants');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (participantId, newStatus) => {
    try {
      await receptionService.updateParticipant(participantId, {
        statut: newStatus,
        date_appel: new Date().toISOString().split('T')[0],
        appel_effectue: true,
      });
      toast.success(`Statut mis à jour: ${newStatus}`);
      loadParticipants();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatutChip = (statut) => {
    const config = {
      'Non': { color: 'error', icon: <Cancel /> },
      'En attente': { color: 'warning', icon: <HourglassEmpty /> },
    };
    return (
      <Chip
        label={statut}
        color={config[statut]?.color || 'default'}
        size="small"
        icon={config[statut]?.icon}
      />
    );
  };

  const stats = {
    total: participants.length,
    refuses: participants.filter(p => p.statut === 'Non').length,
    enAttente: participants.filter(p => p.statut === 'En attente').length,
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Cancel sx={{ color: '#dc3545', fontSize: 32 }} />
          <Typography variant="h4" fontWeight={600} color="#dc3545">
            Participants Non Confirmés
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Liste des participants avec statut "Non" ou "En attente"
        </Typography>
      </Box>

      {/* Sélection campagne */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CampagneSelector
          value={selectedCampagne}
          onChange={setSelectedCampagne}
        />
      </Paper>

      {selectedCampagne && (
        <>
          {/* Statistiques */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                bgcolor: '#fff3cd',
                boxShadow: 'none',
                borderRadius: 2,
                border: '1px solid #ffe0b2'
              }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" fontWeight={600} color="warning.main">
                    {stats.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Total Non Confirmés
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                bgcolor: '#ffebee',
                boxShadow: 'none',
                borderRadius: 2,
                border: '1px solid #ffcdd2'
              }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" fontWeight={600} color="error.main">
                    {stats.refuses}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Refusés (Non)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                bgcolor: '#fff3e0',
                boxShadow: 'none',
                borderRadius: 2,
                border: '1px solid #ffe0b2'
              }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" fontWeight={600} color="warning.dark">
                    {stats.enAttente}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    En Attente
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filtres et recherche */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Rechercher par nom, prénom, CIN, téléphone..."
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                  size="small"
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
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FilterList fontSize="small" />
                      Filtrer par statut
                    </Box>
                  </InputLabel>
                  <Select
                    value={statutFilter}
                    onChange={(e) => setStatutFilter(e.target.value)}
                    label="Filtrer par statut"
                    sx={{
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                      }
                    }}
                  >
                    <MenuItem value="">Tous (Non + En attente)</MenuItem>
                    <MenuItem value="Non">Refusés (Non)</MenuItem>
                    <MenuItem value="En attente">En Attente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Table */}
          <Paper sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
              </Box>
            ) : participants.length === 0 ? (
              <Alert severity="success" icon={<CheckCircle />} sx={{ m: 3, borderRadius: 2 }}>
                Excellent ! Aucun participant non confirmé pour cette campagne
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                        <TableCell sx={{ fontWeight: 600 }}>CIN</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Participant</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Commune</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date Appel</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Statut</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Observation</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow 
                          key={participant.id} 
                          hover
                          sx={{
                            bgcolor: participant.statut === 'Non' ? 'rgba(220, 53, 69, 0.03)' : 'rgba(255, 193, 7, 0.03)'
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {participant.cin}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ color: participant.statut === 'Non' ? '#dc3545' : '#ff9800', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {participant.prenom} {participant.nom}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {participant.sexe === 'M' ? 'Masculin' : 'Féminin'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone sx={{ fontSize: 14, color: '#1976d2' }} />
                              <Typography variant="caption">
                                {participant.telephone}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {participant.commune?.nom || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {participant.date_appel ? (
                              <Typography variant="caption">
                                {new Date(participant.date_appel).toLocaleDateString('fr-FR')}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                Pas d'appel
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {getStatutChip(participant.statut)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block'
                            }}>
                              {participant.observation_appel || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Marquer comme Confirmé (Oui)">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleQuickStatusUpdate(participant.id, 'Oui')}
                                >
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {participant.statut === 'En attente' && (
                                <Tooltip title="Marquer comme Refusé (Non)">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleQuickStatusUpdate(participant.id, 'Non')}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {participant.statut === 'Non' && (
                                <Tooltip title="Remettre En Attente">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleQuickStatusUpdate(participant.id, 'En attente')}
                                  >
                                    <HourglassEmpty fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={totalParticipants}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  labelRowsPerPage="Lignes par page:"
                />
              </>
            )}
          </Paper>

          {/* Aide contextuelle */}
          {!loading && participants.length > 0 && (
            <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                💡 Actions rapides disponibles:
              </Typography>
              <Typography variant="caption" component="div">
                • <strong>Icône verte (✓):</strong> Marquer le participant comme confirmé
              </Typography>
              <Typography variant="caption" component="div">
                • <strong>Icône rouge (✕):</strong> Marquer comme refusé (si en attente)
              </Typography>
              <Typography variant="caption" component="div">
                • <strong>Icône orange (⏳):</strong> Remettre en attente (si refusé)
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default ParticipantsNonConfirmesPage;