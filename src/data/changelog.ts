// Changelog data - Add new entries at the top
export interface ChangelogEntry {
  version: string;
  date: string;
  title: {
    fr: string;
    en: string;
  };
  changes: {
    type: 'feature' | 'improvement' | 'fix' | 'security';
    description: {
      fr: string;
      en: string;
    };
  }[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2025-01-12',
    title: {
      fr: 'Améliorations de sécurité et nouvelles fonctionnalités',
      en: 'Security improvements and new features',
    },
    changes: [
      {
        type: 'feature',
        description: {
          fr: 'Ajout de la réinitialisation du mot de passe par email',
          en: 'Added password reset via email',
        },
      },
      {
        type: 'security',
        description: {
          fr: 'Renforcement de la validation des mots de passe (8 caractères, majuscule, minuscule, chiffre, caractère spécial)',
          en: 'Enhanced password validation (8 characters, uppercase, lowercase, number, special character)',
        },
      },
      {
        type: 'feature',
        description: {
          fr: 'Indicateur visuel de force du mot de passe',
          en: 'Visual password strength indicator',
        },
      },
      {
        type: 'improvement',
        description: {
          fr: 'Sélecteur de langue avec drapeaux sur la landing page',
          en: 'Language selector with flags on landing page',
        },
      },
      {
        type: 'improvement',
        description: {
          fr: 'Thème automatique selon les préférences du téléphone',
          en: 'Automatic theme based on device preferences',
        },
      },
      {
        type: 'improvement',
        description: {
          fr: 'Animations de défilement sur la landing page',
          en: 'Scroll reveal animations on landing page',
        },
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-01-01',
    title: {
      fr: 'Lancement initial',
      en: 'Initial release',
    },
    changes: [
      {
        type: 'feature',
        description: {
          fr: 'Dashboard professionnel avec statistiques avancées',
          en: 'Professional dashboard with advanced statistics',
        },
      },
      {
        type: 'feature',
        description: {
          fr: 'Journal de trading complet avec images',
          en: 'Complete trading journal with images',
        },
      },
      {
        type: 'feature',
        description: {
          fr: 'Analyse psychologique et suivi des émotions',
          en: 'Psychological analysis and emotion tracking',
        },
      },
      {
        type: 'feature',
        description: {
          fr: 'Système de défis et gamification',
          en: 'Challenges and gamification system',
        },
      },
      {
        type: 'feature',
        description: {
          fr: 'Calculatrice de lot professionnelle',
          en: 'Professional lot calculator',
        },
      },
      {
        type: 'feature',
        description: {
          fr: 'Assistant IA intégré',
          en: 'Integrated AI assistant',
        },
      },
    ],
  },
];

export const getLatestVersion = () => changelog[0]?.version || '1.0.0';

export const getChangelogForVersion = (version: string) => 
  changelog.find(entry => entry.version === version);

export const getChangesSinceVersion = (lastSeenVersion: string) => {
  const lastSeenIndex = changelog.findIndex(entry => entry.version === lastSeenVersion);
  if (lastSeenIndex === -1) return changelog;
  return changelog.slice(0, lastSeenIndex);
};
