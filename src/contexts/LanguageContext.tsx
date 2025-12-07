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
  addTrade: { fr: 'Ajouter Trade', en: 'Add Trade' },
  history: { fr: 'Historique', en: 'History' },
  calculator: { fr: 'Calculatrice', en: 'Calculator' },
  journal: { fr: 'Journal', en: 'Journal' },
  challenges: { fr: 'Défis', en: 'Challenges' },
  settings: { fr: 'Paramètres', en: 'Settings' },
  profile: { fr: 'Profil', en: 'Profile' },
  
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
  
  // Common
  save: { fr: 'Enregistrer', en: 'Save' },
  cancel: { fr: 'Annuler', en: 'Cancel' },
  edit: { fr: 'Modifier', en: 'Edit' },
  delete: { fr: 'Supprimer', en: 'Delete' },
  filter: { fr: 'Filtrer', en: 'Filter' },
  search: { fr: 'Rechercher', en: 'Search' },
  noData: { fr: 'Aucune donnée', en: 'No data' },
  loading: { fr: 'Chargement...', en: 'Loading...' },
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
