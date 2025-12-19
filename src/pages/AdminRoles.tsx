import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ShieldCheck, UserPlus, Trash2, Crown, Shield, User, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface UserWithRole extends UserRole {
  email?: string;
}

const AdminRoles: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin, isLoading: isCheckingAdmin } = useAdminRole();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('moderator');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch all user roles
  const { data: userRoles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: isAdmin,
  });

  // Add new role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      // First, find the user by email using auth admin API is not available
      // We'll need to look up the user differently - by checking profiles or asking for user_id
      // For now, let's use a workaround by checking if we can find the user
      
      // Since we can't directly query auth.users, we'll ask for the user_id to be entered
      // Or we can create an edge function to handle this
      
      // For this implementation, let's check if the email exists in profiles via a join or similar
      // Actually, profiles don't have email. We need another approach.
      
      // Let's create a simple approach: admin enters user_id directly
      // But for better UX, let's try to use an RPC function
      
      throw new Error('Need to implement user lookup by email');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      setNewEmail('');
      toast.success(language === 'fr' ? 'Rôle ajouté avec succès' : 'Role added successfully');
    },
    onError: (error) => {
      toast.error(language === 'fr' ? 'Erreur lors de l\'ajout du rôle' : 'Error adding role');
      console.error(error);
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      toast.success(language === 'fr' ? 'Rôle supprimé' : 'Role deleted');
    },
    onError: () => {
      toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting role');
    },
  });

  // Handle adding a role by user_id
  const handleAddRole = async () => {
    if (!newEmail.trim()) {
      toast.error(language === 'fr' ? 'Veuillez entrer un ID utilisateur' : 'Please enter a user ID');
      return;
    }

    setIsAdding(true);
    try {
      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', newEmail.trim())
        .eq('role', newRole)
        .single();

      if (existingRole) {
        toast.error(language === 'fr' ? 'Cet utilisateur a déjà ce rôle' : 'This user already has this role');
        setIsAdding(false);
        return;
      }

      // Add the role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: newEmail.trim(),
          role: newRole,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      setNewEmail('');
      toast.success(language === 'fr' ? 'Rôle ajouté avec succès' : 'Role added successfully');
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast.error(error.message || (language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding role'));
    } finally {
      setIsAdding(false);
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'moderator':
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-16 h-16 text-loss" />
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'fr' ? 'Accès Refusé' : 'Access Denied'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'fr' 
            ? 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'
            : 'You don\'t have the necessary permissions to access this page.'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {language === 'fr' ? 'Gestion des Rôles' : 'Role Management'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' 
              ? 'Gérer les rôles et permissions des utilisateurs'
              : 'Manage user roles and permissions'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <ShieldCheck className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Add New Role Card */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Ajouter un Rôle' : 'Add a Role'}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder={language === 'fr' ? 'ID Utilisateur (UUID)' : 'User ID (UUID)'}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={newRole} onValueChange={(value: AppRole) => setNewRole(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  Admin
                </div>
              </SelectItem>
              <SelectItem value="moderator">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Moderator
                </div>
              </SelectItem>
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  User
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddRole} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span className="ml-2">{language === 'fr' ? 'Ajouter' : 'Add'}</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {language === 'fr' 
            ? 'Vous pouvez trouver l\'ID utilisateur dans la page Sessions Admin'
            : 'You can find the user ID in the Admin Sessions page'}
        </p>
      </div>

      {/* Roles List */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Rôles Attribués' : 'Assigned Roles'}
          </h3>
          <Badge variant="secondary" className="ml-2">
            {userRoles.length}
          </Badge>
        </div>

        {isLoadingRoles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : userRoles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'fr' ? 'Aucun rôle attribué' : 'No roles assigned'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'fr' ? 'ID Utilisateur' : 'User ID'}</TableHead>
                  <TableHead>{language === 'fr' ? 'Rôle' : 'Role'}</TableHead>
                  <TableHead>{language === 'fr' ? 'Date d\'ajout' : 'Added Date'}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-mono text-xs">
                      {userRole.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(userRole.role)} className="flex items-center gap-1 w-fit">
                        {getRoleIcon(userRole.role)}
                        {userRole.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(userRole.created_at), 'dd MMM yyyy HH:mm', {
                        locale: language === 'fr' ? fr : enUS,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-loss hover:text-loss hover:bg-loss/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {language === 'fr' ? 'Confirmer la suppression' : 'Confirm Deletion'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'fr'
                                ? 'Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.'
                                : 'Are you sure you want to delete this role? This action cannot be undone.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {language === 'fr' ? 'Annuler' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRoleMutation.mutate(userRole.id)}
                              className="bg-loss hover:bg-loss/90"
                            >
                              {language === 'fr' ? 'Supprimer' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoles;
