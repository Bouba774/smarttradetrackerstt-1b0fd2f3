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
      <p className="text-muted-foreground mb-6">Dernière mise à jour : 21/12/2025</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Acceptation</h2>
      <p className="text-muted-foreground mb-4">En utilisant l'application Smart Trade Tracker, vous acceptez ces Conditions dans leur intégralité.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Objet de l'application</h2>
      <p className="text-muted-foreground mb-2">Smart Trade Tracker est une application de journal de trading offrant :</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Journal de trading avec historique complet et images/vidéos/audio</li>
        <li>Tableau de bord avec 30+ statistiques en temps réel</li>
        <li>Analyse psychologique avancée (score de discipline, profil trader, fatigue mentale)</li>
        <li>Mémoire émotionnelle et détection d'auto-sabotage</li>
        <li>Journal vidéo/audio jusqu'à 60 secondes</li>
        <li>Calculatrice de lot avec transfert automatique</li>
        <li>Système de défis, récompenses et gamification avec coffres</li>
        <li>Assistant IA avec résumé quotidien personnalisé</li>
        <li>Comparaison de périodes et export PDF/JSON/CSV</li>
        <li>Mode Focus anti-distraction</li>
        <li>Support de 51 devises avec conversion en temps réel</li>
        <li>Page d'aide multilingue avec FAQ dynamique et formulaire de contact</li>
        <li>Détection avancée des appareils et navigateurs</li>
        <li>Centre de confidentialité RGPD complet</li>
      </ul>
      <p className="text-muted-foreground mb-4 font-semibold">⚠️ L'application ne fournit aucun conseil financier ou en investissement.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Sécurité et Protection</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Protection par code PIN (4 chiffres) et authentification biométrique optionnelle</li>
        <li>Mode confidentiel pour masquer les données sensibles</li>
        <li>Synchronisation sécurisée des paramètres entre appareils</li>
        <li>Alertes email en cas de connexion depuis un nouvel appareil</li>
        <li>Verrouillage automatique après inactivité configurable</li>
        <li>Système de verrouillage progressif après tentatives échouées</li>
        <li>Détection de connexions suspectes (VPN, Tor, proxy)</li>
        <li>Protection anti-bot (Cloudflare Turnstile)</li>
        <li>Row Level Security sur toutes les données utilisateur</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Responsabilité</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Vous êtes entièrement responsable de vos décisions de trading</li>
        <li>L'application n'assume aucune responsabilité pour les pertes financières</li>
        <li>Les analyses et statistiques sont fournies à titre informatif uniquement</li>
        <li>L'assistant IA ne constitue pas un conseil en investissement</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Garantie</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Application fournie « telle quelle »</li>
        <li>Pas de garantie d'exactitude des calculs ou statistiques</li>
        <li>Pas de garantie d'absence d'erreurs ou d'interruptions de service</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Propriété intellectuelle</h2>
      <p className="text-muted-foreground mb-4">Tout le contenu de l'application (code, design, textes, images) est protégé. Interdiction de copier, reproduire ou redistribuer sans autorisation.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. Compte utilisateur</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Vous êtes responsable de la protection de votre mot de passe et code PIN</li>
        <li>Un compte par personne</li>
        <li>Suspension possible en cas d'utilisation abusive</li>
        <li>Les paramètres de sécurité sont synchronisés sur tous vos appareils</li>
        <li>Confirmation par email requise pour les nouveaux comptes</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">8. Résiliation</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Compte supprimable à tout moment depuis les paramètres</li>
        <li>Possibilité de supprimer toutes les données (trades, journaux, vidéos, défis)</li>
        <li>Export de données disponible avant suppression</li>
        <li>Suspension en cas de non-respect des conditions</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">9. Modifications</h2>
      <p className="text-muted-foreground mb-4">Ces conditions peuvent être modifiées selon les évolutions légales ou fonctionnelles de l'application. Les utilisateurs seront informés des changements majeurs.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">10. Cookies et stockage local</h2>
      <p className="text-muted-foreground mb-4">
        L'application utilise uniquement des cookies fonctionnels essentiels et le stockage local pour : 
        préférences utilisateur, état de connexion, consentement cookies, et données temporaires de verrouillage. 
        Aucun cookie publicitaire ou de suivi tiers n'est utilisé.
      </p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">11. Support multilingue</h2>
      <p className="text-muted-foreground mb-4">
        L'application est disponible en 8 langues : Français, Anglais, Espagnol, Portugais, Allemand, Turc, Italien et Arabe.
        Une page d'aide complète avec FAQ est disponible dans toutes ces langues.
      </p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">12. Contact</h2>
      <p className="text-muted-foreground mb-4">
        Pour toute question concernant ces conditions : <a href="mailto:alphafx@outlook.fr" className="text-profit hover:underline">alphafx@outlook.fr</a>
      </p>
      <p className="text-muted-foreground mb-4">
        Vous pouvez également utiliser le formulaire de contact intégré dans la page d'Aide de l'application.
      </p>
    </>
  );

  const contentEN = (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-2">TERMS OF USE</h1>
      <p className="text-muted-foreground mb-6">Last updated: 21/12/2025</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Acceptance</h2>
      <p className="text-muted-foreground mb-4">By using Smart Trade Tracker, you agree to these Terms in their entirety.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Application Purpose</h2>
      <p className="text-muted-foreground mb-2">Smart Trade Tracker is a trading journal application offering:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Trading journal with complete history and images/videos/audio</li>
        <li>Dashboard with 30+ real-time statistics</li>
        <li>Advanced psychological analysis (discipline score, trader profile, mental fatigue)</li>
        <li>Emotional memory and self-sabotage detection</li>
        <li>Video/audio journal up to 60 seconds</li>
        <li>Lot calculator with automatic transfer</li>
        <li>Challenges, rewards and gamification system with chests</li>
        <li>AI assistant with personalized daily summary</li>
        <li>Period comparison and PDF/JSON/CSV export</li>
        <li>Focus mode anti-distraction</li>
        <li>Support for 51 currencies with real-time conversion</li>
        <li>Multilingual help page with dynamic FAQ and contact form</li>
        <li>Advanced device and browser detection</li>
        <li>Complete GDPR privacy center</li>
      </ul>
      <p className="text-muted-foreground mb-4 font-semibold">⚠️ The application does not provide any financial or investment advice.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Security and Protection</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>PIN code protection (4 digits) and optional biometric authentication</li>
        <li>Confidential mode to hide sensitive data</li>
        <li>Secure settings synchronization across devices</li>
        <li>Email alerts when connecting from a new device</li>
        <li>Configurable automatic lock after inactivity</li>
        <li>Progressive lockout system after failed attempts</li>
        <li>Suspicious connection detection (VPN, Tor, proxy)</li>
        <li>Anti-bot protection (Cloudflare Turnstile)</li>
        <li>Row Level Security on all user data</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Responsibility</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>You are fully responsible for your trading decisions</li>
        <li>The application assumes no responsibility for financial losses</li>
        <li>Analyses and statistics are provided for informational purposes only</li>
        <li>The AI assistant does not constitute investment advice</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Disclaimer</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Application provided "as is"</li>
        <li>No guarantee of accuracy of calculations or statistics</li>
        <li>No guarantee of error-free usage or service availability</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Intellectual Property</h2>
      <p className="text-muted-foreground mb-4">All application content (code, design, texts, images) is protected. Copying, reproducing or redistributing without authorization is prohibited.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. User Account</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>You are responsible for protecting your password and PIN code</li>
        <li>One account per person</li>
        <li>Suspension possible in case of misuse</li>
        <li>Security settings are synchronized across all your devices</li>
        <li>Email confirmation required for new accounts</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">8. Termination</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Account can be deleted at any time from settings</li>
        <li>Option to delete all data (trades, journals, videos, challenges)</li>
        <li>Data export available before deletion</li>
        <li>Suspension in case of terms violation</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">9. Changes</h2>
      <p className="text-muted-foreground mb-4">These terms may be modified according to legal or functional developments of the application. Users will be informed of major changes.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">10. Cookies and Local Storage</h2>
      <p className="text-muted-foreground mb-4">
        The application uses only essential functional cookies and local storage for: 
        user preferences, login state, cookie consent, and temporary lock data. 
        No advertising or third-party tracking cookies are used.
      </p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">11. Multilingual Support</h2>
      <p className="text-muted-foreground mb-4">
        The application is available in 8 languages: French, English, Spanish, Portuguese, German, Turkish, Italian and Arabic.
        A complete help page with FAQ is available in all these languages.
      </p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">12. Contact</h2>
      <p className="text-muted-foreground mb-4">
        For any questions regarding these terms: <a href="mailto:alphafx@outlook.fr" className="text-profit hover:underline">alphafx@outlook.fr</a>
      </p>
      <p className="text-muted-foreground mb-4">
        You can also use the integrated contact form in the Help page of the application.
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
