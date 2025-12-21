import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX,
  Globe,
  Wifi,
  WifiOff,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConnectionLog {
  id: string;
  user_id: string;
  ip_address: string;
  country_code: string;
  isp: string;
  asn: string;
  organization: string;
  vpn_detected: boolean;
  proxy_detected: boolean;
  tor_detected: boolean;
  hosting_detected: boolean;
  connection_masked: boolean;
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  client_timezone: string;
  client_language: string;
  client_platform: string;
  timezone_mismatch: boolean;
  language_mismatch: boolean;
  user_role: string;
  action_taken: string;
  is_admin_access: boolean;
  created_at: string;
}

const getRiskIcon = (level: string) => {
  switch (level) {
    case 'low':
      return <ShieldCheck className="w-4 h-4 text-profit" />;
    case 'medium':
      return <Shield className="w-4 h-4 text-warning" />;
    case 'high':
      return <ShieldAlert className="w-4 h-4 text-orange-500" />;
    case 'critical':
      return <ShieldX className="w-4 h-4 text-loss" />;
    default:
      return <Shield className="w-4 h-4 text-muted-foreground" />;
  }
};

const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case 'low':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'high':
    case 'critical':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (action) {
    case 'ALLOWED':
      return 'default';
    case 'MONITORED':
    case 'ADMIN_WARNING':
      return 'secondary';
    case 'MFA_REQUIRED':
    case 'RESTRICTED':
      return 'outline';
    case 'ADMIN_BLOCKED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const ConnectionLogsViewer: React.FC = () => {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'masked' | 'high_risk' | 'admin'>('all');
  const dateLocale = language === 'fr' ? fr : enUS;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('connection_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      // Apply filters
      if (filter === 'masked') {
        query = query.eq('connection_masked', true);
      } else if (filter === 'high_risk') {
        query = query.in('risk_level', ['high', 'critical']);
      } else if (filter === 'admin') {
        query = query.eq('is_admin_access', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as ConnectionLog[]) || []);
    } catch (error) {
      console.error('Error fetching connection logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const stats = {
    total: logs.length,
    masked: logs.filter(l => l.connection_masked).length,
    highRisk: logs.filter(l => l.risk_level === 'high' || l.risk_level === 'critical').length,
    blocked: logs.filter(l => l.action_taken === 'ADMIN_BLOCKED').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr' ? 'Connexions' : 'Connections'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="w-8 h-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{stats.masked}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr' ? 'Masquées' : 'Masked'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.highRisk}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr' ? 'Haut risque' : 'High Risk'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-loss" />
              <div>
                <p className="text-2xl font-bold">{stats.blocked}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr' ? 'Bloquées' : 'Blocked'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Refresh */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {language === 'fr' ? 'Logs de Connexion' : 'Connection Logs'}
              </CardTitle>
              <CardDescription>
                {language === 'fr' 
                  ? 'Historique des connexions avec détection VPN/Proxy/Tor'
                  : 'Connection history with VPN/Proxy/Tor detection'}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'fr' ? 'Toutes' : 'All'}
                  </SelectItem>
                  <SelectItem value="masked">
                    {language === 'fr' ? 'Masquées' : 'Masked'}
                  </SelectItem>
                  <SelectItem value="high_risk">
                    {language === 'fr' ? 'Haut risque' : 'High Risk'}
                  </SelectItem>
                  <SelectItem value="admin">
                    {language === 'fr' ? 'Accès admin' : 'Admin Access'}
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchLogs}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div 
                  key={log.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    log.risk_level === 'critical' 
                      ? 'border-loss/50 bg-loss/5' 
                      : log.risk_level === 'high'
                      ? 'border-orange-500/50 bg-orange-500/5'
                      : log.connection_masked
                      ? 'border-warning/50 bg-warning/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getRiskIcon(log.risk_level)}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">
                            {log.ip_address || 'Unknown IP'}
                          </code>
                          {log.country_code && (
                            <Badge variant="outline" className="text-xs">
                              {log.country_code}
                            </Badge>
                          )}
                          {log.is_admin_access && (
                            <Badge variant="secondary" className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.isp || log.organization || 'Unknown ISP'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Detection badges */}
                      {log.vpn_detected && (
                        <Badge variant="destructive" className="text-xs">VPN</Badge>
                      )}
                      {log.proxy_detected && (
                        <Badge variant="destructive" className="text-xs">Proxy</Badge>
                      )}
                      {log.tor_detected && (
                        <Badge variant="destructive" className="text-xs">Tor</Badge>
                      )}
                      {log.hosting_detected && (
                        <Badge variant="secondary" className="text-xs">Datacenter</Badge>
                      )}
                      
                      {/* Risk and action badges */}
                      <Badge variant={getRiskBadgeVariant(log.risk_level)} className="text-xs">
                        {log.risk_score}/100
                      </Badge>
                      <Badge variant={getActionBadgeVariant(log.action_taken)} className="text-xs">
                        {log.action_taken}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Risk factors */}
                  {log.risk_factors && log.risk_factors.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {log.risk_factors.map((factor, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), 'PPp', { locale: dateLocale })}
                    </span>
                    {log.client_timezone && (
                      <span className={log.timezone_mismatch ? 'text-warning' : ''}>
                        TZ: {log.client_timezone}
                        {log.timezone_mismatch && (
                          <AlertTriangle className="w-3 h-3 inline ml-1" />
                        )}
                      </span>
                    )}
                    {log.client_platform && (
                      <span>{log.client_platform}</span>
                    )}
                  </div>
                </div>
              ))}
              
              {logs.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {language === 'fr' 
                      ? 'Aucun log de connexion trouvé'
                      : 'No connection logs found'}
                  </p>
                </div>
              )}
              
              {loading && (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-primary" />
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionLogsViewer;
