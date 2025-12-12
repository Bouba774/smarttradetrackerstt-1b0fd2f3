import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { changelog, getLatestVersion, getChangesSinceVersion, ChangelogEntry } from '@/data/changelog';
import { Sparkles, Wrench, Bug, Shield, Gift } from 'lucide-react';

const LAST_SEEN_VERSION_KEY = 'stt_last_seen_version';

const ChangelogModal: React.FC = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [newChanges, setNewChanges] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    const currentVersion = getLatestVersion();

    if (!lastSeenVersion) {
      // First time user - show latest version changes
      localStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersion);
      setNewChanges([changelog[0]]);
      setIsOpen(true);
    } else if (lastSeenVersion !== currentVersion) {
      // User has seen a previous version - show all new changes
      const changes = getChangesSinceVersion(lastSeenVersion);
      if (changes.length > 0) {
        setNewChanges(changes);
        setIsOpen(true);
      }
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, getLatestVersion());
    setIsOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-4 h-4" />;
      case 'improvement':
        return <Wrench className="w-4 h-4" />;
      case 'fix':
        return <Bug className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels = {
      feature: { fr: 'Nouveauté', en: 'New' },
      improvement: { fr: 'Amélioration', en: 'Improvement' },
      fix: { fr: 'Correction', en: 'Fix' },
      security: { fr: 'Sécurité', en: 'Security' },
    };
    
    const colors = {
      feature: 'bg-profit/20 text-profit border-profit/30',
      improvement: 'bg-primary/20 text-primary border-primary/30',
      fix: 'bg-warning/20 text-warning border-warning/30',
      security: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };

    return (
      <Badge 
        variant="outline" 
        className={`${colors[type as keyof typeof colors] || 'bg-muted'} text-xs flex items-center gap-1`}
      >
        {getTypeIcon(type)}
        {labels[type as keyof typeof labels]?.[language] || type}
      </Badge>
    );
  };

  if (newChanges.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-primary/10 to-profit/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {language === 'fr' ? 'Nouveautés' : "What's New"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {language === 'fr' 
                  ? 'Découvrez les dernières mises à jour' 
                  : 'Discover the latest updates'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6">
          <div className="space-y-6 py-4">
            {newChanges.map((entry) => (
              <div key={entry.version} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">
                    V{entry.version}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {entry.title[language]}
                </p>
                <ul className="space-y-2">
                  {entry.changes.map((change, idx) => (
                    <li 
                      key={idx} 
                      className="flex items-start gap-3 p-2 rounded-lg bg-secondary/30"
                    >
                      {getTypeBadge(change.type)}
                      <span className="text-sm text-foreground flex-1">
                        {change.description[language]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border">
          <Button 
            onClick={handleClose} 
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {language === 'fr' ? "C'est compris !" : 'Got it!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangelogModal;
