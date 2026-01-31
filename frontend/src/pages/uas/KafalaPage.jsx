import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  FamilyRestroom,
  Person,
  ContactPhone,
  ChildCare,
  ErrorOutline,
  CloudUpload,
  InsertDriveFile,
  Male as MaleIcon,
  Female as FemaleIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { kafalaService } from '../../services/api';

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

const formatDateForInput = (isoDate) => {
  if (!isoDate) return '';
  return isoDate.split('T')[0];
};

const KafalaPage = () => {
  const [kafalas, setKafalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingKafala, setEditingKafala] = useState(null);
  const [viewingKafala, setViewingKafala] = useState(null);
  const [document, setDocument] = useState(null); // ✅ UN SEUL document
  const [existingDocument, setExistingDocument] = useState(null); // ✅ UN SEUL document existant
  const [deleteDocument, setDeleteDocument] = useState(false); // ✅ Pour marquer la suppression
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, kafala: null });
  const [statistics, setStatistics] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const firstInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    numero_reference: '',
    pere_nom: '',
    pere_prenom: '',
    pere_cin: '',
    mere_nom: '',
    mere_prenom: '',
    mere_cin: '',
    date_mariage: '',
    telephone: '',
    email: '',
    adresse: '',
    enfant_nom: '',
    enfant_prenom: '',
    enfant_sexe: '',
    enfant_date_naissance: '',
  });

  useEffect(() => {
    fetchKafalas();
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (openDialog && firstInputRef.current) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [openDialog]);

  const fetchKafalas = async () => {
    setLoading(true);
    try {
      const response = await kafalaService.getAll({
        page: page + 1,
        per_page: rowsPerPage,
        search,
      });
      
      const data = response.data.data.data;
      setKafalas(data);
      setTotalRows(response.data.data.total);
      calculateStatistics(data, response.data.data.total);
      
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStatistics = (dataArray, total) => {
    try {
      // ✅ document au singulier
      const avecPdf = dataArray.filter(k => k.document).length;
      const sansPdf = dataArray.filter(k => !k.document).length;
      
      setStatistics({
        total_kafalas: total,
        avec_pdf: avecPdf,
        sans_pdf: sansPdf,
      });
    } catch (error) {
      console.error('خطأ في حساب الإحصائيات:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (kafala = null) => {
    if (kafala) {
      setEditingKafala(kafala);
      setFormData({
        numero_reference: kafala.numero_reference || '',
        pere_nom: kafala.pere_nom || '',
        pere_prenom: kafala.pere_prenom || '',
        pere_cin: kafala.pere_cin || '',
        mere_nom: kafala.mere_nom || '',
        mere_prenom: kafala.mere_prenom || '',
        mere_cin: kafala.mere_cin || '',
        date_mariage: formatDateForInput(kafala.date_mariage),
        telephone: kafala.telephone || '',
        email: kafala.email || '',
        adresse: kafala.adresse || '',
        enfant_nom: kafala.enfant_nom || '',
        enfant_prenom: kafala.enfant_prenom || '',
        enfant_sexe: kafala.enfant_sexe || '',
        enfant_date_naissance: formatDateForInput(kafala.enfant_date_naissance),
      });
      setExistingDocument(kafala.document || null); // ✅ document au singulier
      setDocument(null);
      setDeleteDocument(false);
    } else {
      setEditingKafala(null);
      setFormData({
        numero_reference: '',
        pere_nom: '',
        pere_prenom: '',
        pere_cin: '',
        mere_nom: '',
        mere_prenom: '',
        mere_cin: '',
        date_mariage: '',
        telephone: '',
        email: '',
        adresse: '',
        enfant_nom: '',
        enfant_prenom: '',
        enfant_sexe: '',
        enfant_date_naissance: '',
      });
      setDocument(null);
      setExistingDocument(null);
      setDeleteDocument(false);
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingKafala(null);
    setDocument(null);
    setExistingDocument(null);
    setDeleteDocument(false);
    setErrors({});
  };

  const handleViewKafala = async (kafala) => {
    try {
      const response = await kafalaService.getOne(kafala.id);
      setViewingKafala(response.data.data);
      setOpenViewDialog(true);
    } catch (error) {
      toast.error('خطأ في تحميل التفاصيل');
      console.error('Erreur affichage:', error);
    }
  };

  const handleSubmit = async () => {
  if (!validateForm()) {
    toast.error('يرجى تصحيح الأخطاء في النموذج');
    return;
  }

  setSubmitting(true);
  try {
    const formDataToSend = new FormData();
    
    // Ajouter tous les champs NON VIDES
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (value !== null && value !== undefined && value !== '') {
        formDataToSend.append(key, value);
      }
    });

    // ✅ Ajouter le document UNIQUEMENT s'il y en a un nouveau
    if (document) {
      formDataToSend.append('document', document);
    }

    if (editingKafala) {
      // ✅ Marquer la suppression du document si demandé
      if (deleteDocument) {
        formDataToSend.append('delete_document', 'true');
      }

      // 🔍 LOGS DE DÉBOGAGE - À RETIRER APRÈS
      console.log('=== DONNÉES ENVOYÉES ===');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }
      console.log('========================');

      await kafalaService.update(editingKafala.id, formDataToSend);
      toast.success('تم تحديث الكفالة بنجاح');
    } else {
      await kafalaService.create(formDataToSend);
      toast.success('تم إنشاء الكفالة بنجاح');
    }
    
    handleCloseDialog();
    fetchKafalas();
  } catch (error) {
    console.error('Erreur soumission:', error);
    console.error('Response data:', error.response?.data);
    
    // 🔍 AFFICHER LES ERREURS DE VALIDATION EN DÉTAIL
    if (error.response?.data?.errors) {
      console.error('=== ERREURS DE VALIDATION ===');
      Object.entries(error.response.data.errors).forEach(([field, messages]) => {
        console.error(`❌ ${field}:`, messages);
      });
      console.error('=============================');
      
      setErrors(error.response.data.errors);
      toast.error('يرجى تصحيح الأخطاء في النموذج');
    } else {
      const message = error.response?.data?.message || 'خطأ في الحفظ';
      toast.error(message);
    }
  } finally {
    setSubmitting(false);
  }
};

  const handleDelete = (kafala) => {
    setDeleteDialog({ open: true, kafala });
  };

  const confirmDelete = async () => {
    try {
      await kafalaService.delete(deleteDialog.kafala.id);
      toast.success('تم حذف الكفالة بنجاح');
      fetchKafalas();
    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في الحذف';
      toast.error(message);
      console.error('Erreur suppression:', error);
    } finally {
      setDeleteDialog({ open: false, kafala: null });
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0]; // ✅ UN SEUL fichier
    
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.warning('يُسمح فقط بملفات PDF');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`الملف كبير جداً (الحد الأقصى 5MB)`);
      return;
    }
    
    setDocument(file);
    setDeleteDocument(false); // ✅ Annuler la suppression si on ajoute un nouveau doc
  };

  const removeNewDocument = () => {
    setDocument(null);
  };

  const toggleDeleteExistingDocument = () => {
    setDeleteDocument(!deleteDocument);
    if (!deleteDocument) {
      setDocument(null); // ✅ Supprimer le nouveau doc si on marque l'ancien pour suppression
    }
  };

  const handleViewPdf = async (doc) => {
    setLoadingPdf(true);
    try {
      const response = await kafalaService.viewDocument(doc.kafala_id, doc.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      setCurrentPdfUrl(blobUrl);
      setPdfViewerOpen(true);
    } catch (error) {
      console.error('خطأ في عرض PDF:', error);
      toast.error('خطأ في فتح المستند');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadPdf = async (doc) => {
    try {
      toast.info('جاري تحميل المستند...');
      const response = await kafalaService.downloadDocument(doc.kafala_id, doc.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = doc.nom_fichier || 'document.pdf';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('تم بدء التحميل');
    } catch (error) {
      console.error('خطأ في تحميل PDF:', error);
      toast.error('خطأ في التحميل');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchKafalas();
  };

  const handleClosePdfViewer = () => {
    if (currentPdfUrl) {
      URL.revokeObjectURL(currentPdfUrl);
    }
    setCurrentPdfUrl(null);
    setPdfViewerOpen(false);
  };

  const handleRowClick = (kafala, event) => {
    const target = event.target;
    const isButton = target.closest('button') || 
                    target.closest('[role="button"]') || 
                    target.closest('.MuiIconButton-root') ||
                    target.closest('.MuiChip-root');
    
    if (!isButton) {
      handleViewKafala(kafala);
    }
  };

  const getGenderIcon = (sexe) => {
    if (sexe === 'M') return <MaleIcon sx={{ color: '#2196f3', fontSize: 18 }} />;
    if (sexe === 'F') return <FemaleIcon sx={{ color: '#e91e63', fontSize: 18 }} />;
    return null;
  };

  const getGenderLabel = (sexe) => {
    if (sexe === 'M') return 'ذكر';
    if (sexe === 'F') return 'أنثى';
    return 'غير محدد';
  };

  const StatCard = ({ title, value, color, icon: Icon }) => (
    <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" color={color}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color: color,
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            إدارة الكفالة
          </Typography>
          <Typography variant="body2" color="textSecondary">
            نظام شامل لإدارة ملفات الكفالة
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? <CircularProgress size={20} /> : 'تحديث'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: theme.primary,
              '&:hover': { bgcolor: '#1565c0' },
            }}
          >
            ملف جديد
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="إجمالي الملفات"
            value={statistics?.total_kafalas || 0}
            color={theme.primary}
            icon={FamilyRestroom}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="ملفات موثقة"
            value={statistics?.avec_pdf || 0}
            color={theme.success}
            icon={PdfIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="ملفات بدون وثائق"
            value={statistics?.sans_pdf || 0}
            color={theme.warning}
            icon={ErrorOutline}
          />
        </Grid>
      </Grid>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          placeholder="البحث (رقم المرجع، اسم الأب، الأم، الطفل)..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { border: 'none' },
            },
          }}
        />
      </Paper>

      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : kafalas.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <FamilyRestroom sx={{ fontSize: 64, color: theme.secondary, mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              لا توجد ملفات كفالة
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              ابدأ بإنشاء أول ملف كفالة
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              إنشاء ملف جديد
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.background }}>
                    <TableCell sx={{ fontWeight: 600 }}>رقم المرجع</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>الأب</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>الأم</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>الطفل</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>تاريخ الزواج</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>الهاتف</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>الوثيقة</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kafalas.map((kafala) => (
                    <TableRow
                      key={kafala.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={(e) => handleRowClick(kafala, e)}
                    >
                      <TableCell>
                        {kafala.numero_reference ? (
                          <Chip label={kafala.numero_reference} color="primary" size="small" />
                        ) : (
                          <Chip label="غير محدد" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        {kafala.pere_prenom || kafala.pere_nom ? (
                          <>
                            <Typography variant="body2" fontWeight="medium">
                              {kafala.pere_prenom || ''} {kafala.pere_nom || ''}
                            </Typography>
                            {kafala.pere_cin && (
                              <Typography variant="caption" color="textSecondary">
                                ب.و: {kafala.pere_cin}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Typography variant="caption" color="textSecondary">غير محدد</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {kafala.mere_prenom || kafala.mere_nom ? (
                          <>
                            <Typography variant="body2" fontWeight="medium">
                              {kafala.mere_prenom || ''} {kafala.mere_nom || ''}
                            </Typography>
                            {kafala.mere_cin && (
                              <Typography variant="caption" color="textSecondary">
                                ب.و: {kafala.mere_cin}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Typography variant="caption" color="textSecondary">غير محدد</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {kafala.enfant_prenom || kafala.enfant_nom ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {getGenderIcon(kafala.enfant_sexe)}
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {kafala.enfant_prenom || ''} {kafala.enfant_nom || ''}
                              </Typography>
                              {kafala.enfant_date_naissance && (
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(kafala.enfant_date_naissance).toLocaleDateString('ar-MA')}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="textSecondary">غير محدد</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {kafala.date_mariage ? (
                          new Date(kafala.date_mariage).toLocaleDateString('ar-MA')
                        ) : (
                          <Typography variant="caption" color="textSecondary">غير محدد</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {kafala.telephone || <Typography variant="caption" color="textSecondary">غير محدد</Typography>}
                      </TableCell>
                      <TableCell>
                        {/* ✅ document au singulier */}
                        {kafala.document ? (
                          <Stack spacing={0.5}>
                            <Chip 
                              label="وثيقة متوفرة" 
                              size="small" 
                              color="success"
                              variant="outlined"
                              icon={<PdfIcon />}
                            />
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<ViewIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPdf(kafala.document);
                              }}
                              sx={{ fontSize: '0.7rem', justifyContent: 'flex-start' }}
                            >
                              عرض
                            </Button>
                          </Stack>
                        ) : (
                          <Chip 
                            label="لا توجد وثيقة" 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="عرض">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewKafala(kafala); }}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="تعديل">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDialog(kafala); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(kafala); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <TablePagination
              component="div"
              count={totalRows}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="عدد الصفوف:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
            />
          </>
        )}
      </Paper>

      {/* Dialog Formulaire */}
      <Dialog open={openDialog} onClose={() => !submitting && handleCloseDialog()} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.background, borderBottom: `2px solid ${theme.primary}`, fontWeight: 600 }}>
          {editingKafala ? 'تعديل ملف الكفالة' : 'ملف كفالة جديد'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="رقم المرجع (اختياري)"
                value={formData.numero_reference}
                onChange={(e) => setFormData({ ...formData, numero_reference: e.target.value })}
                error={!!errors.numero_reference}
                helperText={errors.numero_reference || "سيتم إنشاء رقم تلقائياً إذا ترك فارغاً"}
                inputRef={firstInputRef}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, bgcolor: theme.background }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ color: theme.primary }} />
                  بيانات الأب (اختياري)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="الاسم العائلي (اختياري)"
                      value={formData.pere_nom}
                      onChange={(e) => setFormData({ ...formData, pere_nom: e.target.value })}
                      error={!!errors.pere_nom}
                      helperText={errors.pere_nom}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="الاسم الشخصي (اختياري)"
                      value={formData.pere_prenom}
                      onChange={(e) => setFormData({ ...formData, pere_prenom: e.target.value })}
                      error={!!errors.pere_prenom}
                      helperText={errors.pere_prenom}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="رقم البطاقة الوطنية (اختياري)"
                      value={formData.pere_cin}
                      onChange={(e) => setFormData({ ...formData, pere_cin: e.target.value })}
                      error={!!errors.pere_cin}
                      helperText={errors.pere_cin}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, bgcolor: theme.background }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ color: theme.secondary }} />
                  بيانات الأم (اختياري)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="الاسم العائلي (اختياري)"
                      value={formData.mere_nom}
                      onChange={(e) => setFormData({ ...formData, mere_nom: e.target.value })}
                      error={!!errors.mere_nom}
                      helperText={errors.mere_nom}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="الاسم الشخصي (اختياري)"
                      value={formData.mere_prenom}
                      onChange={(e) => setFormData({ ...formData, mere_prenom: e.target.value })}
                      error={!!errors.mere_prenom}
                      helperText={errors.mere_prenom}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="رقم البطاقة الوطنية (اختياري)"
                      value={formData.mere_cin}
                      onChange={(e) => setFormData({ ...formData, mere_cin: e.target.value })}
                      error={!!errors.mere_cin}
                      helperText={errors.mere_cin}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="تاريخ الزواج (اختياري)"
                      InputLabelProps={{ shrink: true }}
                      value={formData.date_mariage}
                      onChange={(e) => setFormData({ ...formData, date_mariage: e.target.value })}
                      error={!!errors.date_mariage}
                      helperText={errors.date_mariage}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, bgcolor: theme.background }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContactPhone sx={{ color: theme.success }} />
                  معلومات الاتصال (اختياري)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="رقم الهاتف (اختياري)"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      error={!!errors.telephone}
                      helperText={errors.telephone}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="email"
                      label="البريد الإلكتروني (اختياري)"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="العنوان الكامل (اختياري)"
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      error={!!errors.adresse}
                      helperText={errors.adresse}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, bgcolor: theme.background }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ChildCare sx={{ color: theme.warning }} />
                  بيانات الطفل المكفول (اختياري)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="اسم الطفل (اختياري)"
                      value={formData.enfant_nom}
                      onChange={(e) => setFormData({ ...formData, enfant_nom: e.target.value })}
                      error={!!errors.enfant_nom}
                      helperText={errors.enfant_nom}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="الاسم الشخصي للطفل (اختياري)"
                      value={formData.enfant_prenom}
                      onChange={(e) => setFormData({ ...formData, enfant_prenom: e.target.value })}
                      error={!!errors.enfant_prenom}
                      helperText={errors.enfant_prenom}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth error={!!errors.enfant_sexe}>
                      <InputLabel>الجنس (اختياري)</InputLabel>
                      <Select
                        value={formData.enfant_sexe}
                        label="الجنس (اختياري)"
                        onChange={(e) => setFormData({ ...formData, enfant_sexe: e.target.value })}
                      >
                        <MenuItem value="">
                          <em>غير محدد</em>
                        </MenuItem>
                        <MenuItem value="M">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <MaleIcon sx={{ color: '#2196f3' }} />
                            <span>ذكر</span>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="F">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <FemaleIcon sx={{ color: '#e91e63' }} />
                            <span>أنثى</span>
                          </Stack>
                        </MenuItem>
                      </Select>
                      {errors.enfant_sexe && (
                        <FormHelperText>{errors.enfant_sexe}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="تاريخ ولادة الطفل (اختياري)"
                      InputLabelProps={{ shrink: true }}
                      value={formData.enfant_date_naissance}
                      onChange={(e) => setFormData({ ...formData, enfant_date_naissance: e.target.value })}
                      error={!!errors.enfant_date_naissance}
                      helperText={errors.enfant_date_naissance}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* ✅ SECTION DOCUMENT - UN SEUL */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, bgcolor: theme.background }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PdfIcon sx={{ color: theme.error }} />
                  الوثيقة (اختياري)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* Document existant */}
                {editingKafala && existingDocument && !deleteDocument && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      الوثيقة الحالية
                    </Typography>
                    <ListItem
                      sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 1, 
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <ListItemIcon>
                        <PdfIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={existingDocument.nom_fichier}
                        secondary={`${(existingDocument.taille / 1024).toFixed(2)} KB`}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleViewPdf(existingDocument)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={toggleDeleteExistingDocument}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItem>
                  </Box>
                )}

                {/* Message de suppression */}
                {editingKafala && deleteDocument && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">
                        الوثيقة ستُحذف عند الحفظ
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={toggleDeleteExistingDocument}
                        startIcon={<RefreshIcon />}
                      >
                        إلغاء الحذف
                      </Button>
                    </Stack>
                  </Alert>
                )}

                {/* Zone d'upload */}
                {(!existingDocument || deleteDocument) && (
                  <Box sx={{ textAlign: 'center', p: 3, border: '2px dashed #cbd5e1', borderRadius: 1 }}>
                    <input
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      id="pdf-upload-input"
                      type="file"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="pdf-upload-input">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                      >
                        {editingKafala ? 'رفع وثيقة جديدة' : 'رفع وثيقة PDF'}
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }} color="textSecondary">
                      الحد الأقصى: 5MB • الصيغة: PDF
                    </Typography>
                  </Box>
                )}
                
                {/* Nouveau document sélectionné */}
                {document && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      وثيقة جديدة
                    </Typography>
                    <ListItem
                      sx={{ bgcolor: 'white', borderRadius: 1, border: '1px solid #4caf50' }}
                    >
                      <ListItemIcon>
                        <InsertDriveFile color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={document.name}
                        secondary={`${(document.size / 1024).toFixed(2)} KB`}
                      />
                      <IconButton edge="end" onClick={removeNewDocument} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {submitting ? 'جاري الحفظ...' : (editingKafala ? 'حفظ التعديلات' : 'إنشاء الملف')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Visualisation */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.background, borderBottom: `2px solid ${theme.primary}`, fontWeight: 600 }}>
          تفاصيل ملف الكفالة
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {viewingKafala && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="h6">
                    رقم المرجع: {viewingKafala.numero_reference || 'غير محدد'}
                  </Typography>
                </Alert>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                    الأب
                  </Typography>
                  <Typography variant="body2">
                    الاسم: {viewingKafala.pere_prenom || ''} {viewingKafala.pere_nom || 'غير محدد'}
                  </Typography>
                  {viewingKafala.pere_cin && (
                    <Typography variant="caption" color="textSecondary">
                      ب.و: {viewingKafala.pere_cin}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="secondary" sx={{ mb: 1 }}>
                    الأم
                  </Typography>
                  <Typography variant="body2">
                    الاسم: {viewingKafala.mere_prenom || ''} {viewingKafala.mere_nom || 'غير محدد'}
                  </Typography>
                  {viewingKafala.mere_cin && (
                    <Typography variant="caption" color="textSecondary">
                      ب.و: {viewingKafala.mere_cin}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    تاريخ الزواج
                  </Typography>
                  <Typography variant="body2">
                    {viewingKafala.date_mariage 
                      ? new Date(viewingKafala.date_mariage).toLocaleDateString('ar-MA')
                      : 'غير محدد'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    الاتصال
                  </Typography>
                  <Typography variant="body2">الهاتف: {viewingKafala.telephone || 'غير محدد'}</Typography>
                  <Typography variant="caption">البريد: {viewingKafala.email || 'غير محدد'}</Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    العنوان
                  </Typography>
                  <Typography variant="body2">{viewingKafala.adresse || 'غير محدد'}</Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    الطفل المكفول
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    {getGenderIcon(viewingKafala.enfant_sexe)}
                    <Typography variant="body2">
                      الاسم: {viewingKafala.enfant_prenom || ''} {viewingKafala.enfant_nom || 'غير محدد'}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="textSecondary">
                    الجنس: {getGenderLabel(viewingKafala.enfant_sexe)}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="textSecondary">
                    تاريخ الولادة: {viewingKafala.enfant_date_naissance 
                      ? new Date(viewingKafala.enfant_date_naissance).toLocaleDateString('ar-MA')
                      : 'غير محدد'}
                  </Typography>
                </Paper>
              </Grid>

              {/* ✅ Document au singulier */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    الوثيقة
                  </Typography>
                  {viewingKafala.document ? (
                    <ListItem 
                      sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}
                    >
                      <ListItemIcon>
                        <PdfIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={viewingKafala.document.nom_fichier}
                        secondary={`${(viewingKafala.document.taille / 1024).toFixed(2)} KB`}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewPdf(viewingKafala.document)}
                        >
                          عرض
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<UploadIcon />}
                          onClick={() => handleDownloadPdf(viewingKafala.document)}
                        >
                          تحميل
                        </Button>
                      </Stack>
                    </ListItem>
                  ) : (
                    <Typography color="textSecondary" variant="body2">لا توجد وثيقة</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
          <Button onClick={() => setOpenViewDialog(false)} variant="contained">
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, kafala: null })}>
        <DialogTitle sx={{ bgcolor: theme.background, color: theme.error }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ErrorOutline />
            <span>تأكيد الحذف</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            تحذير: هذا الإجراء لا يمكن التراجع عنه
          </Alert>
          <Typography>
            هل أنت متأكد من حذف ملف الكفالة رقم "{deleteDialog.kafala?.numero_reference || 'غير محدد'}"؟
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
          <Button onClick={() => setDeleteDialog({ open: false, kafala: null })}>
            إلغاء
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            تأكيد الحذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Viewer PDF */}
      <Dialog 
        open={pdfViewerOpen} 
        onClose={handleClosePdfViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh', maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ bgcolor: theme.background, borderBottom: `2px solid ${theme.primary}` }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box component="span" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
              عرض المستند
            </Box>
            <IconButton onClick={handleClosePdfViewer} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {currentPdfUrl ? (
            <iframe
              src={currentPdfUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                flexGrow: 1
              }}
              title="PDF Viewer"
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: theme.background }}>
          <Button onClick={handleClosePdfViewer} variant="contained">
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KafalaPage;