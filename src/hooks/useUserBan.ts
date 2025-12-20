import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BannedUser {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  banned_at: string;
  expires_at: string | null;
  is_permanent: boolean;
}

export const useUserBan = (language: string = 'en') => {
  const queryClient = useQueryClient();

  // Fetch all banned users
  const { data: bannedUsers = [], isLoading: isLoadingBanned } = useQuery({
    queryKey: ['banned-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*')
        .order('banned_at', { ascending: false });
      
      if (error) throw error;
      return data as BannedUser[];
    },
  });

  // Check if a user is banned
  const isUserBanned = (userId: string): boolean => {
    return bannedUsers.some(bu => bu.user_id === userId);
  };

  // Get ban info for a user
  const getBanInfo = (userId: string): BannedUser | undefined => {
    return bannedUsers.find(bu => bu.user_id === userId);
  };

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      reason, 
      isPermanent = true,
      expiresAt 
    }: { 
      userId: string; 
      reason?: string; 
      isPermanent?: boolean;
      expiresAt?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expired');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-ban`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'ban',
            user_id: userId,
            reason,
            is_permanent: isPermanent,
            expires_at: expiresAt,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to ban user');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users'] });
      queryClient.invalidateQueries({ queryKey: ['auth-users-info'] });
      toast.success(language === 'fr' ? 'Utilisateur banni' : 'User banned');
    },
    onError: (error: Error) => {
      toast.error(error.message || (language === 'fr' ? 'Erreur lors du bannissement' : 'Error banning user'));
    },
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expired');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-ban`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'unban',
            user_id: userId,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to unban user');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users'] });
      queryClient.invalidateQueries({ queryKey: ['auth-users-info'] });
      toast.success(language === 'fr' ? 'Utilisateur débanni' : 'User unbanned');
    },
    onError: (error: Error) => {
      toast.error(error.message || (language === 'fr' ? 'Erreur lors du débannissement' : 'Error unbanning user'));
    },
  });

  return {
    bannedUsers,
    isLoadingBanned,
    isUserBanned,
    getBanInfo,
    banUser: banUserMutation.mutate,
    unbanUser: unbanUserMutation.mutate,
    isBanning: banUserMutation.isPending,
    isUnbanning: unbanUserMutation.isPending,
  };
};

export default useUserBan;
