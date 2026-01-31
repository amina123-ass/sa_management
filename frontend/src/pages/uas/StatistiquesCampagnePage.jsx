// src/pages/uas/StatistiquesCampagnePage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  Cancel as CancelIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Hearing as HearingIcon,
} from '@mui/icons-material';
import apiClient from '../../services/api';
import { toast } from 'react-toastify';

const theme = {
  primary: '#1976d2',
  secondary: '#546e7a',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  background: '#f5f7fa',
  white: '#ffffff',
};

const CHART_COLORS = {
  male: '#3b82f6',
  female: '#ec4899',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
};

const StatistiquesCampagnePage = () => {
  const [campagnes, setCampagnes] = useState([]);
  const [selectedCampagne, setSelectedCampagne] = useState('');
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCampagnes, setLoadingCampagnes] = useState(true);

  useEffect(() => {
    chargerCampagnes();
  }, []);

  const chargerCampagnes = async () => {
    try {
      setLoadingCampagnes(true);
      const response = await apiClient.get('/uas/statistiques/campagnes');
      
      if (response.data.success) {
        setCampagnes(response.data.data);
        
        if (response.data.data.length > 0 && !selectedCampagne) {
          const premiereId = response.data.data[0].id.toString();
          setSelectedCampagne(premiereId);
          chargerStatistiques(premiereId);
        }
      }
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      toast.error('Erreur lors du chargement des campagnes');
    } finally {
      setLoadingCampagnes(false);
    }
  };

  const chargerStatistiques = async (campagneId) => {
    if (!campagneId) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/uas/statistiques/campagnes/${campagneId}`);
      
      if (response.data.success) {
        setStatistiques(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleCampagneChange = (event) => {
    const campagneId = event.target.value;
    setSelectedCampagne(campagneId);
    setStatistiques(null);
    chargerStatistiques(campagneId);
  };

  const exporterStatistiques = async () => {
    if (!selectedCampagne) return;

    try {
      const response = await apiClient.get(
        `/uas/statistiques/campagnes/${selectedCampagne}/export`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `Statistiques_${selectedCampagne}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export PDF réussi !');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatPercentage = (num) => {
    return `${num.toFixed(1)}%`;
  };

  // Composant Carte de Statistique
  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary', percentage }) => (
    <Card sx={{ height: '100%', borderLeft: `4px solid ${theme[color]}` }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" color={theme[color]}>
              {typeof value === 'number' ? formatNumber(value) : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
            {percentage !== undefined && (
              <Chip
                label={formatPercentage(percentage)}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${theme[color]}15`,
              color: theme[color],
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Graphique en barres pour la répartition par âge
  const GraphiqueAge = ({ data, title }) => {
    const chartData = [
      {
        tranche: '<15 ans',
        Hommes: data?.['<15']?.M || 0,
        Femmes: data?.['<15']?.F || 0,
      },
      {
        tranche: '15-64 ans',
        Hommes: data?.['15-64']?.M || 0,
        Femmes: data?.['15-64']?.F || 0,
      },
      {
        tranche: '≥65 ans',
        Hommes: data?.['≥65']?.M || 0,
        Femmes: data?.['≥65']?.F || 0,
      },
    ];

    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="tranche" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Hommes" fill={CHART_COLORS.male} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Femmes" fill={CHART_COLORS.female} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Graphique en secteurs pour le côté affecté
  const GraphiqueCote = ({ data }) => {
    const chartData = [
      { name: 'Unilatéral', value: data?.unilateral || 0, fill: CHART_COLORS.purple },
      { name: 'Bilatéral', value: data?.bilateral || 0, fill: CHART_COLORS.cyan },
    ];

    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Répartition par côté affecté
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              dataKey="value"
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Graphique comparatif Hommes/Femmes
  const GraphiqueSexe = ({ participantsData, beneficiairesData }) => {
    const chartData = [
      {
        categorie: 'Participants',
        Hommes: participantsData?.M || 0,
        Femmes: participantsData?.F || 0,
      },
      {
        categorie: 'Bénéficiaires',
        Hommes: beneficiairesData?.M || 0,
        Femmes: beneficiairesData?.F || 0,
      },
    ];

    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Comparaison Participants vs Bénéficiaires par Sexe
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="categorie" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Hommes" fill={CHART_COLORS.male} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Femmes" fill={CHART_COLORS.female} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  const campagneSelectionnee = campagnes.find(c => c.id.toString() === selectedCampagne);

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Statistiques des Campagnes UPAS
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Analyse détaillée des participants et bénéficiaires
          </Typography>
        </Box>
        {selectedCampagne && (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exporterStatistiques}
            sx={{
              bgcolor: theme.primary,
              '&:hover': { bgcolor: '#1565c0' },
              textTransform: 'none',
            }}
          >
            Exporter PDF
          </Button>
        )}
      </Box>

      {/* Sélection de campagne */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Sélectionner une campagne</InputLabel>
              <Select
                value={selectedCampagne}
                onChange={handleCampagneChange}
                label="Sélectionner une campagne"
                disabled={loadingCampagnes || campagnes.length === 0}
              >
                {campagnes.length === 0 && (
                  <MenuItem value="" disabled>
                    Aucune campagne disponible
                  </MenuItem>
                )}
                {campagnes.map((campagne) => (
                  <MenuItem key={campagne.id} value={campagne.id.toString()}>
                    {campagne.nom} - {campagne.type_assistance}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {campagneSelectionnee && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: theme.background, border: `1px solid ${theme.primary}` }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="textSecondary">
                    Type d'assistance
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {campagneSelectionnee.type_assistance}
                  </Typography>
                  <Chip 
                    label={campagneSelectionnee.statut} 
                    size="small" 
                    color="primary"
                    sx={{ width: 'fit-content' }}
                  />
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Chargement des statistiques...
          </Typography>
        </Box>
      )}

      {/* Statistiques */}
      {statistiques && !loading && (
        <Box>
          {/* Indicateurs clés */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AssessmentIcon sx={{ color: theme.primary }} />
            <Typography variant="h6" fontWeight={600}>
              Indicateurs Clés de Performance
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Participants"
                value={statistiques.indicateurs.total_participants}
                subtitle="Population cible"
                icon={PeopleIcon}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Bénéficiaires Acceptés"
                value={statistiques.indicateurs.beneficiaires_acceptes}
                subtitle="Ayant bénéficié de l'assistance"
                icon={CheckCircleIcon}
                color="success"
                percentage={statistiques.indicateurs.taux_couverture}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="En Attente"
                value={statistiques.indicateurs.beneficiaires_en_attente}
                subtitle="En cours de traitement"
                icon={HourglassIcon}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Backlog"
                value={statistiques.indicateurs.backlog}
                subtitle="Participants non couverts"
                icon={CancelIcon}
                color="error"
              />
            </Grid>
          </Grid>

          {/* Taux de performance */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Taux de Couverture"
                value={formatPercentage(statistiques.indicateurs.taux_couverture)}
                subtitle="Acceptés / Participants"
                icon={TrendingUpIcon}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Taux d'Acceptation"
                value={formatPercentage(statistiques.indicateurs.taux_acceptation)}
                subtitle="Acceptés / Total bénéficiaires"
                icon={CheckCircleIcon}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Taux de Confirmation"
                value={formatPercentage(statistiques.indicateurs.taux_confirmation)}
                subtitle="Participants confirmés"
                icon={CheckCircleIcon}
                color="primary"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Section Participants */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PeopleIcon sx={{ color: theme.primary }} />
            <Typography variant="h6" fontWeight={600}>
              Population Cible - Participants
            </Typography>
          </Box>
          
          {/* Cartes récapitulatives participants */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Répartition par Sexe
                </Typography>
                <Box display="flex" justifyContent="space-around" mt={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={CHART_COLORS.male} fontWeight="bold">
                      {formatNumber(statistiques.participants.par_sexe.M)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Hommes
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" color={CHART_COLORS.female} fontWeight="bold">
                      {formatNumber(statistiques.participants.par_sexe.F)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Femmes
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Statut des Participants
                </Typography>
                <Box mt={2}>
                  {[
                    { label: 'Confirmés (Oui)', value: statistiques.participants.par_statut.oui, color: theme.success },
                    { label: 'Refusés (Non)', value: statistiques.participants.par_statut.non, color: theme.error },
                    { label: 'En attente', value: statistiques.participants.par_statut.en_attente, color: theme.warning },
                  ].map((stat, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Typography variant="body2">{stat.label}</Typography>
                      <Chip
                        label={formatNumber(stat.value)}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Graphique participants par âge */}
          <Box sx={{ mb: 4 }}>
            <GraphiqueAge
              data={statistiques.participants.par_age}
              title="Répartition des Participants par Tranche d'Âge et Sexe"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Section Bénéficiaires */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircleIcon sx={{ color: theme.success }} />
            <Typography variant="h6" fontWeight={600}>
              Population Servie - Bénéficiaires
            </Typography>
          </Box>

          {/* Cartes récapitulatives bénéficiaires */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Répartition par Sexe
                </Typography>
                <Box display="flex" justifyContent="space-around" mt={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={CHART_COLORS.male} fontWeight="bold">
                      {formatNumber(statistiques.beneficiaires.par_sexe.M)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Hommes
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" color={CHART_COLORS.female} fontWeight="bold">
                      {formatNumber(statistiques.beneficiaires.par_sexe.F)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Femmes
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Décisions
                </Typography>
                <Box mt={2}>
                  {[
                    { label: 'Acceptés', value: statistiques.beneficiaires.par_decision.accepte, color: theme.success },
                    { label: 'Refusés', value: statistiques.beneficiaires.par_decision.refuse, color: theme.error },
                    { label: 'En attente', value: statistiques.beneficiaires.par_decision.en_attente, color: theme.warning },
                  ].map((stat, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">{stat.label}</Typography>
                      <Chip
                        label={formatNumber(stat.value)}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Enfants Scolarisés"
                value={statistiques.beneficiaires.enfants_scolarises.total}
                subtitle={`H: ${statistiques.beneficiaires.enfants_scolarises.M} | F: ${statistiques.beneficiaires.enfants_scolarises.F}`}
                icon={SchoolIcon}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Graphique bénéficiaires par âge */}
          <Box sx={{ mb: 3 }}>
            <GraphiqueAge
              data={statistiques.beneficiaires.par_age}
              title="Répartition des Bénéficiaires par Tranche d'Âge et Sexe"
            />
          </Box>

          {/* Graphique comparatif */}
          <Box sx={{ mb: 4 }}>
            <GraphiqueSexe
              participantsData={statistiques.participants.par_sexe}
              beneficiairesData={statistiques.beneficiaires.par_sexe}
            />
          </Box>

          {/* Statistiques spécifiques Appareils Auditifs */}
          {statistiques.auditifs && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HearingIcon sx={{ color: theme.info }} />
                <Typography variant="h6" fontWeight={600}>
                  Statistiques Spécifiques - Appareils Auditifs
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <GraphiqueCote data={statistiques.auditifs.par_cote} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Détails par Côté Affecté
                    </Typography>
                    <Box mt={3}>
                      {[
                        { label: 'Unilatéral', value: statistiques.auditifs.par_cote.unilateral, color: CHART_COLORS.purple },
                        { label: 'Bilatéral', value: statistiques.auditifs.par_cote.bilateral, color: CHART_COLORS.cyan },
                        { label: 'Non spécifié', value: statistiques.auditifs.par_cote.non_specifie, color: theme.warning },
                      ].map((stat, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            mb: 2,
                            bgcolor: theme.background,
                            borderRadius: 1,
                            borderLeft: `4px solid ${stat.color}`,
                          }}
                        >
                          <Typography variant="body1" fontWeight="medium">
                            {stat.label}
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" color={stat.color}>
                            {formatNumber(stat.value)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      )}

      {/* Message si pas de campagne sélectionnée */}
      {!selectedCampagne && !loading && !loadingCampagnes && campagnes.length > 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 64, color: theme.secondary, mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Sélectionnez une campagne
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Choisissez une campagne dans la liste ci-dessus pour afficher ses statistiques détaillées.
          </Typography>
        </Paper>
      )}

      {/* Message si pas de campagnes */}
      {!loadingCampagnes && campagnes.length === 0 && (
        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            Aucune campagne disponible
          </Typography>
          <Typography variant="body2">
            Il n'y a actuellement aucune campagne dans le système. Créez une nouvelle campagne pour commencer.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default StatistiquesCampagnePage;