import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Trade {
  id: string;
  user_id: string;
  asset: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  setup: string | null;
  custom_setup: string | null;
  result: 'win' | 'loss' | 'breakeven' | 'pending' | null;
  profit_loss: number | null;
  risk_amount: number | null;
  notes: string | null;
  emotions: string | null;
  images: string[] | null;
  videos: string[] | null;
  audios: string[] | null;
  trade_date: string;
  created_at: string;
  updated_at: string;
  // New fields for exit tracking
  exit_timestamp: string | null;
  exit_method: 'sl' | 'tp' | 'manual' | null;
  duration_seconds: number | null;
  timeframe: string | null;
}

export const useTrades = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tradesQuery = useQuery({
    queryKey: ['trades', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });

      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user
  });

  const addTrade = useMutation({
    mutationFn: async (trade: Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('trades')
        .insert({ ...trade, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
    }
  });

  const updateTrade = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trade> & { id: string }) => {
      const { data, error } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
    }
  });

  const deleteTrade = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
    }
  });

  // Calculate statistics
  const stats = tradesQuery.data ? {
    totalTrades: tradesQuery.data.length,
    winningTrades: tradesQuery.data.filter(t => t.result === 'win').length,
    losingTrades: tradesQuery.data.filter(t => t.result === 'loss').length,
    breakeven: tradesQuery.data.filter(t => t.result === 'breakeven').length,
    totalProfit: tradesQuery.data
      .filter(t => t.profit_loss && t.profit_loss > 0)
      .reduce((sum, t) => sum + (t.profit_loss || 0), 0),
    totalLoss: tradesQuery.data
      .filter(t => t.profit_loss && t.profit_loss < 0)
      .reduce((sum, t) => sum + Math.abs(t.profit_loss || 0), 0),
    winrate: tradesQuery.data.length > 0 
      ? (tradesQuery.data.filter(t => t.result === 'win').length / 
         tradesQuery.data.filter(t => t.result !== 'pending').length) * 100 
      : 0
  } : null;

  return {
    trades: tradesQuery.data || [],
    isLoading: tradesQuery.isLoading,
    error: tradesQuery.error,
    stats,
    addTrade,
    updateTrade,
    deleteTrade,
    refetch: tradesQuery.refetch
  };
};
