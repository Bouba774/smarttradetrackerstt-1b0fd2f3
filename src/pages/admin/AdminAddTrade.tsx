import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Lock } from 'lucide-react';

const AdminAddTrade: React.FC = () => {
  const { selectedUser } = useAdmin();
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {language === 'fr' ? 'Accès en lecture seule' : 'Read-Only Access'}
      </h2>
      <p className="text-muted-foreground max-w-md mb-4">
        {language === 'fr' 
          ? 'Les administrateurs ne peuvent pas ajouter ou modifier des trades. Cette restriction garantit l\'intégrité des données utilisateur.' 
          : 'Administrators cannot add or modify trades. This restriction ensures user data integrity.'}
      </p>
      {selectedUser && (
        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">
            {language === 'fr' ? 'Utilisateur sélectionné:' : 'Selected user:'}{' '}
            <span className="font-medium text-foreground">{selectedUser.nickname}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminAddTrade;
