import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  checklist: ChecklistItem[];
  daily_objective: string | null;
  lessons: string | null;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export const useJournalEntries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(entry => ({
        ...entry,
        checklist: Array.isArray(entry.checklist) ? entry.checklist : JSON.parse(entry.checklist as string || '[]'),
      })) as JournalEntry[];
    },
    enabled: !!user,
  });

  const getEntryByDate = (date: Date): JournalEntry | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find(entry => entry.entry_date === dateStr);
  };

  const upsertEntry = useMutation({
    mutationFn: async (entry: {
      entry_date: string;
      checklist?: ChecklistItem[];
      daily_objective?: string;
      lessons?: string;
      notes?: string;
      rating?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if entry exists
      const { data: existing } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', entry.entry_date)
        .single();

      const entryData = {
        user_id: user.id,
        entry_date: entry.entry_date,
        checklist: JSON.stringify(entry.checklist || []),
        daily_objective: entry.daily_objective || null,
        lessons: entry.lessons || null,
        notes: entry.notes || null,
        rating: entry.rating ?? null,
      };

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert(entryData)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', user?.id] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', user?.id] });
    },
  });

  return {
    entries,
    isLoading,
    getEntryByDate,
    upsertEntry,
    deleteEntry,
  };
};
