import axios from 'axios';

// ========================================
// CONFIGURATION API
// ========================================
const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.45:8001/api';

console.log('🔌 Configuration API:', {
  url: API_URL,
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// ========================================
// CRÉATION CLIENT AXIOS
// ========================================
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 secondes
});

// ========================================
// INTERCEPTEUR REQUÊTE
// ========================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Logs de debug
    console.log('📤 Requête API:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      withCredentials: config.withCredentials,
      headers: config.headers
    });
    
    // Ajouter le token si disponible
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur requête:', error);
    return Promise.reject(error);
  }
);

// ========================================
// INTERCEPTEUR RÉPONSE
// ========================================
apiClient.interceptors.response.use(
  (response) => {
    // Logs de succès
    console.log('✅ Réponse API:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    
    return response;
  },
  (error) => {
    // Logs détaillés des erreurs
    console.error('❌ Erreur API:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      fullUrl: error.config?.baseURL + error.config?.url,
      message: error.message,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // Gestion erreur 401 (Non autorisé)
    if (error.response?.status === 401) {
      console.warn('🚨 Utilisateur non autorisé - Déconnexion');
      
      // Sauvegarder l'URL actuelle pour redirection après login
      const currentPath = window.location.pathname;
      
      // Nettoyer le stockage local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Rediriger vers login (sauf si déjà sur la page login)
      if (currentPath !== '/login' && !currentPath.startsWith('/auth')) {
        localStorage.setItem('redirectAfterLogin', currentPath);
        window.location.href = '/login';
      }
    }
    
    // Gestion erreur 403 (Interdit)
    if (error.response?.status === 403) {
      console.error('🚫 Accès refusé - Permissions insuffisantes');
    }
    
    // Gestion erreur 404 (Non trouvé)
    if (error.response?.status === 404) {
      console.error('🔍 Ressource non trouvée');
    }
    
    // Gestion erreur 422 (Validation échouée)
    if (error.response?.status === 422) {
      console.error('📝 Erreurs de validation:', error.response.data.errors);
    }
    
    // Gestion erreur 500 (Erreur serveur)
    if (error.response?.status === 500) {
      console.error('💥 Erreur serveur interne');
    }
    
    // Gestion erreur réseau
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout - Le serveur met trop de temps à répondre');
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Erreur réseau - Impossible de contacter le serveur');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

// ========================================
// SERVICES D'AUTHENTIFICATION
// ========================================
export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  verifyEmail: (data) => apiClient.post('/auth/verify-email', data),
  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  getSecurityQuestions: (email) => apiClient.post('/auth/security-questions', { email }),
  verifySecurityAnswers: (data) => apiClient.post('/auth/verify-security-answers', data),
  getAllSecurityQuestions: () => apiClient.get('/auth/security-questions/all'),
};

// ========================================
// SERVICES ADMIN
// ========================================
export const adminService = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getUser: (id) => apiClient.get(`/admin/users/${id}`),
  toggleUserStatus: (id) => apiClient.patch(`/admin/users/${id}/toggle-status`),
  assignRole: (id, roleId) => apiClient.patch(`/admin/users/${id}/assign-role`, { role_id: roleId }),
  resetUserPassword: (id, password, password_confirmation) =>
    apiClient.post(`/admin/users/${id}/reset-password`, { password, password_confirmation }),
  unlockUser: (id) => apiClient.patch(`/admin/users/${id}/unlock`),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),
};

// ========================================
// SERVICES RÔLES
// ========================================
export const roleService = {
  getAll: (params) => apiClient.get('/admin/roles', { params }),
  getOne: (id) => apiClient.get(`/admin/roles/${id}`),
  create: (data) => apiClient.post('/admin/roles', data),
  update: (id, data) => apiClient.put(`/admin/roles/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/roles/${id}`),
  toggleStatus: (id) => apiClient.patch(`/admin/roles/${id}/toggle-status`),
  getPermissions: () => apiClient.get('/admin/roles/permissions'),
  getActive: () => apiClient.get('/roles/active'),
};

// ========================================
// SERVICES DICTIONNAIRES
// ========================================
export const dictionaryService = {
  getAll: (dictionary, params) => apiClient.get(`/dictionaries/${dictionary}`, { params }),
  getOne: (dictionary, id) => apiClient.get(`/dictionaries/${dictionary}/${id}`),
  create: (dictionary, data) => apiClient.post(`/admin/dictionaries/${dictionary}`, data),
  update: (dictionary, id, data) => apiClient.put(`/admin/dictionaries/${dictionary}/${id}`, data),
  delete: (dictionary, id) => apiClient.delete(`/admin/dictionaries/${dictionary}/${id}`),
  toggleStatus: (dictionary, id) => apiClient.patch(`/admin/dictionaries/${dictionary}/${id}/toggle-status`),
};

// ========================================
// SERVICES CAMPAGNES
// ========================================
export const campagneService = {
  getAll: (params) => apiClient.get('/uas/campagnes', { params }),
  getOne: (id) => apiClient.get(`/uas/campagnes/${id}`),
  create: (data) => apiClient.post('/uas/campagnes', data),
  update: (id, data) => apiClient.put(`/uas/campagnes/${id}`, data),
  delete: (id) => apiClient.delete(`/uas/campagnes/${id}`),
  getStatistiques: (id) => apiClient.get(`/uas/campagnes/${id}/statistiques`),
};

// ========================================
// SERVICES BÉNÉFICIAIRES
// ========================================
export const beneficiaireService = {
  getAll: (params) => apiClient.get('/uas/beneficiaires', { params }),
  getOne: (id) => apiClient.get(`/uas/beneficiaires/${id}`),
  create: (data) => apiClient.post('/uas/beneficiaires', data),
  update: (id, data) => apiClient.put(`/uas/beneficiaires/${id}`, data),
  delete: (id) => apiClient.delete(`/uas/beneficiaires/${id}`),
  import: (formData) => apiClient.post('/uas/beneficiaires/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getParticipantsByCampagne: (campagneId, params) => 
    apiClient.get(`/uas/beneficiaires/campagne/${campagneId}/participants`, { params }),
  convertirEnParticipant: (id, campagneId) => 
    apiClient.post(`/uas/beneficiaires/${id}/convertir-en-participant`, { campagne_id: campagneId }),
  exportParticipantsAcceptes: (campagneId) => 
    apiClient.get(`/uas/beneficiaires/campagne/${campagneId}/participants/export`, {
      responseType: 'blob'
    }),
  updateParticipant: (id, data) => 
    apiClient.put(`/uas/beneficiaires/${id}/update-participant`, data),
  getListePrincipale: (campagneId, params) => 
    apiClient.get(`/uas/beneficiaires/campagnes/${campagneId}/liste-principale`, { params }),
  getListeAttente: (campagneId, params) => 
    apiClient.get(`/uas/beneficiaires/campagnes/${campagneId}/liste-attente`, { params }),
  getListeRefusee: (campagneId, params) => 
    apiClient.get(`/uas/beneficiaires/campagnes/${campagneId}/liste-refusee`, { params }),
  getStatistiquesListes: (campagneId) => 
    apiClient.get(`/uas/beneficiaires/campagnes/${campagneId}/statistiques-listes`),
};

// ========================================
// SERVICES KAFALA
// ========================================
export const kafalaService = {
  getAll: (params) => apiClient.get('/uas/kafalas', { params }),
  getOne: (id) => apiClient.get(`/uas/kafalas/${id}`),
  create: (formData) => apiClient.post('/uas/kafalas', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => {
    if (formData instanceof FormData) {
      formData.append('_method', 'PUT');
    }
    return apiClient.post(`/uas/kafalas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => apiClient.delete(`/uas/kafalas/${id}`),
  uploadDocument: (id, formData) => apiClient.post(`/uas/kafalas/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDocument: (kafalaId, documentId) => apiClient.delete(`/uas/kafalas/${kafalaId}/documents/${documentId}`),
  viewDocument: (kafalaId, documentId) => apiClient.get(`/uas/kafalas/${kafalaId}/documents/${documentId}/view`, {
    responseType: 'blob'
  }),
  downloadDocument: (kafalaId, documentId) => apiClient.get(`/uas/kafalas/${kafalaId}/documents/${documentId}/download`, {
    responseType: 'blob'
  }),
};

// ========================================
// SERVICES ASSISTANCES MÉDICALES
// ========================================
export const assistanceMedicaleService = {
  getAll: (params) => apiClient.get('/uas/assistances-medicales', { params }),
  getOne: (id) => apiClient.get(`/uas/assistances-medicales/${id}`),
  create: (data) => apiClient.post('/uas/assistances-medicales', data),
  update: (id, data) => apiClient.put(`/uas/assistances-medicales/${id}`, data),
  delete: (id) => apiClient.delete(`/uas/assistances-medicales/${id}`),
  retourMateriel: (id, data) => apiClient.post(`/uas/assistances-medicales/${id}/retour-materiel`, data),
};

// ========================================
// SERVICES STATISTIQUES
// ========================================
export const statistiquesService = {
  getCampagnesList: () => apiClient.get('/uas/statistiques/campagnes'),
  getStatistiquesCampagne: (campagneId) => 
    apiClient.get(`/uas/statistiques/campagnes/${campagneId}`),
  exporterStatistiques: (campagneId) => 
    apiClient.get(`/uas/statistiques/campagnes/${campagneId}/export`, {
      responseType: 'blob'
    }),
  getStatistiquesEvolution: (params) => 
    apiClient.get('/uas/statistiques/evolution', { params }),
};

// ========================================
// SERVICES RÉCEPTION
// ========================================
export const receptionService = {
  getCampagnes: (params) => apiClient.get('/reception/campagnes', { params }),
  getCampagne: (id) => apiClient.get(`/reception/campagnes/${id}`),
  getParticipants: (campagneId, params) => 
    apiClient.get(`/reception/participants/campagne/${campagneId}`, { params }),
  createParticipant: (data) => apiClient.post('/reception/participants', data),
  updateParticipant: (id, data) => 
    apiClient.put(`/reception/participants/${id}`, data),
  deleteParticipant: (id) => 
    apiClient.delete(`/reception/participants/${id}`),
  importParticipants: (campagneId, file) => {
    const formData = new FormData();
    formData.append('campagne_id', campagneId);
    formData.append('fichier', file);
    return apiClient.post('/reception/participants/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  genererCanva: (campagneId) => 
    apiClient.get(`/reception/participants/canva/${campagneId}`, {
      responseType: 'blob'
    }),
  genererConvocation: (participantId) => 
    apiClient.get(`/reception/participants/${participantId}/convocation`, {
      responseType: 'blob'
    }),
  getStatistiques: (campagneId) => 
    apiClient.get(`/reception/participants/statistiques/${campagneId}`),
  debugCanva: (campagneId) =>
    apiClient.get(`/reception/participants/canva-debug/${campagneId}`),
};

// ========================================
// SERVICE UAS (RÉTROCOMPATIBILITÉ)
// ========================================
export const uasService = {
  getCampagnes: (params) => campagneService.getAll(params),
  getCampagne: (id) => campagneService.getOne(id),
  createCampagne: (data) => campagneService.create(data),
  updateCampagne: (id, data) => campagneService.update(id, data),
  deleteCampagne: (id) => campagneService.delete(id),
  getStatistiquesCampagne: (id) => campagneService.getStatistiques(id),
  getBeneficiaires: (params) => beneficiaireService.getAll(params),
  getBeneficiaire: (id) => beneficiaireService.getOne(id),
  createBeneficiaire: (data) => beneficiaireService.create(data),
  updateBeneficiaire: (id, data) => beneficiaireService.update(id, data),
  deleteBeneficiaire: (id) => beneficiaireService.delete(id),
  importBeneficiaires: (formData) => beneficiaireService.import(formData),
  getKafalas: (params) => kafalaService.getAll(params),
  getKafala: (id) => kafalaService.getOne(id),
  createKafala: (formData) => kafalaService.create(formData),
  updateKafala: (id, data) => kafalaService.update(id, data),
  deleteKafala: (id) => kafalaService.delete(id),
  getAssistancesMedicales: (params) => assistanceMedicaleService.getAll(params),
  getAssistanceMedicale: (id) => assistanceMedicaleService.getOne(id),
  createAssistanceMedicale: (data) => assistanceMedicaleService.create(data),
  updateAssistanceMedicale: (id, data) => assistanceMedicaleService.update(id, data),
  deleteAssistanceMedicale: (id) => assistanceMedicaleService.delete(id),
  retourMateriel: (id, data) => assistanceMedicaleService.retourMateriel(id, data),
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Télécharger un fichier blob
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Formater les erreurs de validation
 */
export const formatValidationErrors = (errors) => {
  if (typeof errors === 'object') {
    return Object.values(errors).flat().join(', ');
  }
  return errors;
};

/**
 * Vérifier si l'utilisateur est connecté
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Obtenir le token actuel
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Obtenir l'utilisateur actuel
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erreur parsing utilisateur:', error);
    return null;
  }
};
