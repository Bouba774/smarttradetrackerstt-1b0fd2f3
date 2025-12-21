import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  FileSearch,
  Search,
  Calendar,
  User,
  Eye,
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AuditLog {
  id: string;
  admin_id: string;
  target_user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface AdminInfo {
  id: string;
  email: string | null;
  nickname?: string;
}

const AdminAuditHistory: React.FC = () => {
  const { language } = useLanguage();
  const { isAdminVerified, allUsers } = useAdmin();
  const locale = language === 'fr' ? fr : enUS;

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7');

  // Fetch audit logs
  const { data: auditLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      return data as AuditLog[];
    },
    enabled: isAdminVerified,
    staleTime: 30000,
  });

  // Create a map of user IDs to info
  const userMap = useMemo(() => {
    const map = new Map<string, AdminInfo>();
    allUsers.forEach(user => {
      map.set(user.id, { id: user.id, email: user.email, nickname: user.nickname });
    });
    return map;
  }, [allUsers]);

  // Get unique actions for filter
  const uniqueActions = useMemo(() => {
    const actions = new Set(auditLogs.map(log => log.action));
    return Array.from(actions).sort();
  }, [auditLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const daysAgo = subDays(now, parseInt(dateFilter));

    return auditLogs.filter(log => {
      // Date filter
      const logDate = parseISO(log.created_at);
      if (!isWithinInterval(logDate, { start: daysAgo, end: now })) {
        return false;
      }

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const adminInfo = userMap.get(log.admin_id);
        const targetInfo = log.target_user_id ? userMap.get(log.target_user_id) : null;
        
        return (
          log.action.toLowerCase().includes(query) ||
          log.id.toLowerCase().includes(query) ||
          (adminInfo?.email?.toLowerCase().includes(query)) ||
          (adminInfo?.nickname?.toLowerCase().includes(query)) ||
          (targetInfo?.email?.toLowerCase().includes(query)) ||
          (targetInfo?.nickname?.toLowerCase().includes(query)) ||
          (log.ip_address?.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [auditLogs, dateFilter, actionFilter, searchQuery, userMap]);

  // Get action badge color
  const getActionBadge = (action: string) => {
    if (action.includes('view_')) {
      return <Badge variant="secondary" className="text-xs">{action}</Badge>;
    }
    if (action.includes('login')) {
      return <Badge className="bg-primary/20 text-primary text-xs">{action}</Badge>;
    }
    if (action.includes('create') || action.includes('add')) {
      return <Badge className="bg-profit/20 text-profit text-xs">{action}</Badge>;
    }
    if (action.includes('delete') || action.includes('remove')) {
      return <Badge className="bg-loss/20 text-loss text-xs">{action}</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{action}</Badge>;
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!filteredLogs.length) {
      toast.error(language === 'fr' ? 'Aucune donnée à exporter' : 'No data to export');
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(34, 34, 34);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(language === 'fr' ? 'Historique d\'Audit Admin' : 'Admin Audit History', 14, 14);
      doc.setFontSize(10);
      doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - 14, 14, { align: 'right' });

      doc.setTextColor(0, 0, 0);

      const tableData = filteredLogs.slice(0, 100).map(log => {
        const adminInfo = userMap.get(log.admin_id);
        const targetInfo = log.target_user_id ? userMap.get(log.target_user_id) : null;
        
        return [
          format(parseISO(log.created_at), 'dd/MM/yy HH:mm'),
          adminInfo?.email || log.admin_id.slice(0, 8) + '...',
          log.action,
          targetInfo?.email || (log.target_user_id ? log.target_user_id.slice(0, 8) + '...' : '-'),
          log.ip_address || '-',
        ];
      });

      autoTable(doc, {
        startY: 28,
        head: [[
          'Date',
          'Admin',
          'Action',
          language === 'fr' ? 'Utilisateur cible' : 'Target User',
          'IP',
        ]],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 53, 69], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save(`audit_history_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(language === 'fr' ? 'Export PDF réussi' : 'PDF export successful');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'export' : 'Export error');
    }
  };

  if (!isAdminVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground/50" />
        <p className="text-muted-foreground text-lg">
          {language === 'fr' ? 'Vérification admin requise' : 'Admin verification required'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {language === 'fr' ? 'Historique d\'Audit' : 'Audit History'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' ? 'Suivi des accès et actions administrateur' : 'Track admin accesses and actions'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-destructive to-warning flex items-center justify-center shadow-neon">
          <FileSearch className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{auditLogs.length}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'fr' ? 'Total logs' : 'Total logs'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-primary">{filteredLogs.length}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'fr' ? 'Logs filtrés' : 'Filtered logs'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-profit">{uniqueActions.length}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'fr' ? 'Types d\'actions' : 'Action types'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">
              {new Set(auditLogs.map(l => l.admin_id)).size}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'fr' ? 'Admins actifs' : 'Active admins'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            {language === 'fr' ? 'Filtres' : 'Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'fr' ? 'Rechercher par email, action, IP...' : 'Search by email, action, IP...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{language === 'fr' ? '24 heures' : '24 hours'}</SelectItem>
                <SelectItem value="7">{language === 'fr' ? '7 jours' : '7 days'}</SelectItem>
                <SelectItem value="30">{language === 'fr' ? '30 jours' : '30 days'}</SelectItem>
                <SelectItem value="90">{language === 'fr' ? '90 jours' : '90 days'}</SelectItem>
                <SelectItem value="365">{language === 'fr' ? '1 an' : '1 year'}</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Eye className="w-4 h-4 mr-2" />
                <SelectValue placeholder={language === 'fr' ? 'Toutes actions' : 'All actions'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'fr' ? 'Toutes actions' : 'All actions'}</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={exportToPDF}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'fr' ? 'Journal des Accès' : 'Access Log'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileSearch className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {language === 'fr' ? 'Aucun log trouvé' : 'No logs found'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Date</TableHead>
                    <TableHead>{language === 'fr' ? 'Admin' : 'Admin'}</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>{language === 'fr' ? 'Utilisateur cible' : 'Target User'}</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>{language === 'fr' ? 'Détails' : 'Details'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const adminInfo = userMap.get(log.admin_id);
                    const targetInfo = log.target_user_id ? userMap.get(log.target_user_id) : null;

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(parseISO(log.created_at), 'dd/MM/yy HH:mm:ss', { locale })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-destructive" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {adminInfo?.nickname || adminInfo?.email?.split('@')[0] || 'Admin'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {adminInfo?.email || log.admin_id.slice(0, 8) + '...'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          {log.target_user_id ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {targetInfo?.nickname || targetInfo?.email?.split('@')[0] || 'User'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {targetInfo?.email || log.target_user_id.slice(0, 8) + '...'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {log.ip_address || '-'}
                        </TableCell>
                        <TableCell>
                          {log.details ? (
                            <Badge variant="outline" className="text-xs">
                              {typeof log.details === 'object' 
                                ? Object.keys(log.details).length + ' fields'
                                : String(log.details)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditHistory;
