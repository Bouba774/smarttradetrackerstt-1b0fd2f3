import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminPagePlaceholderProps {
  pageName: string;
}

const AdminPagePlaceholder: React.FC<AdminPagePlaceholderProps> = ({ pageName }) => {
  const { selectedUser } = useAdmin();
  const { language } = useLanguage();

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {language === 'fr' ? 'Aucun utilisateur sélectionné' : 'No User Selected'}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {language === 'fr' 
            ? `Veuillez sélectionner un utilisateur ci-dessus pour consulter son ${pageName}.` 
            : `Please select a user above to view their ${pageName}.`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
        <Eye className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {language === 'fr' ? 'Mode consultation' : 'View Mode'}
      </h2>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="border-primary/50">
          {selectedUser.nickname}
        </Badge>
        <span className="text-muted-foreground text-sm">{selectedUser.email}</span>
      </div>
      <p className="text-muted-foreground max-w-md">
        {language === 'fr' 
          ? `Consultation du ${pageName} de l'utilisateur sélectionné. Les données sont en lecture seule.` 
          : `Viewing ${pageName} for the selected user. Data is read-only.`}
      </p>
    </div>
  );
};

export default AdminPagePlaceholder;
