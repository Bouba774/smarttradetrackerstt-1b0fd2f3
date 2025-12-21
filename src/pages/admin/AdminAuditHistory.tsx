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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { format, subDays, parseISO, isWithinInterval, startOfDay, eachDayOfInterval, eachHourOfInterval, startOfHour, subHours } from 'date-fns';
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
  TrendingUp,
  BarChart3,
  Activity,
  Clock,
  Users,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

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

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--profit))',
  'hsl(var(--warning))',
  'hsl(var(--loss))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

const AdminAuditHistory: React.FC = () => {
  const { language } = useLanguage();
  const { isAdminVerified, allUsers } = useAdmin();
  const locale = language === 'fr' ? fr : enUS;

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch audit logs
  const { data: auditLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

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

  // Statistics calculations
  const statistics = useMemo(() => {
    const now = new Date();
    const daysAgo = parseInt(dateFilter);
    
    // Actions by type
    const actionCounts = new Map<string, number>();
    filteredLogs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    });
    const actionsByType = Array.from(actionCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Admin activity
    const adminCounts = new Map<string, number>();
    filteredLogs.forEach(log => {
      const adminInfo = userMap.get(log.admin_id);
      const adminName = adminInfo?.nickname || adminInfo?.email?.split('@')[0] || 'Unknown';
      adminCounts.set(adminName, (adminCounts.get(adminName) || 0) + 1);
    });
    const adminActivity = Array.from(adminCounts.entries())
      .map(([name, actions]) => ({ name, actions }))
      .sort((a, b) => b.actions - a.actions);

    // Daily trend
    const dailyTrend = [];
    if (daysAgo <= 7) {
      // Hourly for last 24h
      const hours = eachHourOfInterval({
        start: subHours(now, 24),
        end: now,
      });
      for (const hour of hours) {
        const hourStart = startOfHour(hour);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        const count = filteredLogs.filter(log => {
          const logDate = parseISO(log.created_at);
          return logDate >= hourStart && logDate < hourEnd;
        }).length;
        dailyTrend.push({
          date: format(hour, 'HH:mm'),
          count,
        });
      }
    } else {
      // Daily for longer periods
      const days = eachDayOfInterval({
        start: subDays(now, daysAgo),
        end: now,
      });
      for (const day of days) {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const count = filteredLogs.filter(log => {
          const logDate = parseISO(log.created_at);
          return logDate >= dayStart && logDate < dayEnd;
        }).length;
        dailyTrend.push({
          date: format(day, 'dd/MM'),
          count,
        });
      }
    }

    // Hourly distribution (heat map data)
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}h`,
      count: filteredLogs.filter(log => {
        const hour = parseISO(log.created_at).getHours();
        return hour === i;
      }).length,
    }));

    // Users accessed count
    const usersAccessed = new Set(
      filteredLogs.filter(l => l.target_user_id).map(l => l.target_user_id)
    ).size;

    // Average actions per day
    const avgPerDay = daysAgo > 0 ? Math.round(filteredLogs.length / daysAgo) : filteredLogs.length;

    // Most active hour
    const maxHour = hourlyDistribution.reduce((max, curr) => 
      curr.count > max.count ? curr : max, 
      { hour: '00h', count: 0 }
    );

    return {
      actionsByType,
      adminActivity,
      dailyTrend,
      hourlyDistribution,
      usersAccessed,
      avgPerDay,
      mostActiveHour: maxHour.hour,
      totalLogs: filteredLogs.length,
      uniqueAdmins: adminCounts.size,
    };
  }, [filteredLogs, dateFilter, userMap]);

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

      // Statistics summary
      doc.setFontSize(12);
      doc.text(language === 'fr' ? 'Résumé Statistique' : 'Statistical Summary', 14, 30);
      doc.setFontSize(10);
      doc.text(`${language === 'fr' ? 'Total logs' : 'Total logs'}: ${statistics.totalLogs}`, 14, 38);
      doc.text(`${language === 'fr' ? 'Admins actifs' : 'Active admins'}: ${statistics.uniqueAdmins}`, 80, 38);
      doc.text(`${language === 'fr' ? 'Utilisateurs accédés' : 'Users accessed'}: ${statistics.usersAccessed}`, 140, 38);
      doc.text(`${language === 'fr' ? 'Moy. par jour' : 'Avg per day'}: ${statistics.avgPerDay}`, 200, 38);

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
        startY: 45,
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <p className="text-2xl font-bold text-foreground">{statistics.totalLogs}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'fr' ? 'Total actions' : 'Total actions'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              <p className="text-2xl font-bold text-foreground">{statistics.uniqueAdmins}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'fr' ? 'Admins actifs' : 'Active admins'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-profit" />
              <p className="text-2xl font-bold text-foreground">{statistics.usersAccessed}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'fr' ? 'Utilisateurs' : 'Users accessed'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              <p className="text-2xl font-bold text-foreground">{statistics.avgPerDay}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'fr' ? 'Moy./jour' : 'Avg/day'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-chart-1" />
              <p className="text-2xl font-bold text-foreground">{statistics.mostActiveHour}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'fr' ? 'Heure pic' : 'Peak hour'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-chart-2" />
              <p className="text-2xl font-bold text-foreground">{uniqueActions.length}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'fr' ? 'Types actions' : 'Action types'}
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

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {language === 'fr' ? 'Vue d\'ensemble' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            {language === 'fr' ? 'Analytiques' : 'Analytics'}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            {language === 'fr' ? 'Journal' : 'Logs'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity Trend Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {language === 'fr' ? 'Tendance d\'activité' : 'Activity Trend'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statistics.dailyTrend}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorCount)"
                        name={language === 'fr' ? 'Actions' : 'Actions'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Distribution */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  {language === 'fr' ? 'Distribution horaire' : 'Hourly Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        interval={2}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--warning))" 
                        radius={[4, 4, 0, 0]}
                        name={language === 'fr' ? 'Actions' : 'Actions'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Activity Table */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-destructive" />
                {language === 'fr' ? 'Activité par administrateur' : 'Activity by Admin'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statistics.adminActivity.map((admin, index) => (
                  <div
                    key={admin.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      >
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'fr' ? 'Administrateur' : 'Administrator'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {admin.actions}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Actions by Type Pie Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  {language === 'fr' ? 'Répartition des actions' : 'Actions Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={statistics.actionsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name.split('_').slice(-1)} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {statistics.actionsByType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Actions by Type Bar Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-profit" />
                  {language === 'fr' ? 'Top actions' : 'Top Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.actionsByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        width={100}
                        tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--profit))" 
                        radius={[0, 4, 4, 0]}
                        name={language === 'fr' ? 'Nombre' : 'Count'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Actions de lecture' : 'View Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {filteredLogs.filter(l => l.action.includes('view_')).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {((filteredLogs.filter(l => l.action.includes('view_')).length / Math.max(filteredLogs.length, 1)) * 100).toFixed(1)}% {language === 'fr' ? 'du total' : 'of total'}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Connexions admin' : 'Admin Logins'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {filteredLogs.filter(l => l.action.includes('login')).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'fr' ? 'Sessions démarrées' : 'Sessions started'}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'IPs uniques' : 'Unique IPs'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(filteredLogs.map(l => l.ip_address).filter(Boolean)).size}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'fr' ? 'Adresses distinctes' : 'Distinct addresses'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAuditHistory;
