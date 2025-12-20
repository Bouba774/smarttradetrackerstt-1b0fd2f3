import React, { useState, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, User, Mail, Calendar, X, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const AdminUserSelector: React.FC = () => {
  const { allUsers, selectedUser, setSelectedUser, isLoadingUsers, refreshUsers } = useAdmin();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const dateLocale = language === 'fr' ? fr : enUS;

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;
    const query = searchQuery.toLowerCase();
    return allUsers.filter(
      user =>
        user.email.toLowerCase().includes(query) ||
        user.nickname.toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

  const handleSelectUser = (user: typeof allUsers[0]) => {
    setSelectedUser(user);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
  };

  return (
    <div className="bg-card/50 border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            {language === 'fr' ? 'Sélectionner un utilisateur' : 'Select a User'}
          </h3>
          <Badge variant="outline" className="text-xs">
            {allUsers.length} {language === 'fr' ? 'utilisateurs' : 'users'}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={refreshUsers} disabled={isLoadingUsers}>
          {isLoadingUsers ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            language === 'fr' ? 'Actualiser' : 'Refresh'
          )}
        </Button>
      </div>

      {/* Selected User Display */}
      {selectedUser && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src={selectedUser.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {selectedUser.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{selectedUser.nickname}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClearSelection}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'fr' ? 'Rechercher par email ou pseudo...' : 'Search by email or nickname...'}
          className="pl-10"
        />
      </div>

      {/* User List */}
      <ScrollArea className="h-64">
        {isLoadingUsers ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <User className="w-8 h-8 mb-2" />
            <p className="text-sm">
              {language === 'fr' ? 'Aucun utilisateur trouvé' : 'No users found'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full p-3 rounded-lg border transition-all text-left ${
                  selectedUser?.id === user.id
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-secondary/30 border-border hover:bg-secondary/50 hover:border-primary/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                      {user.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{user.nickname}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: dateLocale })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default AdminUserSelector;
