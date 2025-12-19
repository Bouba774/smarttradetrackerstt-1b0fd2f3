import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Monitor, Smartphone, Tablet, Globe, Users, Clock, 
  MapPin, Wifi, Filter, RefreshCw, ChevronDown, ChevronRight, Download, FileText, User
} from 'lucide-react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface UserProfile {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  trading_style: string | null;
  level: number | null;
  total_points: number | null;
  bio: string | null;
}

interface UserSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end: string | null;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  device_type: string | null;
  device_vendor: string | null;
  device_model: string | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  ip_address: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  isp: string | null;
  is_mobile: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const SessionsAdmin: React.FC = () => {
  const { language } = useLanguage();
  const [dateFilter, setDateFilter] = useState('7');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { data: sessions, isLoading: isLoadingSessions, refetch } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('session_start', { ascending: false });
      
      if (error) throw error;
      return data as UserSession[];
    }
  });

  // Fetch all profiles to map user_id to nickname
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['user-profiles-for-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url, trading_style, level, total_points, bio');
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // Fetch all trades for statistics
  const { data: trades, isLoading: isLoadingTrades } = useQuery({
    queryKey: ['user-trades-for-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('user_id, result, profit_loss');
      
      if (error) throw error;
      return data as { user_id: string; result: string | null; profit_loss: number | null }[];
    }
  });

  // Create a map for quick profile lookup
  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    profiles?.forEach(profile => {
      map.set(profile.user_id, profile);
    });
    return map;
  }, [profiles]);

  // Create a map for user trading stats
  const tradingStatsMap = useMemo(() => {
    const map = new Map<string, { totalTrades: number; wins: number; winRate: number; totalProfit: number }>();
    if (!trades) return map;
    
    // Group trades by user_id
    const groupedTrades: Record<string, { user_id: string; result: string | null; profit_loss: number | null }[]> = {};
    trades.forEach(trade => {
      if (!groupedTrades[trade.user_id]) {
        groupedTrades[trade.user_id] = [];
      }
      groupedTrades[trade.user_id].push(trade);
    });

    // Calculate stats for each user
    Object.entries(groupedTrades).forEach(([userId, userTrades]) => {
      const totalTrades = userTrades.length;
      const wins = userTrades.filter(t => t.result === 'win').length;
      const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
      const totalProfit = userTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      
      map.set(userId, { totalTrades, wins, winRate, totalProfit });
    });

    return map;
  }, [trades]);

  const isLoading = isLoadingSessions || isLoadingProfiles || isLoadingTrades;

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    let filtered = [...sessions];
    
    // Date filter
    if (dateFilter !== 'all') {
      const daysAgo = subDays(new Date(), parseInt(dateFilter));
      filtered = filtered.filter(s => isAfter(parseISO(s.session_start), daysAgo));
    }
    
    // Device filter
    if (deviceFilter !== 'all') {
      filtered = filtered.filter(s => s.device_type === deviceFilter);
    }
    
    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(s => s.country === countryFilter);
    }
    
    return filtered;
  }, [sessions, dateFilter, deviceFilter, countryFilter]);

  // Group sessions by user
  const sessionsByUser = useMemo(() => {
    const grouped: Record<string, UserSession[]> = {};
    filteredSessions.forEach(session => {
      if (!grouped[session.user_id]) {
        grouped[session.user_id] = [];
      }
      grouped[session.user_id].push(session);
    });
    return grouped;
  }, [filteredSessions]);

  // Toggle user expansion
  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Statistics
  const stats = useMemo(() => {
    if (!filteredSessions.length) return null;
    
    const uniqueUsers = new Set(filteredSessions.map(s => s.user_id));
    const uniqueCountries = new Set(filteredSessions.map(s => s.country).filter(Boolean));
    const uniqueBrowsers = new Set(filteredSessions.map(s => s.browser_name).filter(Boolean));
    const mobileCount = filteredSessions.filter(s => s.is_mobile).length;
    
    return {
      totalSessions: filteredSessions.length,
      uniqueUsers: uniqueUsers.size,
      uniqueCountries: uniqueCountries.size,
      uniqueBrowsers: uniqueBrowsers.size,
      mobilePercentage: Math.round((mobileCount / filteredSessions.length) * 100),
    };
  }, [filteredSessions]);

  // Chart data - Countries
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      const country = s.country || 'Unknown';
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredSessions]);

  // Chart data - Browsers
  const browserData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      const browser = s.browser_name || 'Unknown';
      counts[browser] = (counts[browser] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSessions]);

  // Chart data - Devices
  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      const device = s.device_type || 'unknown';
      counts[device] = (counts[device] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredSessions]);

  // Chart data - OS
  const osData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      const os = s.os_name || 'Unknown';
      counts[os] = (counts[os] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSessions]);

  // Chart data - Device Vendor (Brand)
  const vendorData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      const vendor = s.device_vendor || 'Unknown';
      counts[vendor] = (counts[vendor] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredSessions]);

  // Available countries for filter
  const availableCountries = useMemo(() => {
    if (!sessions) return [];
    const countries = new Set(sessions.map(s => s.country).filter(Boolean));
    return Array.from(countries).sort();
  }, [sessions]);

  const getDeviceIcon = (type: string | null) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (!filteredSessions.length) {
      toast.error(language === 'fr' ? 'Aucune donnée à exporter' : 'No data to export');
      return;
    }

    const headers = [
      'Date', 'User ID', 'Browser', 'Browser Version', 'OS', 'OS Version',
      'Device Type', 'Device Vendor', 'Device Model', 'Screen', 'Language',
      'IP Address', 'Country', 'Region', 'City', 'Timezone', 'ISP', 'Is Mobile'
    ];

    const rows = filteredSessions.map(s => [
      format(parseISO(s.session_start), 'yyyy-MM-dd HH:mm:ss'),
      s.user_id,
      s.browser_name || '',
      s.browser_version || '',
      s.os_name || '',
      s.os_version || '',
      s.device_type || '',
      s.device_vendor || '',
      s.device_model || '',
      s.screen_width && s.screen_height ? `${s.screen_width}x${s.screen_height}` : '',
      s.language || '',
      s.ip_address || '',
      s.country || '',
      s.region || '',
      s.city || '',
      s.timezone || '',
      s.isp || '',
      s.is_mobile ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sessions_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(language === 'fr' ? 'Export CSV réussi' : 'CSV export successful');
  }, [filteredSessions, language]);

  // Export to PDF
  const exportToPDF = useCallback(() => {
    if (!filteredSessions.length) {
      toast.error(language === 'fr' ? 'Aucune donnée à exporter' : 'No data to export');
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(34, 34, 34);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(language === 'fr' ? 'Rapport Sessions Utilisateurs' : 'User Sessions Report', 14, 16);
      doc.setFontSize(10);
      doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - 14, 16, { align: 'right' });

      // Stats summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      let yPos = 35;

      if (stats) {
        doc.setFontSize(10);
        doc.text(`${language === 'fr' ? 'Total Sessions' : 'Total Sessions'}: ${stats.totalSessions}`, 14, yPos);
        doc.text(`${language === 'fr' ? 'Pays' : 'Countries'}: ${stats.uniqueCountries}`, 80, yPos);
        doc.text(`${language === 'fr' ? 'Navigateurs' : 'Browsers'}: ${stats.uniqueBrowsers}`, 140, yPos);
        doc.text(`${language === 'fr' ? 'Mobile' : 'Mobile'}: ${stats.mobilePercentage}%`, 200, yPos);
        yPos += 10;
      }

      // Table
      const tableData = filteredSessions.slice(0, 100).map(s => [
        format(parseISO(s.session_start), 'dd/MM/yy HH:mm'),
        s.browser_name || '-',
        s.os_name || '-',
        s.device_type || '-',
        s.country || '-',
        s.city || '-',
        s.isp || '-'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [[
          language === 'fr' ? 'Date' : 'Date',
          language === 'fr' ? 'Navigateur' : 'Browser',
          language === 'fr' ? 'OS' : 'OS',
          language === 'fr' ? 'Appareil' : 'Device',
          language === 'fr' ? 'Pays' : 'Country',
          language === 'fr' ? 'Ville' : 'City',
          language === 'fr' ? 'FAI' : 'ISP'
        ]],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 }
      });

      // Footer with page numbers
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

      doc.save(`sessions_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(language === 'fr' ? 'Export PDF réussi' : 'PDF export successful');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'export PDF' : 'PDF export failed');
    }
  }, [filteredSessions, stats, language]);

  const t = {
    title: language === 'fr' ? 'Sessions Utilisateurs' : 'User Sessions',
    totalSessions: language === 'fr' ? 'Total Sessions' : 'Total Sessions',
    uniqueUsers: language === 'fr' ? 'Utilisateurs' : 'Users',
    uniqueCountries: language === 'fr' ? 'Pays' : 'Countries',
    browsers: language === 'fr' ? 'Navigateurs' : 'Browsers',
    mobileUsage: language === 'fr' ? 'Usage Mobile' : 'Mobile Usage',
    byCountry: language === 'fr' ? 'Par Pays' : 'By Country',
    byBrowser: language === 'fr' ? 'Par Navigateur' : 'By Browser',
    byDevice: language === 'fr' ? 'Par Appareil' : 'By Device',
    byOS: language === 'fr' ? 'Par Système' : 'By OS',
    byVendor: language === 'fr' ? 'Par Marque' : 'By Brand',
    sessionsByUser: language === 'fr' ? 'Sessions par Utilisateur' : 'Sessions by User',
    recentSessions: language === 'fr' ? 'Sessions Récentes' : 'Recent Sessions',
    date: language === 'fr' ? 'Date' : 'Date',
    device: language === 'fr' ? 'Appareil' : 'Device',
    browser: language === 'fr' ? 'Navigateur' : 'Browser',
    location: language === 'fr' ? 'Localisation' : 'Location',
    isp: language === 'fr' ? 'FAI' : 'ISP',
    screen: language === 'fr' ? 'Écran' : 'Screen',
    ip: language === 'fr' ? 'Adresse IP' : 'IP Address',
    lang: language === 'fr' ? 'Langue' : 'Language',
    filters: language === 'fr' ? 'Filtres' : 'Filters',
    period: language === 'fr' ? 'Période' : 'Period',
    last7Days: language === 'fr' ? '7 derniers jours' : 'Last 7 days',
    last30Days: language === 'fr' ? '30 derniers jours' : 'Last 30 days',
    last90Days: language === 'fr' ? '90 derniers jours' : 'Last 90 days',
    allTime: language === 'fr' ? 'Tout' : 'All time',
    allDevices: language === 'fr' ? 'Tous les appareils' : 'All devices',
    allCountries: language === 'fr' ? 'Tous les pays' : 'All countries',
    refresh: language === 'fr' ? 'Actualiser' : 'Refresh',
    noData: language === 'fr' ? 'Aucune session trouvée' : 'No sessions found',
    exportCSV: language === 'fr' ? 'Export CSV' : 'Export CSV',
    exportPDF: language === 'fr' ? 'Export PDF' : 'Export PDF',
    sessions: language === 'fr' ? 'sessions' : 'sessions',
    lastActivity: language === 'fr' ? 'Dernière activité' : 'Last activity',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground text-sm">
            {filteredSessions.length} {language === 'fr' ? 'sessions' : 'sessions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {t.filters}
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t.refresh}
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            {t.exportCSV}
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            {t.exportPDF}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t.period}</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">{t.last7Days}</SelectItem>
                    <SelectItem value="30">{t.last30Days}</SelectItem>
                    <SelectItem value="90">{t.last90Days}</SelectItem>
                    <SelectItem value="all">{t.allTime}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t.device}</label>
                <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allDevices}</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t.location}</label>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCountries}</SelectItem>
                    {availableCountries.map(country => (
                      <SelectItem key={country} value={country!}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                  <p className="text-xs text-muted-foreground">{t.uniqueUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-1/10">
                  <Users className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">{t.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <Globe className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.uniqueCountries}</p>
                  <p className="text-xs text-muted-foreground">{t.uniqueCountries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-3/10">
                  <Monitor className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.uniqueBrowsers}</p>
                  <p className="text-xs text-muted-foreground">{t.browsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10">
                  <Smartphone className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.mobilePercentage}%</p>
                  <p className="text-xs text-muted-foreground">{t.mobileUsage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Countries Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t.byCountry}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Browser Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              {t.byBrowser}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={browserData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {browserData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {t.byDevice}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* OS Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              {t.byOS}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={osData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Vendor/Brand Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {t.byVendor}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions By User */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {t.sessionsByUser}
            <Badge variant="secondary" className="ml-2">{stats?.uniqueUsers || 0} {t.uniqueUsers}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {Object.keys(sessionsByUser).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">{t.noData}</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(sessionsByUser)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([userId, userSessions]) => {
                    const isExpanded = expandedUsers.has(userId);
                    const lastSession = userSessions[0];
                    const uniqueDevices = new Set(userSessions.map(s => s.device_type)).size;
                    const uniqueCountries = new Set(userSessions.map(s => s.country).filter(Boolean)).size;
                    const profile = profileMap.get(userId);
                    
                    return (
                      <Collapsible key={userId} open={isExpanded} onOpenChange={() => toggleUser(userId)}>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {profile?.avatar_url ? (
                                <img 
                                  src={profile.avatar_url} 
                                  alt={profile.nickname} 
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="p-2 rounded-full bg-primary/10">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {profile?.nickname || userId.slice(0, 8) + '...'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t.lastActivity}: {format(parseISO(lastSession.session_start), 'dd MMM yyyy HH:mm', { locale: language === 'fr' ? fr : undefined })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {profile?.trading_style && (
                                <Badge variant="secondary" className="text-xs">{profile.trading_style}</Badge>
                              )}
                              {profile?.level && (
                                <Badge className="text-xs bg-chart-4/20 text-chart-4 hover:bg-chart-4/30">
                                  Lv. {profile.level}
                                </Badge>
                              )}
                              <Badge variant="outline">{userSessions.length} {t.sessions}</Badge>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                {getDeviceIcon(lastSession.device_type)}
                                <span className="text-xs">{uniqueDevices}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                <span className="text-xs">{uniqueCountries}</span>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {/* Profile & Trading Stats Details */}
                          <div className="ml-8 mt-2 mb-2 space-y-2">
                            {/* Trading Stats */}
                            {(() => {
                              const tradingStats = tradingStatsMap.get(userId);
                              return tradingStats && tradingStats.totalTrades > 0 ? (
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                  <p className="text-xs font-medium text-primary mb-2">{language === 'fr' ? 'Performance Trading' : 'Trading Performance'}</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground text-xs">{language === 'fr' ? 'Total Trades' : 'Total Trades'}</p>
                                      <p className="font-bold text-lg">{tradingStats.totalTrades}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground text-xs">Win Rate</p>
                                      <p className={`font-bold text-lg ${tradingStats.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                                        {tradingStats.winRate}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground text-xs">{language === 'fr' ? 'Victoires' : 'Wins'}</p>
                                      <p className="font-bold text-lg text-green-500">{tradingStats.wins}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground text-xs">{language === 'fr' ? 'Profit Total' : 'Total Profit'}</p>
                                      <p className={`font-bold text-lg ${tradingStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {tradingStats.totalProfit >= 0 ? '+' : ''}{tradingStats.totalProfit.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                            })()}
                            
                            {/* Profile Info */}
                            {profile && (
                              <div className="p-3 rounded-lg bg-muted/50 border">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">{language === 'fr' ? 'Style de trading' : 'Trading Style'}</p>
                                    <p className="font-medium">{profile.trading_style || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">{language === 'fr' ? 'Niveau' : 'Level'}</p>
                                    <p className="font-medium">{profile.level || 1}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">{language === 'fr' ? 'Points totaux' : 'Total Points'}</p>
                                    <p className="font-medium">{profile.total_points?.toLocaleString() || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Bio</p>
                                    <p className="font-medium truncate">{profile.bio || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="ml-8 border-l-2 border-border pl-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t.date}</TableHead>
                                  <TableHead>{t.device}</TableHead>
                                  <TableHead>{t.browser}</TableHead>
                                  <TableHead>{t.location}</TableHead>
                                  <TableHead>{t.ip}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {userSessions.slice(0, 20).map((session) => (
                                  <TableRow key={session.id}>
                                    <TableCell>
                                      <span className="text-sm">
                                        {format(parseISO(session.session_start), 'dd/MM/yy HH:mm')}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {getDeviceIcon(session.device_type)}
                                        <span className="text-sm">{session.device_vendor || 'Unknown'}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">{session.browser_name || 'Unknown'}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">{session.city || session.country || '-'}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs font-mono text-muted-foreground">{session.ip_address || '-'}</span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionsAdmin;
