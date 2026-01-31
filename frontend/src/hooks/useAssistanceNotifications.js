import { useState, useEffect, useCallback } from 'react';
import { assistanceMedicaleService } from '../services/api';
import { isBefore, parseISO } from 'date-fns';

export const useAssistanceNotifications = () => {
  const [notifications, setNotifications] = useState({
    pretsEnRetard: [],
    pretsProchesEcheance: [],
    loading: true,
    count: 0,
  });

  const isAPret = (assistance) => {
    return assistance.nature_don?.libelle?.toLowerCase().includes('prêt') ||
           assistance.nature_don?.libelle?.toLowerCase().includes('pret');
  };

  const fetchNotifications = useCallback(async () => {
    try {
      // Récupérer toutes les assistances
      const response = await assistanceMedicaleService.getAll({
        per_page: 1000, // Récupérer toutes les assistances
      });

      const assistances = response.data.data.data || [];
      const today = new Date();
      const pretsEnRetard = [];
      const pretsProchesEcheance = [];

      assistances.forEach(assistance => {
        // Vérifier si c'est un prêt actif
        if (isAPret(assistance) && !assistance.est_retourne && assistance.date_retour_prevue) {
          const dateRetour = parseISO(assistance.date_retour_prevue);
          
          // Prêts en retard
          if (isBefore(dateRetour, today)) {
            pretsEnRetard.push({
              ...assistance,
              joursRetard: Math.floor((today - dateRetour) / (1000 * 60 * 60 * 24)),
            });
          }
          // Prêts proches de l'échéance (moins de 7 jours)
          else {
            const joursRestants = Math.floor((dateRetour - today) / (1000 * 60 * 60 * 24));
            if (joursRestants <= 7) {
              pretsProchesEcheance.push({
                ...assistance,
                joursRestants,
              });
            }
          }
        }
      });

      // Trier par urgence
      pretsEnRetard.sort((a, b) => b.joursRetard - a.joursRetard);
      pretsProchesEcheance.sort((a, b) => a.joursRestants - b.joursRestants);

      setNotifications({
        pretsEnRetard,
        pretsProchesEcheance,
        loading: false,
        count: pretsEnRetard.length + pretsProchesEcheance.length,
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
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