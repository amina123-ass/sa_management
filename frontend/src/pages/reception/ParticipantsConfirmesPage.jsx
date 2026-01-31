// src/pages/reception/ParticipantsConfirmesPage.jsx

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
  Button,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Print,
  Search,
  CheckCircle,
  Download,
  Person,
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material';
import CampagneSelector from '../../components/reception/CampagneSelector';
import { receptionService } from '../../services/api';
import { toast } from 'react-toastify';

const ParticipantsConfirmesPage = () => {
  const [selectedCampagne, setSelectedCampagne] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [search, setSearch] = useState('');
  const [generatingConvocation, setGeneratingConvocation] = useState(null);

  useEffect(() => {
    if (selectedCampagne) {
      loadParticipants();
    }
  }, [selectedCampagne, page, rowsPerPage, search]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getParticipants(selectedCampagne, {
        page: page + 1,
        per_page: rowsPerPage,
        search: search,
        statut: 'Oui', // Filtrer uniquement les participants confirmés
      });

      if (response.data.success) {
        setParticipants(response.data.data.data);
        setTotalParticipants(response.data.data.total);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des participants');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintConvocation = async (participantId, participantNom) => {
    try {
      setGeneratingConvocation(participantId);
      const response = await receptionService.genererConvocation(participantId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `convocation_${participantNom}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Convocation générée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération de la convocation');
    } finally {
      setGeneratingConvocation(null);
    }
  };

  const handlePrintAllConvocations = async () => {
    if (participants.length === 0) {
      toast.warning('Aucun participant confirmé');
      return;
    }

    toast.info('Génération de toutes les convocations...');
    for (const participant of participants) {
      await handlePrintConvocation(participant.id, `${participant.prenom}_${participant.nom}`);
      // Petit délai pour éviter de surcharger le serveur
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <CheckCircle sx={{ color: '#28a745', fontSize: 32 }} />
          <Typography variant="h4" fontWeight={600} color="#28a745">
            Participants Confirmés
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Liste des participants confirmés avec génération de convocations
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
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <Card sx={{ 
              flex: 1, 
              bgcolor: '#e8f5e9',
              boxShadow: 'none',
              borderRadius: 2,
              border: '1px solid #c8e6c9'
            }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {totalParticipants}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Participants Confirmés
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ 
              flex: 1,
              bgcolor: '#fff3e0',
              boxShadow: 'none',
              borderRadius: 2,
              border: '1px solid #ffe0b2'
            }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight={600} color="warning.main">
                  {participants.filter(p => p.date_appel).length}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Avec Date d'Appel
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ 
              flex: 1,
              bgcolor: '#e3f2fd',
              boxShadow: 'none',
              borderRadius: 2,
              border: '1px solid #bbdefb'
            }}>
              <CardContent sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 2
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500} gutterBottom>
                    Convocations
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Download />}
                    onClick={handlePrintAllConvocations}
                    disabled={participants.length === 0}
                    sx={{ 
                      mt: 1,
                      backgroundColor: '#1976d2',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      }
                    }}
                  >
                    Tout Télécharger
                  </Button>
                </Box>
                <Print sx={{ fontSize: 40, color: '#1976d2', opacity: 0.2 }} />
              </CardContent>
            </Card>
          </Stack>

          {/* Barre de recherche */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
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
          </Paper>

          {/* Table */}
          <Paper sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
              </Box>
            ) : participants.length === 0 ? (
              <Alert severity="info" sx={{ m: 3, borderRadius: 2 }}>
                Aucun participant confirmé trouvé pour cette campagne
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                        <TableCell sx={{ fontWeight: 600 }}>CIN</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Informations Participant</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Commune</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date Appel</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Statut</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Convocation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow 
                          key={participant.id} 
                          hover
                          sx={{
                            bgcolor: 'rgba(40, 167, 69, 0.02)'
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {participant.cin}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ color: '#28a745', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {participant.prenom} {participant.nom}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {participant.sexe === 'M' ? 'Masculin' : 'Féminin'} - 
                                  {new Date(participant.date_naissance).toLocaleDateString('fr-FR')}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <Phone sx={{ fontSize: 14, color: '#1976d2' }} />
                                <Typography variant="caption">
                                  {participant.telephone}
                                </Typography>
                              </Box>
                              {participant.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Email sx={{ fontSize: 14, color: '#1976d2' }} />
                                  <Typography variant="caption">
                                    {participant.email}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn sx={{ fontSize: 16, color: '#1976d2' }} />
                              <Typography variant="caption">
                                {participant.commune?.nom || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {participant.date_appel ? (
                              <Typography variant="caption">
                                {new Date(participant.date_appel).toLocaleDateString('fr-FR')}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Non renseignée
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label="Confirmé"
                              color="success"
                              size="small"
                              icon={<CheckCircle />}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Générer la convocation PDF">
                              <IconButton
                                color="primary"
                                onClick={() => handlePrintConvocation(
                                  participant.id,
                                  `${participant.prenom}_${participant.nom}`
                                )}
                                disabled={generatingConvocation === participant.id}
                              >
                                {generatingConvocation === participant.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <Print />
                                )}
                              </IconButton>
                            </Tooltip>
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
        </>
      )}
    </Container>
  );
};

export default ParticipantsConfirmesPage;