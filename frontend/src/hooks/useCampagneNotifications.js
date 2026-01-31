import { useState, useEffect, useCallback } from 'react';
import { campagneService } from '../services/api';
import { isBefore, isAfter, parseISO, differenceInDays } from 'date-fns';

export const useCampagneNotifications = () => {
  const [notifications, setNotifications] = useState({
    campagnesTerminees: [],
    campagnesProcheFin: [],
    loading: true,
    count: 0,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      // Récupérer toutes les campagnes
      const response = await campagneService.getAll({
        per_page: 1000,
      });

      const campagnes = response.data.data.data || [];
      const today = new Date();
      const campagnesTerminees = [];
      const campagnesProcheFin = [];

      campagnes.forEach(campagne => {
        const dateFin = parseISO(campagne.date_fin);
        const dateDebut = parseISO(campagne.date_debut);
        
        // Campagnes qui viennent de se terminer (dans les 3 derniers jours)
        if (isBefore(dateFin, today)) {
          const joursDepuisFin = Math.floor((today - dateFin) / (1000 * 60 * 60 * 24));
          if (joursDepuisFin <= 3) {
            campagnesTerminees.push({
              ...campagne,
              joursDepuisFin,
            });
          }
        }
        // Campagnes en cours qui se terminent bientôt (dans les 7 prochains jours)
        else if (isAfter(dateFin, today) && isBefore(today, dateFin)) {
          const joursRestants = Math.floor((dateFin - today) / (1000 * 60 * 60 * 24));
          if (joursRestants <= 7 && isAfter(today, dateDebut)) {
            campagnesProcheFin.push({
              ...campagne,
              joursRestants,
            });
          }
        }
      });

      // Trier par urgence
      campagnesTerminees.sort((a, b) => a.joursDepuisFin - b.joursDepuisFin);
      campagnesProcheFin.sort((a, b) => a.joursRestants - b.joursRestants);

      setNotifications({
        campagnesTerminees,
        campagnesProcheFin,
        loading: false,
        count: campagnesTerminees.length + campagnesProcheFin.length,
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications de campagnes:', error);
      setNotifications(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    ...notifications,
    refresh: fetchNotifications,
  };
};