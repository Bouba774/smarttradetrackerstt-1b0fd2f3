import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const PrivacyPolicy: React.FC = () => {
  const { language } = useLanguage();

  const contentFR = (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-2">RÈGLES DE CONFIDENTIALITÉ (Politique de Confidentialité) — RGPD</h1>
      <p className="text-muted-foreground mb-6">Dernière mise à jour : 11/12/2025</p>
      
      <p className="mb-6">
        La présente Politique de Confidentialité explique comment Smart Trade Tracker (« l'Application », « nous ») collecte, utilise, protège et traite les données personnelles de ses utilisateurs (« vous »). Nous nous engageons à respecter le Règlement Général sur la Protection des Données (RGPD) et toutes les lois applicables.
      </p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Données collectées</h2>
      <p className="mb-4">Nous collectons uniquement les données nécessaires au fonctionnement de l'application.</p>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">1.1 Données fournies par l'utilisateur</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Pseudo, email</li>
        <li>Informations liées au trading : trades, notes, journaux, statistiques, vidéos/audio</li>
        <li>Préférences de langue, devise, paramètres utilisateur</li>
      </ul>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">1.2 Données techniques</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Identifiant unique de l'app (non identifiable)</li>
        <li>Modèle de l'appareil, OS</li>
        <li>Journaux d'erreur et performances</li>
      </ul>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">1.3 Aucune donnée sensible</h3>
      <p className="text-muted-foreground mb-4">Pas de données liées à la santé, religion, GPS ou données bancaires.</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Finalités</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Fonctionnement de l'app</li>
        <li>Statistiques et analyses</li>
        <li>Sauvegarde de l'historique</li>
        <li>Personnalisation</li>
        <li>Améliorations et correction de bugs</li>
        <li>Sécurité</li>
        <li>Aucune revente de données</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Base légale</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Exécution du service</li>
        <li>Consentement</li>
        <li>Intérêt légitime</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Stockage et sécurité</h2>
      <p className="text-muted-foreground mb-4">Cryptage, serveurs sécurisés, restrictions d'accès</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Durée</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Conservation tant que le compte existe</li>
        <li>Suppression possible à tout moment</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Partage</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Données anonymisées uniquement</li>
        <li>Jamais de vente de données personnelles</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. Droits (RGPD)</h2>
      <p className="text-muted-foreground mb-4">Accès, rectification, opposition, effacement, portabilité, limitation</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">8. Cookies</h2>
      <p className="mb-4">Notre application utilise différents types de cookies :</p>
      
      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">8.1 Cookies fonctionnels</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Préférences utilisateur (langue, thème, devise)</li>
        <li>État de connexion et authentification</li>
        <li>Consentement aux cookies</li>
      </ul>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">8.2 Cookies publicitaires</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Notre application utilise des cookies publicitaires de tiers (Adsterra/Monetag)</li>
        <li>Ces cookies permettent d'afficher des publicités personnalisées</li>
        <li>Ils peuvent collecter des informations sur votre navigation</li>
        <li>Ces données sont utilisées pour vous proposer des annonces pertinentes</li>
      </ul>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">8.3 Gestion des cookies</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Vous pouvez accepter ou refuser les cookies lors de votre première visite</li>
        <li>Vous pouvez modifier vos préférences dans les paramètres de votre navigateur</li>
        <li>Le refus des cookies publicitaires peut affecter votre expérience</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">9. Partenaires publicitaires</h2>
      <p className="text-muted-foreground mb-4">
        Nous travaillons avec des réseaux publicitaires tiers qui peuvent utiliser des technologies de suivi. 
        Ces partenaires ont leurs propres politiques de confidentialité. En utilisant notre application, 
        vous acceptez également leurs conditions.
      </p>
    </>
  );

  const contentEN = (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-2">PRIVACY POLICY — GDPR COMPLIANT</h1>
      <p className="text-muted-foreground mb-6">Last updated: 11/12/2025</p>
      
      <p className="mb-6">
        This Privacy Policy explains how Smart Trade Tracker ("the Application", "we") collects, uses, protects, and processes personal data of its users ("you"). We comply with the General Data Protection Regulation (GDPR) and applicable laws.
      </p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Data collected</h2>
      <p className="mb-4">Only what is required for proper functioning.</p>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">1.1 User-provided data</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Name, email</li>
        <li>Trading information: trades, notes, journals, stats, video/audio</li>
        <li>Language preferences, currency, settings</li>
      </ul>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">1.2 Technical data</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Unique app identifier</li>
        <li>Device model, OS</li>
        <li>Error logs and performance data</li>
      </ul>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">1.3 No sensitive data</h3>
      <p className="text-muted-foreground mb-4">No health, religion, GPS or banking information</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Purpose</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Functionality</li>
        <li>Analytics</li>
        <li>History storage</li>
        <li>Customization</li>
        <li>Improvements</li>
        <li>Security</li>
        <li>No data selling</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Legal basis</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Service performance</li>
        <li>Consent</li>
        <li>Legitimate interest</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Security</h2>
      <p className="text-muted-foreground mb-4">Encryption, secure servers, access restriction</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Retention</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Stored while account exists</li>
        <li>Deletion upon request</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Sharing</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Anonymized technical data only</li>
        <li>Never sold</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. Rights</h2>
      <p className="text-muted-foreground mb-4">Access, correction, deletion, objection, portability</p>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">8. Cookies</h2>
      <p className="mb-4">Our application uses different types of cookies:</p>
      
      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">8.1 Functional Cookies</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>User preferences (language, theme, currency)</li>
        <li>Login state and authentication</li>
        <li>Cookie consent status</li>
      </ul>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">8.2 Advertising Cookies</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>Our application uses third-party advertising cookies (Adsterra/Monetag)</li>
        <li>These cookies enable personalized advertisements</li>
        <li>They may collect information about your browsing activity</li>
        <li>This data is used to show you relevant ads</li>
      </ul>

      <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">8.3 Cookie Management</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
        <li>You can accept or decline cookies on your first visit</li>
        <li>You can change your preferences in your browser settings</li>
        <li>Declining advertising cookies may affect your experience</li>
      </ul>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">9. Advertising Partners</h2>
      <p className="text-muted-foreground mb-4">
        We work with third-party advertising networks that may use tracking technologies. 
        These partners have their own privacy policies. By using our application, 
        you also agree to their terms.
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
            <Shield className="w-5 h-5 text-profit" />
            <span className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy'}
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

export default PrivacyPolicy;
