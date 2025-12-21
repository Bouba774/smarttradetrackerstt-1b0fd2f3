import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GDPRRequest {
  id: string;
  user_id: string;
  request_type: 'export' | 'deletion' | 'rectification' | 'access';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason: string | null;
  data_export_url: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserConsent {
  id: string;
  user_id: string;
  consent_type: 'terms' | 'privacy' | 'marketing' | 'analytics' | 'cookies';
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

interface DataProcessingEntry {
  id: string;
  processing_name: string;
  purpose: string;
  legal_basis: string;
  data_categories: string[];
  recipients: string[] | null;
  retention_period: string;
  is_active: boolean;
  created_at: string;
}

interface ExportedData {
  profile: any;
  settings: any;
  trades: any[];
  journal_entries: any[];
  challenges: any[];
  sessions: any[];
  consents: any[];
  exported_at: string;
  export_format_version: string;
}

export const useGDPR = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's GDPR requests
  const requestsQuery = useQuery({
    queryKey: ['gdpr-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gdpr-management', {
        body: { action: 'get-requests' },
      });

      if (error) throw error;
      return data.requests as GDPRRequest[];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Get user's consents
  const consentsQuery = useQuery({
    queryKey: ['gdpr-consents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gdpr-management', {
        body: { action: 'get-consents' },
      });

      if (error) throw error;
      return data.consents as UserConsent[];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Get data processing registry
  const registryQuery = useQuery({
    queryKey: ['gdpr-registry'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gdpr-management', {
        body: { action: 'get-processing-registry' },
      });

      if (error) throw error;
      return data.registry as DataProcessingEntry[];
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });

  // Export data
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gdpr-management', {
        body: { action: 'export-data' },
      });

      if (error) throw error;
      return data.data as ExportedData;
    },
    onSuccess: (data) => {
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-trade-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Données exportées avec succès');
      queryClient.invalidateQueries({ queryKey: ['gdpr-requests'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'export des données');
    },
  });

  // Request deletion
  const requestDeletionMutation = useMutation({
    mutationFn: async (reason?: string) => {
      const { data, error } = await supabase.functions.invoke('gdpr-management', {
        body: { action: 'request-deletion', reason },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Demande de suppression envoyée. Elle sera traitée sous 30 jours.');
      queryClient.invalidateQueries({ queryKey: ['gdpr-requests'] });
    },
    onError: () => {
      toast.error('Erreur lors de la demande de suppression');
    },
  });

  // Update consent
  const updateConsentMutation = useMutation({
    mutationFn: async ({ consentType, granted }: { consentType: string; granted: boolean }) => {
      const { data, error } = await supabase.functions.invoke('gdpr-management', {
        body: { action: 'update-consent', consentType, granted },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-consents'] });
      toast.success('Préférences mises à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Helper to check if a specific consent is granted
  const hasConsent = (consentType: string): boolean => {
    const consent = consentsQuery.data?.find(c => c.consent_type === consentType);
    return consent?.granted ?? false;
  };

  // Helper to get consent record
  const getConsent = (consentType: string): UserConsent | undefined => {
    return consentsQuery.data?.find(c => c.consent_type === consentType);
  };

  return {
    // Requests
    requests: requestsQuery.data || [],
    isLoadingRequests: requestsQuery.isLoading,
    pendingRequests: (requestsQuery.data || []).filter(r => r.status === 'pending'),

    // Consents
    consents: consentsQuery.data || [],
    isLoadingConsents: consentsQuery.isLoading,
    hasConsent,
    getConsent,
    updateConsent: updateConsentMutation.mutateAsync,
    isUpdatingConsent: updateConsentMutation.isPending,

    // Registry
    registry: registryQuery.data || [],
    isLoadingRegistry: registryQuery.isLoading,

    // Actions
    exportData: exportDataMutation.mutateAsync,
    isExporting: exportDataMutation.isPending,
    exportedData: exportDataMutation.data,

    requestDeletion: requestDeletionMutation.mutateAsync,
    isRequestingDeletion: requestDeletionMutation.isPending,

    // Refetch
    refetchRequests: requestsQuery.refetch,
    refetchConsents: consentsQuery.refetch,
  };
};
