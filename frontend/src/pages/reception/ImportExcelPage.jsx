// src/pages/reception/ImportExcelPage.jsx

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Upload,
  CloudUpload,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import CampagneSelector from '../../components/reception/CampagneSelector';
import { receptionService } from '../../services/api';
import { toast } from 'react-toastify';

const ImportExcelPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCampagne, setSelectedCampagne] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const steps = ['Sélectionner la campagne', 'Choisir le fichier Excel', 'Importer'];

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
      }
      setSelectedFile(file);
      setActiveStep(2);
    }
  };

  const handleImport = async () => {
    if (!selectedCampagne || !selectedFile) {
      toast.error('Veuillez sélectionner une campagne et un fichier');
      return;
    }

    try {
      setImporting(true);
      const response = await receptionService.importParticipants(selectedCampagne, selectedFile);
      
      if (response.data.success) {
        setImportResult(response.data.data);
        toast.success('Import terminé avec succès');
        setActiveStep(3);
      }
    } catch (error) {
      console.error('Erreur import:', error);
      toast.error('Erreur lors de l\'import du fichier');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedCampagne('');
    setSelectedFile(null);
    setImportResult(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600} color="#1976d2">
          Import de Fichier Excel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Importez les participants depuis un fichier Excel
        </Typography>
      </Box>

      <Paper sx={{ p: 4, boxShadow: '0 2px 20px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Instructions */}
        <Alert severity="info" icon={<Info />} sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Instructions d'import :
          </Typography>
          <List dense>
            <ListItem sx={{ py: 0 }}>
              <ListItemText 
                primary="1. Téléchargez d'abord le fichier Canva depuis la page 'Campagnes'"
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemText 
                primary="2. Remplissez le fichier Excel avec les données des participants"
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemText 
                primary="3. Utilisez cette page pour importer le fichier rempli"
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          </List>
        </Alert>

        {/* Step 0: Sélection campagne */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Étape 1: Sélectionner la campagne
            </Typography>
            <CampagneSelector 
              value={selectedCampagne}
              onChange={(value) => {
                setSelectedCampagne(value);
                if (value) setActiveStep(1);
              }}
            />
          </Box>
        )}

        {/* Step 1: Sélection fichier */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Étape 2: Choisir le fichier Excel
            </Typography>
            
            <Card sx={{ 
              border: '2px dashed #1976d2',
              bgcolor: '#f5f7fa',
              cursor: 'pointer',
              borderRadius: 2,
              '&:hover': { bgcolor: '#e3f2fd' },
              mb: 2
            }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <CloudUpload sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Cliquez pour sélectionner un fichier Excel
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Formats acceptés: .xlsx, .xls (Max 10 MB)
                  </Typography>
                </label>
              </CardContent>
            </Card>

            {selectedFile && (
              <Alert severity="success" icon={<CheckCircle />} sx={{ borderRadius: 2 }}>
                Fichier sélectionné: <strong>{selectedFile.name}</strong>
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button 
                onClick={() => setActiveStep(0)}
                sx={{ textTransform: 'none' }}
              >
                Retour
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Import */}
        {activeStep === 2 && !importResult && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Étape 3: Lancer l'import
            </Typography>

            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  Récapitulatif:
                </Typography>
                <Divider sx={{ my: 1 }} />
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Fichier"
                      secondary={selectedFile?.name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Taille"
                      secondary={`${(selectedFile?.size / 1024).toFixed(2)} KB`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {importing && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Import en cours...
                </Typography>
                <LinearProgress />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                onClick={() => setActiveStep(1)}
                disabled={importing}
                sx={{ textTransform: 'none' }}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={handleImport}
                disabled={importing}
                sx={{
                  backgroundColor: '#1976d2',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  }
                }}
              >
                {importing ? 'Import en cours...' : 'Lancer l\'import'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Résultats */}
        {activeStep === 3 && importResult && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600} color="success.main">
              ✅ Import terminé
            </Typography>

            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Participants ajoutés"
                      secondary={`${importResult.imported} nouveau(x) participant(s)`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Participants mis à jour"
                      secondary={`${importResult.updated} participant(s) existant(s)`}
                    />
                  </ListItem>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <Error color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Erreurs rencontrées"
                        secondary={`${importResult.errors.length} ligne(s) en erreur`}
                      />
                    </ListItem>
                  )}
                </List>

                {importResult.errors && importResult.errors.length > 0 && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                    <Typography variant="caption" component="div" fontWeight={600}>
                      Détails des erreurs:
                    </Typography>
                    {importResult.errors.slice(0, 5).map((error, idx) => (
                      <Typography key={idx} variant="caption" display="block">
                        • {error}
                      </Typography>
                    ))}
                    {importResult.errors.length > 5 && (
                      <Typography variant="caption" color="text.secondary">
                        ... et {importResult.errors.length - 5} autres erreurs
                      </Typography>
                    )}
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Button
              variant="contained"
              onClick={handleReset}
              sx={{
                backgroundColor: '#1976d2',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#1565c0',
                }
              }}
            >
              Nouvel import
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ImportExcelPage;