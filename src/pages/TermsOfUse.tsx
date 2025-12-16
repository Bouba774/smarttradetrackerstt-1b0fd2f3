import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsOfUse: React.FC = () => {
  const { language } = useLanguage();

  const contentFR = (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-2">CONDITIONS D'UTILISATION (CGU)</h1>
      <p className="text-muted-foreground mb-6">Dernière mise à jour : 11/12/2025</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Acceptation</h2>
      <p className="text-muted-foreground mb-4">En utilisant l'application, vous acceptez ces Conditions.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Objet</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Journal de trading, statistiques, performance, analyse psychologique, vidéos/audio, IA, calculatrice, rapports, défis</li>
        <li>Aucun conseil financier</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Responsabilité</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Vous êtes responsable de vos décisions de trading</li>
        <li>Aucune responsabilité pour pertes financières</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Garantie</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Application fournie « telle quelle »</li>
        <li>Pas de garantie d'exactitude, d'absence d'erreurs ou d'interruptions</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Propriété intellectuelle</h2>
      <p className="text-muted-foreground mb-4">Interdiction de copier ou redistribuer</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Compte utilisateur</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Protection du mot de passe requise</li>
        <li>Suspension en cas d'abus</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. Résiliation</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Compte supprimable à tout moment</li>
        <li>Suspension en cas de non-respect</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">8. Modifications</h2>
      <p className="text-muted-foreground mb-4">Possibles selon évolutions légales ou fonctionnelles</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">9. Cookies</h2>
      <p className="text-muted-foreground mb-4">
        L'application utilise uniquement des cookies fonctionnels essentiels pour assurer son bon fonctionnement. 
        Aucune publicité ni cookie de suivi tiers n'est utilisé.
      </p>
    </>
  );

  const contentEN = (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-2">TERMS OF USE</h1>
      <p className="text-muted-foreground mb-6">Last updated: 11/12/2025</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Acceptance</h2>
      <p className="text-muted-foreground mb-4">By using the application, you agree to these Terms.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Purpose</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Trading journal, statistics, performance tracking, psychology, video/audio, AI, lot calculator, reports, challenges</li>
        <li>No financial advice</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Responsibility</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>You are responsible for your trading decisions</li>
        <li>Not responsible for losses</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Disclaimer</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>App provided "as is"</li>
        <li>No guarantee of accuracy, error-free usage, or availability</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Intellectual Property</h2>
      <p className="text-muted-foreground mb-4">No copying or redistribution</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. User Account</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Protect your password</li>
        <li>Account may be suspended</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. Termination</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Account can be deleted anytime</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">8. Changes</h2>
      <p className="text-muted-foreground mb-4">May update Terms or Privacy Policy</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">9. Cookies</h2>
      <p className="text-muted-foreground mb-4">
        The application uses only essential functional cookies to ensure proper operation. 
        No advertising or third-party tracking cookies are used.
      </p>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-profit" />
            <span className="font-display font-semibold text-foreground">
              {language === 'fr' ? "Conditions d'Utilisation" : 'Terms of Use'}
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-screen">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-12">
          <div className="glass-card p-6 sm:p-8">
            {language === 'fr' ? contentFR : contentEN}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TermsOfUse;
