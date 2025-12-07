import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_CHECKLIST = [
  { id: '1', label: 'Analyse technique complète', checked: false },
  { id: '2', label: 'Vérification du calendrier économique', checked: false },
  { id: '3', label: 'Plan de trading défini', checked: false },
  { id: '4', label: 'Risk management en place', checked: false },
  { id: '5', label: 'État émotionnel stable', checked: false },
  { id: '6', label: 'Pas de news importantes', checked: false },
];

const Journal: React.FC = () => {
  const { t } = useLanguage();

  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [objectives, setObjectives] = useState('');
  const [lessons, setLessons] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [strengths, setStrengths] = useState('');
  const [rating, setRating] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const completedItems = checklist.filter(item => item.checked).length;
  const completionPercentage = Math.round((completedItems / checklist.length) * 100);

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
                  "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
                  item.checked ? "bg-profit/10 border border-profit/30" : "bg-secondary/30 hover:bg-secondary/50"
                )}
                onClick={() => toggleChecklistItem(item.id)}
              >
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => toggleChecklistItem(item.id)}
                  className={cn(
                    "border-2",
                    item.checked ? "border-profit bg-profit data-[state=checked]:bg-profit" : "border-muted-foreground"
                  )}
                />
                <span className={cn(
                  "text-sm",
                  item.checked ? "text-profit line-through" : "text-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            ))}
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
