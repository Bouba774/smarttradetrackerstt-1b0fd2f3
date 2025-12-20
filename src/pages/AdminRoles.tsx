import React, { useState, useMemo, useCallback } from 'react';
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
import { ShieldCheck, UserPlus, Trash2, Crown, Shield, User, Loader2, AlertTriangle, Mail, CheckCircle, Search, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface AuthUserInfo {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserRoleWithEmail extends UserRole {
  email?: string | null;
}

const AdminRoles: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin, isLoading: isCheckingAdmin } = useAdminRole();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('moderator');
  const [isAdding, setIsAdding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<AuthUserInfo | null>(null);

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

  // Fetch auth user info for all users with roles
  const { data: authUsers = [] } = useQuery({
    queryKey: ['auth-users-info'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-users-info`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) return [];
      
      const result = await response.json();
      return result.users as AuthUserInfo[];
    },
    enabled: isAdmin,
  });

  // Create a map for auth user info lookup
  const authUserMap = useMemo(() => {
    const map = new Map<string, AuthUserInfo>();
    authUsers.forEach(user => {
      map.set(user.id, user);
    });
    return map;
  }, [authUsers]);

  // Roles with email info
  const userRolesWithEmail: UserRoleWithEmail[] = useMemo(() => {
    return userRoles.map(role => ({
      ...role,
      email: authUserMap.get(role.user_id)?.email || null,
    }));
  }, [userRoles, authUserMap]);

  // Search user by email
  const searchUserByEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error(language === 'fr' ? 'Veuillez entrer une adresse email valide' : 'Please enter a valid email address');
      return;
    }

    setIsSearching(true);
    setFoundUser(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error(language === 'fr' ? 'Session expirée' : 'Session expired');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-by-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: newEmail.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.found) {
        toast.error(language === 'fr' ? 'Utilisateur non trouvé' : 'User not found');
        return;
      }

      setFoundUser(result.user);
      toast.success(language === 'fr' ? 'Utilisateur trouvé!' : 'User found!');
    } catch (error) {
      console.error('Search error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la recherche' : 'Search error');
    } finally {
      setIsSearching(false);
    }
  };

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

  // Handle adding a role
  const handleAddRole = async () => {
    if (!foundUser) {
      toast.error(language === 'fr' ? 'Veuillez d\'abord rechercher un utilisateur' : 'Please search for a user first');
      return;
    }

    setIsAdding(true);
    try {
      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', foundUser.id)
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
          user_id: foundUser.id,
          role: newRole,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      setNewEmail('');
      setFoundUser(null);
      toast.success(language === 'fr' ? 'Rôle ajouté avec succès' : 'Role added successfully');
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast.error(error.message || (language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding role'));
    } finally {
      setIsAdding(false);
    }
  };

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (!userRolesWithEmail.length) {
      toast.error(language === 'fr' ? 'Aucune donnée à exporter' : 'No data to export');
      return;
    }

    const headers = ['Email', 'User ID', 'Role', 'Created At'];
    const rows = userRolesWithEmail.map(r => [
      r.email || '-',
      r.user_id,
      r.role,
      format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roles_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(language === 'fr' ? 'Export CSV réussi' : 'CSV export successful');
  }, [userRolesWithEmail, language]);

  // Export to PDF
  const exportToPDF = useCallback(() => {
    if (!userRolesWithEmail.length) {
      toast.error(language === 'fr' ? 'Aucune donnée à exporter' : 'No data to export');
      return;
    }

    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(34, 34, 34);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(language === 'fr' ? 'Rapport des Rôles Utilisateurs' : 'User Roles Report', 14, 16);
      doc.setFontSize(10);
      doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - 14, 16, { align: 'right' });

      doc.setTextColor(0, 0, 0);
      let yPos = 35;
      
      doc.setFontSize(10);
      doc.text(`${language === 'fr' ? 'Total Rôles' : 'Total Roles'}: ${userRolesWithEmail.length}`, 14, yPos);
      yPos += 10;

      const tableData = userRolesWithEmail.map(r => [
        r.email || '-',
        r.user_id.slice(0, 8) + '...',
        r.role,
        format(new Date(r.created_at), 'dd/MM/yy HH:mm'),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [[
          'Email',
          'User ID',
          language === 'fr' ? 'Rôle' : 'Role',
          language === 'fr' ? 'Date' : 'Date',
        ]],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} / ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`roles_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(language === 'fr' ? 'Export PDF réussi' : 'PDF export successful');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'export PDF' : 'PDF export failed');
    }
  }, [userRolesWithEmail, language]);

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
            {language === 'fr' ? 'Ajouter un Rôle par Email' : 'Add a Role by Email'}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Email Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder={language === 'fr' ? 'Adresse email de l\'utilisateur' : 'User email address'}
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setFoundUser(null);
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={searchUserByEmail} disabled={isSearching || !newEmail.includes('@')} variant="secondary">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="ml-2">{language === 'fr' ? 'Rechercher' : 'Search'}</span>
            </Button>
          </div>

          {/* Found User Display */}
          {foundUser && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-profit" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{foundUser.email}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {foundUser.id.slice(0, 8)}... | 
                    {language === 'fr' ? ' Créé le ' : ' Created '} 
                    {format(new Date(foundUser.created_at), 'dd MMM yyyy', { locale: language === 'fr' ? fr : enUS })}
                  </p>
                </div>
              </div>

              {/* Role Selection & Add Button */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
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
                  <span className="ml-2">{language === 'fr' ? 'Ajouter le Rôle' : 'Add Role'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roles List */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Rôles Attribués' : 'Assigned Roles'}
            </h3>
            <Badge variant="secondary" className="ml-2">
              {userRolesWithEmail.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1">
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-1">
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>

        {isLoadingRoles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : userRolesWithEmail.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'fr' ? 'Aucun rôle attribué' : 'No roles assigned'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>{language === 'fr' ? 'ID Utilisateur' : 'User ID'}</TableHead>
                  <TableHead>{language === 'fr' ? 'Rôle' : 'Role'}</TableHead>
                  <TableHead>{language === 'fr' ? 'Date d\'ajout' : 'Added Date'}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRolesWithEmail.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="text-sm">
                      {userRole.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{userRole.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
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
