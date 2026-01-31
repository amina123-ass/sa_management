import { useMemo } from 'react';
import { useAssistanceNotifications } from './useAssistanceNotifications';
import { useCampagneNotifications } from './useCampagneNotifications';
import { useNotificationViews } from './useNotificationViews';

export const useAllNotifications = () => {
  const assistanceNotifs = useAssistanceNotifications();
  const campagneNotifs = useCampagneNotifications();
  const {
    markAssistanceAsViewed,
    markCampagneAsViewed,
    markAllAsViewed: markAllAsViewedBase,
    resetViewed,
    isAssistanceViewed,
    isCampagneViewed,
  } = useNotificationViews();

  // Filtrer les notifications non vues
  const unviewedPretsEnRetard = useMemo(() => {
    return assistanceNotifs.pretsEnRetard.filter(
      pret => !isAssistanceViewed(pret.id)
    );
  }, [assistanceNotifs.pretsEnRetard, isAssistanceViewed]);

  const unviewedPretsProchesEcheance = useMemo(() => {
    return assistanceNotifs.pretsProchesEcheance.filter(
      pret => !isAssistanceViewed(pret.id)
    );
  }, [assistanceNotifs.pretsProchesEcheance, isAssistanceViewed]);

  const unviewedCampagnesTerminees = useMemo(() => {
    return campagneNotifs.campagnesTerminees.filter(
      campagne => !isCampagneViewed(campagne.id)
    );
  }, [campagneNotifs.campagnesTerminees, isCampagneViewed]);

  const unviewedCampagnesProcheFin = useMemo(() => {
    return campagneNotifs.campagnesProcheFin.filter(
      campagne => !isCampagneViewed(campagne.id)
    );
  }, [campagneNotifs.campagnesProcheFin, isCampagneViewed]);

  // Compter seulement les non vues
  const assistanceCount = useMemo(() => {
    return unviewedPretsEnRetard.length + unviewedPretsProchesEcheance.length;
  }, [unviewedPretsEnRetard, unviewedPretsProchesEcheance]);

  const campagneCount = useMemo(() => {
    return unviewedCampagnesTerminees.length + unviewedCampagnesProcheFin.length;
  }, [unviewedCampagnesTerminees, unviewedCampagnesProcheFin]);

  const totalCount = useMemo(() => {
    return assistanceCount + campagneCount;
  }, [assistanceCount, campagneCount]);

  const loading = useMemo(() => {
    return assistanceNotifs.loading || campagneNotifs.loading;
  }, [assistanceNotifs.loading, campagneNotifs.loading]);

  const refresh = () => {
    assistanceNotifs.refresh();
    campagneNotifs.refresh();
  };

  // Tout marquer comme vu - wrapper pour collecter tous les IDs
  const markAllAsViewed = () => {
    const allAssistanceIds = [
      ...assistanceNotifs.pretsEnRetard.map(p => p.id),
      ...assistanceNotifs.pretsProchesEcheance.map(p => p.id),
    ];
    const allCampagneIds = [
      ...campagneNotifs.campagnesTerminees.map(c => c.id),
      ...campagneNotifs.campagnesProcheFin.map(c => c.id),
    ];
    markAllAsViewedBase(allAssistanceIds, allCampagneIds);
  };

  return {
    // Assistances médicales (non vues)
    pretsEnRetard: unviewedPretsEnRetard,
    pretsProchesEcheance: unviewedPretsProchesEcheance,
    assistanceCount,
    
    // Campagnes (non vues)
    campagnesTerminees: unviewedCampagnesTerminees,
    campagnesProcheFin: unviewedCampagnesProcheFin,
    campagneCount,
    
    // Global
    totalCount,
    loading,
    refresh,
    
    // Gestion des vues
    markAssistanceAsViewed,
    markCampagneAsViewed,
    markAllAsViewed,
    resetViewed,
  };
};