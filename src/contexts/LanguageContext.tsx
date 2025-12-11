import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { fr: 'Accueil', en: 'Home' },
  dashboard: { fr: 'Tableau de Bord', en: 'Dashboard' },
  addTrade: { fr: 'Ajout de Trade', en: 'Add Trade' },
  history: { fr: 'Historique Complet', en: 'Full History' },
  calculator: { fr: 'Calculatrice de Lot', en: 'Lot Calculator' },
  journal: { fr: 'Leçons & Routine', en: 'Lessons & Routine' },
  challenges: { fr: 'Défis', en: 'Challenges' },
  settings: { fr: 'Paramètres', en: 'Settings' },
  profile: { fr: 'Profil', en: 'Profile' },
  reports: { fr: 'Rapports', en: 'Reports' },
  psychology: { fr: 'Analyse Psychologique', en: 'Psychological Analysis' },
  videoJournal: { fr: 'Journal Vidéo/Audio', en: 'Video/Audio Journal' },
  about: { fr: 'À Propos', en: 'About' },
  
  // Home
  welcome: { fr: 'Bienvenue', en: 'Welcome' },
  slogan: { fr: 'Créé par un trader pour les traders. ALPHA FX.', en: 'Created by a trader for traders. ALPHA FX.' },
  startTrading: { fr: 'Commencer à Trader', en: 'Start Trading' },
  viewDashboard: { fr: 'Voir le Dashboard', en: 'View Dashboard' },
  
  // Dashboard
  globalPerformance: { fr: 'Performance Globale', en: 'Global Performance' },
  winrate: { fr: 'Taux de Réussite', en: 'Win Rate' },
  totalPnL: { fr: 'PnL Total', en: 'Total PnL' },
  totalGains: { fr: 'Gains Totaux', en: 'Total Gains' },
  totalLosses: { fr: 'Pertes Totales', en: 'Total Losses' },
  riskReward: { fr: 'Ratio R:R', en: 'R:R Ratio' },
  netProfit: { fr: 'Bénéfice Net', en: 'Net Profit' },
  profitFactor: { fr: 'Facteur de Profit', en: 'Profit Factor' },
  totalTrades: { fr: 'Total Transactions', en: 'Total Trades' },
  winningTrades: { fr: 'Trades Gagnants', en: 'Winning Trades' },
  losingTrades: { fr: 'Trades Perdants', en: 'Losing Trades' },
  buyPositions: { fr: 'Positions Buy', en: 'Buy Positions' },
  sellPositions: { fr: 'Positions Sell', en: 'Sell Positions' },
  breakeven: { fr: 'Break-even', en: 'Break-even' },
  bestProfit: { fr: 'Meilleur Profit', en: 'Best Profit' },
  biggestLoss: { fr: 'Plus Grande Perte', en: 'Biggest Loss' },
  avgProfit: { fr: 'Profit Moyen', en: 'Avg Profit' },
  avgLoss: { fr: 'Perte Moyenne', en: 'Avg Loss' },
  avgTradeSize: { fr: 'Taille Moyenne', en: 'Avg Trade Size' },
  avgDuration: { fr: 'Durée Moyenne', en: 'Avg Duration' },
  discipline: { fr: 'Discipline', en: 'Discipline' },
  emotions: { fr: 'Émotions', en: 'Emotions' },
  riskManagement: { fr: 'Gestion du Risque', en: 'Risk Management' },
  tradeQuality: { fr: 'Qualité des Trades', en: 'Trade Quality' },
  equityCurve: { fr: 'Courbe Equity', en: 'Equity Curve' },
  gainLossChart: { fr: 'Gains/Pertes', en: 'Gains/Losses' },
  heatmap: { fr: 'Heures de Trading', en: 'Trading Hours' },
  monthlyPerformance: { fr: 'Performance Mensuelle', en: 'Monthly Performance' },
  expectancy: { fr: 'Espérance', en: 'Expectancy' },
  winStreak: { fr: 'Série Gagnante', en: 'Win Streak' },
  lossStreak: { fr: 'Série Perdante', en: 'Loss Streak' },
  maxDrawdown: { fr: 'Drawdown Max', en: 'Max Drawdown' },
  totalTime: { fr: 'Temps Total', en: 'Total Time' },
  noDataRecorded: { fr: 'Aucune donnée enregistrée', en: 'No data recorded' },
  startAddingTrades: { fr: 'Commencez à ajouter vos trades', en: 'Start adding your trades' },
  
  // Trade Form
  asset: { fr: 'Actif', en: 'Asset' },
  direction: { fr: 'Direction', en: 'Direction' },
  buy: { fr: 'Acheter', en: 'Buy' },
  sell: { fr: 'Vendre', en: 'Sell' },
  entryPrice: { fr: "Prix d'Entrée", en: 'Entry Price' },
  stopLoss: { fr: 'Stop Loss', en: 'Stop Loss' },
  takeProfit: { fr: 'Take Profit', en: 'Take Profit' },
  lotSize: { fr: 'Taille du Lot', en: 'Lot Size' },
  pnl: { fr: 'PnL', en: 'PnL' },
  risk: { fr: 'Risque', en: 'Risk' },
  setup: { fr: 'Setup', en: 'Setup' },
  timeframe: { fr: 'Timeframe', en: 'Timeframe' },
  emotion: { fr: 'Émotion', en: 'Emotion' },
  calm: { fr: 'Calme', en: 'Calm' },
  stressed: { fr: 'Stressé', en: 'Stressed' },
  confident: { fr: 'Confiant', en: 'Confident' },
  impulsive: { fr: 'Impulsif', en: 'Impulsive' },
  notes: { fr: 'Notes', en: 'Notes' },
  tags: { fr: 'Tags', en: 'Tags' },
  images: { fr: 'Images', en: 'Images' },
  saveTrade: { fr: 'Enregistrer le Trade', en: 'Save Trade' },
  dateTime: { fr: 'Date & Heure', en: 'Date & Time' },
  
  // Calculator
  capital: { fr: 'Capital', en: 'Capital' },
  riskPercent: { fr: 'Risque (%)', en: 'Risk (%)' },
  riskAmount: { fr: 'Montant du Risque', en: 'Risk Amount' },
  slPoints: { fr: 'SL en Points', en: 'SL in Points' },
  tpPoints: { fr: 'TP en Points', en: 'TP in Points' },
  calculatedLot: { fr: 'Taille de Lot Calculée', en: 'Calculated Lot Size' },
  calculate: { fr: 'Calculer', en: 'Calculate' },
  sendToTrade: { fr: 'Envoyer vers Ajout de Trade', en: 'Send to Add Trade' },
  
  // Settings
  theme: { fr: 'Thème', en: 'Theme' },
  dark: { fr: 'Sombre', en: 'Dark' },
  light: { fr: 'Clair', en: 'Light' },
  language: { fr: 'Langue', en: 'Language' },
  vibration: { fr: 'Vibration', en: 'Vibration' },
  notifications: { fr: 'Notifications', en: 'Notifications' },
  journalReminder: { fr: 'Rappel Journal', en: 'Journal Reminder' },
  weeklyReport: { fr: 'Bilan Hebdomadaire', en: 'Weekly Report' },
  overtradingAlert: { fr: 'Alerte Surtrading', en: 'Overtrading Alert' },
  exportData: { fr: 'Exporter les Données', en: 'Export Data' },
  logout: { fr: 'Se Déconnecter', en: 'Logout' },
  deleteAccount: { fr: 'Supprimer le Compte', en: 'Delete Account' },
  displayMode: { fr: "Mode d'affichage", en: 'Display Mode' },
  primaryColor: { fr: 'Couleur principale', en: 'Primary Color' },
  fontSize: { fr: 'Taille de police', en: 'Font Size' },
  sounds: { fr: 'Sons', en: 'Sounds' },
  animations: { fr: 'Animations', en: 'Animations' },
  background: { fr: "Fond d'écran", en: 'Background' },
  resetDisplay: { fr: "Réinitialiser l'affichage", en: 'Reset display' },
  settingUpdated: { fr: 'Paramètre mis à jour', en: 'Setting updated' },
  colorUpdated: { fr: 'Couleur mise à jour', en: 'Color updated' },
  interfaceReset: { fr: 'Interface réinitialisée', en: 'Interface reset' },
  
  // Profile
  myProfile: { fr: 'Mon Profil', en: 'My Profile' },
  manageAccount: { fr: 'Gérez votre compte', en: 'Manage your account' },
  titleLevel: { fr: 'Titre & Niveau', en: 'Title & Level' },
  points: { fr: 'points', en: 'points' },
  actions: { fr: 'Actions', en: 'Actions' },
  changePhoto: { fr: 'Changer la photo', en: 'Change photo' },
  uploading: { fr: 'Téléchargement...', en: 'Uploading...' },
  signOut: { fr: 'Se déconnecter', en: 'Sign out' },
  dangerZone: { fr: 'Zone de danger', en: 'Danger Zone' },
  deleteAllData: { fr: 'Supprimer toutes mes données', en: 'Delete all my data' },
  deleteAccountPermanently: { fr: 'Supprimer définitivement le compte', en: 'Permanently delete account' },
  deleteDataConfirm: { fr: 'Supprimer toutes les données?', en: 'Delete all data?' },
  deleteDataDesc: { fr: 'Cette action supprimera tous vos trades, journaux, routines, vidéos, analyses psychologiques et défis. Votre compte restera actif. Cette action est irréversible.', en: 'This will delete all your trades, journals, routines, videos, psychological analyses and challenges. Your account will remain active. This action is irreversible.' },
  deleteAccountConfirm: { fr: 'Supprimer le compte?', en: 'Delete account?' },
  deleteAccountDesc: { fr: 'Cette action supprimera définitivement votre compte et toutes vos données. Vous ne pourrez plus vous connecter. Cette action est irréversible!', en: 'This will permanently delete your account and all your data. You will no longer be able to sign in. This action is irreversible!' },
  deleteAll: { fr: 'Supprimer tout', en: 'Delete all' },
  dataDeleted: { fr: 'Toutes vos données ont été supprimées', en: 'All your data has been deleted' },
  accountDeleted: { fr: 'Compte supprimé. Au revoir!', en: 'Account deleted. Goodbye!' },
  exportJSON: { fr: 'Exporter en JSON', en: 'Export as JSON' },
  exportCSV: { fr: 'Exporter en CSV', en: 'Export as CSV' },
  exportSuccess: { fr: 'Données exportées avec succès', en: 'Data exported successfully' },
  exportError: { fr: "Erreur lors de l'exportation", en: 'Export error' },
  noDataToExport: { fr: 'Aucune donnée à exporter', en: 'No data to export' },
  
  // Journal
  selectDate: { fr: 'Sélectionner une date', en: 'Select a date' },
  preMarketChecklist: { fr: 'Check-list Pré-Marché', en: 'Pre-Market Checklist' },
  completed: { fr: 'complété', en: 'completed' },
  todaysObjectives: { fr: 'Objectifs du Jour', en: "Today's Objectives" },
  lessonsLearned: { fr: 'Leçons Apprises', en: 'Lessons Learned' },
  commonMistakes: { fr: 'Erreurs Récurrentes', en: 'Common Mistakes' },
  strengths: { fr: 'Points Forts', en: 'Strengths' },
  dayRating: { fr: 'Évaluation de la Journée', en: 'Day Rating' },
  saveJournal: { fr: 'Enregistrer le journal', en: 'Save journal' },
  journalSaved: { fr: 'Journal enregistré!', en: 'Journal saved!' },
  mustBeLoggedIn: { fr: 'Vous devez être connecté', en: 'You must be logged in' },
  addItem: { fr: 'Ajouter un élément', en: 'Add item' },
  newItem: { fr: 'Nouvel élément...', en: 'New item...' },
  labelEmpty: { fr: 'Le libellé ne peut pas être vide', en: 'Label cannot be empty' },
  dailyRoutine: { fr: 'Routine quotidienne et leçons apprises', en: 'Daily routine and lessons learned' },
  reviewPastData: { fr: 'Revoir les données passées', en: 'Review past data' },
  
  // Video Journal
  videoAudioJournal: { fr: 'Journal Vidéo/Audio', en: 'Video/Audio Journal' },
  recordFeelings: { fr: 'Enregistrez votre ressenti du jour (max 60s)', en: 'Record your daily feelings (max 60s)' },
  newRecording: { fr: 'Nouvel Enregistrement', en: 'New Recording' },
  recordVideo: { fr: 'Enregistrer Vidéo', en: 'Record Video' },
  recordAudio: { fr: 'Enregistrer Audio', en: 'Record Audio' },
  stop: { fr: 'Arrêter', en: 'Stop' },
  switchCamera: { fr: 'Changer Caméra', en: 'Switch Camera' },
  frontCamera: { fr: 'Avant', en: 'Front' },
  backCamera: { fr: 'Arrière', en: 'Back' },
  freeNote: { fr: 'Note libre (optionnelle)', en: 'Free note (optional)' },
  addNote: { fr: 'Ajoutez une note à cet enregistrement...', en: 'Add a note to this recording...' },
  recordingSaved: { fr: 'Enregistrement sauvegardé!', en: 'Recording saved!' },
  recordingDeleted: { fr: 'Enregistrement supprimé', en: 'Recording deleted' },
  cameraError: { fr: "Erreur d'accès à la caméra/micro. Veuillez autoriser l'accès.", en: 'Error accessing camera/microphone. Please allow access.' },
  fileNotAvailable: { fr: 'Fichier non disponible (session expirée)', en: 'File not available (session expired)' },
  myRecordings: { fr: 'Mes Enregistrements', en: 'My Recordings' },
  noRecordings: { fr: 'Aucun enregistrement', en: 'No recordings' },
  startRecording: { fr: 'Commencez à enregistrer', en: 'Start recording' },
  noteUpdated: { fr: 'Note mise à jour', en: 'Note updated' },
  
  // Common
  save: { fr: 'Enregistrer', en: 'Save' },
  cancel: { fr: 'Annuler', en: 'Cancel' },
  edit: { fr: 'Modifier', en: 'Edit' },
  delete: { fr: 'Supprimer', en: 'Delete' },
  filter: { fr: 'Filtrer', en: 'Filter' },
  search: { fr: 'Rechercher', en: 'Search' },
  noData: { fr: 'Aucune donnée', en: 'No data' },
  loading: { fr: 'Chargement...', en: 'Loading...' },
  error: { fr: 'Erreur', en: 'Error' },
  success: { fr: 'Succès', en: 'Success' },
  level: { fr: 'Niveau', en: 'Level' },
  
  // Levels
  beginner: { fr: 'Débutant', en: 'Beginner' },
  intermediate: { fr: 'Intermédiaire', en: 'Intermediate' },
  analyst: { fr: 'Analyste', en: 'Analyst' },
  pro: { fr: 'Pro', en: 'Pro' },
  expert: { fr: 'Expert', en: 'Expert' },
  legend: { fr: 'Légende', en: 'Legend' },
  
  // Challenges
  challengesTitle: { fr: 'Défis', en: 'Challenges' },
  challengesDesc: { fr: 'Relevez des défis pour progresser', en: 'Complete challenges to progress' },
  
  // Reports
  reportsTitle: { fr: 'Rapports', en: 'Reports' },
  reportsDesc: { fr: 'Analysez vos performances', en: 'Analyze your performance' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
