import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  MessageCircle, X, Send, Bot, User, Loader2, Sparkles, 
  ImagePlus, XCircle, History, Plus, Trash2, ChevronLeft 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/hooks/useTrades';
import { useTraderUserData } from '@/hooks/useTraderUserData';
import { useAIConversations } from '@/hooks/useAIConversations';
import { useAuth } from '@/contexts/AuthContext';
import { streamChat, fileToBase64, createImageMessage, MessageContent } from '@/lib/chatStream';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

const AIChatBot: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { trades } = useTrades();
  const userData = useTraderUserData(trades);
  const {
    conversations,
    currentConversationId,
    messages: savedMessages,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    selectConversation,
    deleteConversation,
    startNewConversation
  } = useAIConversations();

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync saved messages to local state when conversation changes
  useEffect(() => {
    const converted: ChatMessage[] = savedMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.image_url 
        ? [
            { type: 'image_url' as const, image_url: { url: msg.image_url } },
            { type: 'text' as const, text: msg.content }
          ]
        : msg.content
    }));
    setLocalMessages(converted);
  }, [savedMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  useEffect(() => {
    if (isOpen && inputRef.current && !showHistory) {
      inputRef.current.focus();
    }
  }, [isOpen, showHistory]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const preview = await fileToBase64(file);
      setImagePreview(preview);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStreamChat = async (userMessage: string, imageFile?: File | null) => {
    if (!user) return;

    let conversationId = currentConversationId;
    
    // Create new conversation if needed
    if (!conversationId) {
      conversationId = await createConversation();
      if (!conversationId) return;
    }

    let messageContent: string | MessageContent[];
    let imageUrl: string | null = null;
    
    if (imageFile) {
      imageUrl = await fileToBase64(imageFile);
      messageContent = await createImageMessage(userMessage, imageFile);
    } else {
      messageContent = userMessage;
    }
    
    // Add user message to local state
    const newMessages: ChatMessage[] = [...localMessages, { role: 'user', content: messageContent }];
    setLocalMessages(newMessages);
    setIsLoading(true);
    clearSelectedImage();

    // Save user message to database
    await addMessage('user', userMessage, imageUrl);

    let assistantContent = '';

    await streamChat({
      messages: newMessages,
      userData,
      language,
      onStart: () => {
        setLocalMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      },
      onDelta: (content) => {
        assistantContent = content;
        setLocalMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content };
          return updated;
        });
      },
      onError: (error) => {
        const errorMsg = `❌ ${error.message}`;
        setLocalMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: errorMsg };
          return updated;
        });
        // Save error message
        addMessage('assistant', errorMsg);
      },
      onDone: () => {
        setIsLoading(false);
        // Save final assistant message
        if (assistantContent) {
          addMessage('assistant', assistantContent);
        }
      },
    });
  };

  const handleSend = () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    const message = input.trim() || (selectedImage ? 'Analyse cette image' : '');
    setInput('');
    handleStreamChat(message, selectedImage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageText = (content: string | MessageContent[]): string => {
    if (typeof content === 'string') return content;
    const textContent = content.find(c => c.type === 'text');
    return textContent?.text || '';
  };

  const getMessageImage = (content: string | MessageContent[]): string | null => {
    if (typeof content === 'string') return null;
    const imageContent = content.find(c => c.type === 'image_url');
    return imageContent?.image_url?.url || null;
  };

  const handleNewConversation = () => {
    startNewConversation();
    setLocalMessages([]);
    setShowHistory(false);
  };

  const handleSelectConversation = async (convId: string) => {
    await selectConversation(convId);
    setShowHistory(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    await deleteConversation(convId);
  };

  const suggestions = [
    t('chat.suggestions.analyzeStats'),
    t('chat.suggestions.dailyTips'),
    t('chat.suggestions.bestSetup'),
  ];

  const dateLocale = language === 'fr' ? fr : enUS;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-primary hover:scale-110 flex items-center justify-center",
          "animate-pulse-slow shadow-neon",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label="Open AI Chat"
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] transform origin-bottom-right",
          "transition-all duration-500 ease-out",
          isOpen 
            ? "scale-100 opacity-100 translate-y-0" 
            : "scale-75 opacity-0 translate-y-8 pointer-events-none"
        )}
      >
        <div className={cn(
          "glass-card border border-primary/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[550px]",
          "transition-shadow duration-500",
          isOpen && "shadow-neon"
        )}>
          {/* Header */}
          <div className="bg-gradient-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showHistory && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(false)}
                  className="text-primary-foreground hover:bg-white/20 -ml-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-primary-foreground text-sm">
                  {showHistory ? t('chat.history') || 'Historique' : t('chat.title')}
                </h3>
                <p className="text-primary-foreground/70 text-xs">
                  {showHistory 
                    ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`
                    : 'Expert Trading & Application'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!showHistory && user && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewConversation}
                    className="text-primary-foreground hover:bg-white/20"
                    title="Nouvelle conversation"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory(true)}
                    className="text-primary-foreground hover:bg-white/20"
                    title="Historique"
                  >
                    <History className="w-5 h-5" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* History View */}
          {showHistory ? (
            <ScrollArea className="flex-1 p-4">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <History className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-sm">
                    Aucune conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all group",
                        "hover:bg-primary/10 border border-transparent hover:border-primary/20",
                        currentConversationId === conv.id && "bg-primary/10 border-primary/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.updated_at), 'PPp', { locale: dateLocale })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {localMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-display font-semibold text-foreground mb-2">
                      {t('chat.greeting')}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('chat.intro')}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mb-4">
                      💡 Je peux analyser tes graphiques ! Envoie-moi une image.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setInput(suggestion);
                            handleStreamChat(suggestion);
                          }}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {localMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-2",
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary text-foreground rounded-bl-md'
                          )}
                        >
                          {/* Show image if present */}
                          {getMessageImage(msg.content) && (
                            <img 
                              src={getMessageImage(msg.content)!} 
                              alt="Uploaded" 
                              className="max-w-full rounded-lg mb-2 max-h-32 object-cover"
                            />
                          )}
                          {/* Show text */}
                          {(typeof msg.content === 'string' ? msg.content : getMessageText(msg.content)) || (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && localMessages[localMessages.length - 1]?.role === 'user' && (
                      <div className="flex gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Image Preview */}
              {imagePreview && (
                <div className="px-4 py-2 border-t border-border bg-background/50">
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-20 rounded-lg border border-border"
                    />
                    <button
                      onClick={clearSelectedImage}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border bg-background/50">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="shrink-0"
                    title="Envoyer une image"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedImage ? "Décris ce que tu veux analyser..." : t('chat.placeholder')}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    size="icon"
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AIChatBot;
