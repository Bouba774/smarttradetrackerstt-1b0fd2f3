import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  BookOpen,
  CheckCircle2,
  Target,
  Lightbulb,
  AlertTriangle,
  Award,
  Star,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  CalendarIcon,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Analyse technique complète', checked: false },
  { id: '2', label: 'Vérification du calendrier économique', checked: false },
  { id: '3', label: 'Plan de trading défini', checked: false },
  { id: '4', label: 'Risk management en place', checked: false },
  { id: '5', label: 'État émotionnel stable', checked: false },
  { id: '6', label: 'Pas de news importantes', checked: false },
];

const Journal: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { entries, isLoading, getEntryByDate, upsertEntry } = useJournalEntries();
  const locale = language === 'fr' ? fr : enUS;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [objectives, setObjectives] = useState('');
  const [lessons, setLessons] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [strengths, setStrengths] = useState('');
  const [rating, setRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Load data for selected date
  useEffect(() => {
    const entry = getEntryByDate(selectedDate);
    if (entry) {
      setChecklist(entry.checklist.length > 0 ? entry.checklist : DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false })));
      setObjectives(entry.daily_objective || '');
      setLessons(entry.lessons || '');
      // Parse notes JSON if available
      try {
        const notesData = entry.notes ? JSON.parse(entry.notes) : {};
        setMistakes(notesData.mistakes || '');
        setStrengths(notesData.strengths || '');
      } catch {
        setMistakes('');
        setStrengths('');
      }
      // Load saved rating
      setRating(entry.rating || 0);
    } else {
      // Reset to defaults for new date
      setChecklist(DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false })));
      setObjectives('');
      setLessons('');
      setMistakes('');
      setStrengths('');
      setRating(0);
    }
  }, [selectedDate, entries]);

  const handleSave = async () => {
    if (!user) {
      toast.error(language === 'fr' ? 'Vous devez être connecté' : 'You must be logged in');
      return;
    }

    setIsSaving(true);
    try {
      await upsertEntry.mutateAsync({
        entry_date: format(selectedDate, 'yyyy-MM-dd'),
        checklist,
        daily_objective: objectives || undefined,
        lessons: lessons || undefined,
        notes: JSON.stringify({ mistakes, strengths }),
        rating: rating > 0 ? rating : undefined,
      });
      toast.success(language === 'fr' ? 'Journal enregistré!' : 'Journal saved!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'enregistrement' : 'Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditingLabel(item.label);
  };

  const saveEdit = () => {
    if (!editingLabel.trim()) {
      toast.error(language === 'fr' ? 'Le libellé ne peut pas être vide' : 'Label cannot be empty');
      return;
    }
    setChecklist(prev => prev.map(item =>
      item.id === editingId ? { ...item, label: editingLabel.trim() } : item
    ));
    setEditingId(null);
    setEditingLabel('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const deleteItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const addNewItem = () => {
    if (!newItemLabel.trim()) {
      toast.error(language === 'fr' ? 'Le libellé ne peut pas être vide' : 'Label cannot be empty');
      return;
    }
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      label: newItemLabel.trim(),
      checked: false,
    };
    setChecklist(prev => [...prev, newItem]);
    setNewItemLabel('');
    setIsAddingNew(false);
  };

  const completedItems = checklist.filter(item => item.checked).length;
  const completionPercentage = checklist.length > 0 
    ? Math.round((completedItems / checklist.length) * 100) 
    : 0;

  // Get dates with entries for calendar highlighting
  const datesWithEntries = entries.map(e => new Date(e.entry_date));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('journal')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' ? 'Routine quotidienne et leçons apprises' : 'Daily routine and lessons learned'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <BookOpen className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Calendar Section */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Sélectionner une date' : 'Select a date'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale })}
            </p>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          locale={locale}
          className="rounded-lg border border-border mx-auto pointer-events-auto"
          modifiers={{
            hasEntry: datesWithEntries,
          }}
          modifiersStyles={{
            hasEntry: {
              backgroundColor: 'hsl(var(--primary) / 0.2)',
              fontWeight: 'bold',
            },
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pre-Market Checklist */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">
                  {language === 'fr' ? 'Check-list Pré-Marché' : 'Pre-Market Checklist'}
                </h3>
                <p className="text-xs text-muted-foreground">{completedItems}/{checklist.length} {language === 'fr' ? 'complété' : 'completed'}</p>
              </div>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 font-display font-bold text-sm",
              completionPercentage === 100 ? "border-profit text-profit" :
              completionPercentage >= 50 ? "border-primary text-primary" :
              "border-muted-foreground text-muted-foreground"
            )}>
              {completionPercentage}%
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {checklist.map(item => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  item.checked ? "bg-profit/10 border border-profit/30" : "bg-secondary/30"
                )}
              >
                {editingId === item.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}>
                      <Check className="w-4 h-4 text-profit" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
                      <X className="w-4 h-4 text-loss" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className={cn(
                        "border-2",
                        item.checked ? "border-profit bg-profit data-[state=checked]:bg-profit" : "border-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm flex-1 cursor-pointer",
                        item.checked ? "text-profit line-through" : "text-foreground"
                      )}
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      {item.label}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-50 hover:opacity-100"
                      onClick={() => startEditing(item)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-50 hover:opacity-100 text-loss"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            
            {/* Add new item */}
            {isAddingNew ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
                <Input
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder={language === 'fr' ? 'Nouvel élément...' : 'New item...'}
                  className="flex-1 h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addNewItem();
                    if (e.key === 'Escape') {
                      setIsAddingNew(false);
                      setNewItemLabel('');
                    }
                  }}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={addNewItem}>
                  <Check className="w-4 h-4 text-profit" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                  setIsAddingNew(false);
                  setNewItemLabel('');
                }}>
                  <X className="w-4 h-4 text-loss" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 mt-2"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4" />
                {language === 'fr' ? 'Ajouter un élément' : 'Add item'}
              </Button>
            )}
          </div>
        </div>

        {/* Daily Objectives */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Objectifs du Jour' : "Today's Objectives"}
            </h3>
          </div>
          <Textarea
            placeholder={language === 'fr' 
              ? "Quels sont vos objectifs pour aujourd'hui?\n- Max 3 trades\n- Risque max 2%\n- Respecter le plan..."
              : "What are your goals for today?\n- Max 3 trades\n- Max 2% risk\n- Follow the plan..."}
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            className="min-h-[180px]"
          />
        </div>

        {/* Lessons Learned */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-profit" />
            </div>
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Leçons Apprises' : 'Lessons Learned'}
            </h3>
          </div>
          <Textarea
            placeholder={language === 'fr'
              ? "Qu'avez-vous appris aujourd'hui?\n- La patience paie\n- Ne pas entrer trop tôt..."
              : "What did you learn today?\n- Patience pays off\n- Don't enter too early..."}
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* Mistakes */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-loss/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-loss" />
            </div>
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Erreurs Récurrentes' : 'Common Mistakes'}
            </h3>
          </div>
          <Textarea
            placeholder={language === 'fr'
              ? "Quelles erreurs éviter?\n- FOMO sur les breakouts\n- Trading pendant les news..."
              : "What mistakes to avoid?\n- FOMO on breakouts\n- Trading during news..."}
            value={mistakes}
            onChange={(e) => setMistakes(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* Strengths */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-profit" />
            </div>
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Points Forts' : 'Strengths'}
            </h3>
          </div>
          <Textarea
            placeholder={language === 'fr'
              ? "Vos forces de la journée?\n- Bon timing d'entrée\n- Patience sur les positions..."
              : "Your strengths today?\n- Good entry timing\n- Patience on positions..."}
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* Day Rating */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Évaluation de la Journée' : 'Day Rating'}
            </h3>
          </div>
          
          <div className="flex items-center justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "w-10 h-10 transition-colors",
                    star <= rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {rating === 0 && (language === 'fr' ? 'Cliquez pour noter votre journée' : 'Click to rate your day')}
            {rating === 1 && (language === 'fr' ? 'Journée difficile' : 'Difficult day')}
            {rating === 2 && (language === 'fr' ? 'Peut mieux faire' : 'Could be better')}
            {rating === 3 && (language === 'fr' ? 'Journée correcte' : 'Decent day')}
            {rating === 4 && (language === 'fr' ? 'Bonne journée' : 'Good day')}
            {rating === 5 && (language === 'fr' ? 'Excellente journée!' : 'Excellent day!')}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !user}
        className="w-full gap-2 bg-gradient-primary hover:opacity-90 font-display"
        size="lg"
      >
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {language === 'fr' ? 'Enregistrer le journal' : 'Save journal'}
      </Button>
    </div>
  );
};

export default Journal;
