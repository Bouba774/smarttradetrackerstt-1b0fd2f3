import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook pour invalider toutes les queries admin quand l'utilisateur sélectionné change.
 * Cela force un refetch des données fraîches depuis le serveur.
 */
export const useAdminQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateAllAdminQueries = useCallback((userId?: string) => {
    // Invalider toutes les queries admin pour forcer un refetch
    const adminQueryKeys = [
      'admin-trades-secure',
      'admin-profile-secure',
      'admin-journal-secure',
      'admin-challenges-secure',
      'admin-settings-secure',
      'admin-sessions-secure',
    ];

    adminQueryKeys.forEach((key) => {
      if (userId) {
        // Invalider uniquement les queries pour cet utilisateur
        queryClient.invalidateQueries({ queryKey: [key, userId] });
      } else {
        // Invalider toutes les queries de ce type
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    });
  }, [queryClient]);

  const invalidateAndRefetch = useCallback((userId: string) => {
    // Invalider et refetch immédiatement
    const adminQueryKeys = [
      'admin-trades-secure',
      'admin-profile-secure',
      'admin-journal-secure',
      'admin-challenges-secure',
      'admin-settings-secure',
      'admin-sessions-secure',
    ];

    adminQueryKeys.forEach((key) => {
      queryClient.invalidateQueries({ 
        queryKey: [key, userId],
        refetchType: 'active'
      });
    });
  }, [queryClient]);

  const removeAllAdminQueries = useCallback(() => {
    // Supprimer complètement les données du cache
    const adminQueryKeys = [
      'admin-trades-secure',
      'admin-profile-secure',
      'admin-journal-secure',
      'admin-challenges-secure',
      'admin-settings-secure',
      'admin-sessions-secure',
    ];

    adminQueryKeys.forEach((key) => {
      queryClient.removeQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  return {
    invalidateAllAdminQueries,
    invalidateAndRefetch,
    removeAllAdminQueries,
  };
};
