import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  CheckCircle2,
  Target,
  Lightbulb,
  AlertTriangle,
  Award,
  Star,
  Mic,
  Video,
  Play,
  Pause,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
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
  const { t } = useLanguage();

  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('premarket-checklist');
    return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST;
  });
  const [objectives, setObjectives] = useState('');
  const [lessons, setLessons] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [strengths, setStrengths] = useState('');
  const [rating, setRating] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  // Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const saveChecklist = (newChecklist: ChecklistItem[]) => {
    setChecklist(newChecklist);
    localStorage.setItem('premarket-checklist', JSON.stringify(newChecklist));
  };

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveChecklist(updated);
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditingLabel(item.label);
  };

  const saveEdit = () => {
    if (!editingLabel.trim()) {
      toast.error('Le libellé ne peut pas être vide');
      return;
    }
    const updated = checklist.map(item =>
      item.id === editingId ? { ...item, label: editingLabel.trim() } : item
    );
    saveChecklist(updated);
    setEditingId(null);
    setEditingLabel('');
    toast.success('Élément modifié');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const deleteItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    saveChecklist(updated);
    toast.success('Élément supprimé');
  };

  const addNewItem = () => {
    if (!newItemLabel.trim()) {
      toast.error('Le libellé ne peut pas être vide');
      return;
    }
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      label: newItemLabel.trim(),
      checked: false,
    };
    saveChecklist([...checklist, newItem]);
    setNewItemLabel('');
    setIsAddingNew(false);
    toast.success('Élément ajouté');
  };

  const completedItems = checklist.filter(item => item.checked).length;
  const completionPercentage = checklist.length > 0 
    ? Math.round((completedItems / checklist.length) * 100) 
    : 0;

  const handleSave = () => {
    toast.success('Journal enregistré avec succès!');
  };

  return (
    <div className="py-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('journal')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Routine quotidienne et leçons apprises
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <BookOpen className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pre-Market Checklist */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Check-list Pré-Marché</h3>
                <p className="text-xs text-muted-foreground">{completedItems}/{checklist.length} complété</p>
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

          <div className="space-y-3">
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
                  placeholder="Nouvel élément..."
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
                Ajouter un élément
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
            <h3 className="font-display font-semibold text-foreground">Objectifs du Jour</h3>
          </div>
          <Textarea
            placeholder="Quels sont vos objectifs pour aujourd'hui?&#10;- Max 3 trades&#10;- Risque max 2%&#10;- Respecter le plan..."
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            className="min-h-[180px]"
          />
        </div>

        {/* Lessons Learned */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-profit" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Leçons Apprises</h3>
          </div>
          <Textarea
            placeholder="Qu'avez-vous appris aujourd'hui?&#10;- La patience paie&#10;- Ne pas entrer trop tôt..."
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* Mistakes */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-loss/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-loss" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Erreurs Récurrentes</h3>
          </div>
          <Textarea
            placeholder="Quelles erreurs éviter?&#10;- FOMO sur les breakouts&#10;- Trading pendant les news..."
            value={mistakes}
            onChange={(e) => setMistakes(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* Strengths */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-profit" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Points Forts</h3>
          </div>
          <Textarea
            placeholder="Vos forces de la journée?&#10;- Bon timing d'entrée&#10;- Patience sur les positions..."
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* Day Rating */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Évaluation de la Journée</h3>
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
                      : "text-muted-foreground hover:text-primary/50"
                  )}
                />
              </button>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-2">
            {rating === 0 && "Cliquez pour évaluer votre journée"}
            {rating === 1 && "Journée difficile 😔"}
            {rating === 2 && "Peut mieux faire 🤔"}
            {rating === 3 && "Journée correcte 👍"}
            {rating === 4 && "Bonne journée! 😊"}
            {rating === 5 && "Excellente journée! 🌟"}
          </p>
        </div>
      </div>

      {/* Video/Audio Journal */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Journal Vidéo/Audio</h3>
            <p className="text-xs text-muted-foreground">Enregistrez votre ressenti du jour (max 60s)</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center py-8">
          <Button
            variant={isRecording ? 'destructive' : 'outline'}
            size="lg"
            className="gap-3 w-full sm:w-auto"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <>
                <Pause className="w-5 h-5" />
                Arrêter l'enregistrement
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Enregistrer Audio
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="gap-3 w-full sm:w-auto"
          >
            <Video className="w-5 h-5" />
            Enregistrer Vidéo
          </Button>
        </div>

        {isRecording && (
          <div className="flex items-center justify-center gap-2 text-loss animate-pulse">
            <div className="w-3 h-3 rounded-full bg-loss" />
            <span className="text-sm font-medium">Enregistrement en cours...</span>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          size="lg"
          className="gap-2 bg-gradient-primary hover:opacity-90 font-display"
        >
          <Save className="w-5 h-5" />
          Enregistrer le Journal
        </Button>
      </div>
    </div>
  );
};

export default Journal;
