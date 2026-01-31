import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'uas_viewed_notifications';

export const useNotificationViews = () => {
  const [viewedNotifications, setViewedNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        assistances: [],
        campagnes: [],
        timestamp: Date.now(),
      };
    } catch {
      return {
        assistances: [],
        campagnes: [],
        timestamp: Date.now(),
      };
    }
  });

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(viewedNotifications));
  }, [viewedNotifications]);

  // Marquer une assistance comme vue
  const markAssistanceAsViewed = useCallback((assistanceId) => {
    setViewedNotifications(prev => ({
      ...prev,
      assistances: [...prev.assistances, assistanceId],
      timestamp: Date.now(),
    }));
  }, []);

  // Marquer une campagne comme vue
  const markCampagneAsViewed = useCallback((campagneId) => {
    setViewedNotifications(prev => ({
      ...prev,
      campagnes: [...prev.campagnes, campagneId],
      timestamp: Date.now(),
    }));
  }, []);

  // Marquer toutes les assistances actuelles comme vues
  const markAllAssistancesAsViewed = useCallback((assistanceIds) => {
    setViewedNotifications(prev => ({
      ...prev,
      assistances: [...new Set([...prev.assistances, ...assistanceIds])],
      timestamp: Date.now(),
    }));
  }, []);

  // Marquer toutes les campagnes actuelles comme vues
  const markAllCampagnesAsViewed = useCallback((campagneIds) => {
    setViewedNotifications(prev => ({
      ...prev,
      campagnes: [...new Set([...prev.campagnes, ...campagneIds])],
      timestamp: Date.now(),
    }));
  }, []);

  // Tout marquer comme vu
  const markAllAsViewed = useCallback((assistanceIds, campagneIds) => {
    setViewedNotifications({
      assistances: [...new Set(assistanceIds)],
      campagnes: [...new Set(campagneIds)],
      timestamp: Date.now(),
    });
  }, []);

  // Réinitialiser (tout afficher à nouveau)
  const resetViewed = useCallback(() => {
    setViewedNotifications({
      assistances: [],
      campagnes: [],
      timestamp: Date.now(),
    });
  }, []);

  // Vérifier si une assistance est vue
  const isAssistanceViewed = useCallback((assistanceId) => {
    return viewedNotifications.assistances.includes(assistanceId);
  }, [viewedNotifications.assistances]);

  // Vérifier si une campagne est vue
  const isCampagneViewed = useCallback((campagneId) => {
    return viewedNotifications.campagnes.includes(campagneId);
  }, [viewedNotifications.campagnes]);

  return {
    markAssistanceAsViewed,
    markCampagneAsViewed,
    markAllAssistancesAsViewed,
    markAllCampagnesAsViewed,
    markAllAsViewed,
    resetViewed,
    isAssistanceViewed,
    isCampagneViewed,
    viewedNotifications,
  };
};