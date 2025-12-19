import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useAdminRole = () => {
  const { user } = useAuth();

  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return data as UserRole[];
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(role => role.role === 'admin') ?? false;
  const isModerator = userRoles?.some(role => role.role === 'moderator') ?? false;
  const hasRole = (role: AppRole) => userRoles?.some(r => r.role === role) ?? false;

  return {
    userRoles,
    isAdmin,
    isModerator,
    hasRole,
    isLoading,
    error,
  };
};

export default useAdminRole;
