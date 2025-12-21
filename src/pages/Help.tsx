import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Copy, Check, HelpCircle, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Help = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { categories, isLoading } = useHelpArticles();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Filter articles based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    
    return categories
      .map(category => ({
        ...category,
        articles: category.articles.filter(
          article =>
            article.question.toLowerCase().includes(query) ||
            article.answer.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.articles.length > 0);
  }, [categories, searchQuery]);

  const handleCopyAnswer = async (id: string, answer: string) => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopiedId(id);
      toast.success(t('answerCopied') || 'Réponse copiée');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(t('copyFailed') || 'Échec de la copie');
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast.error(t('feedbackEmpty') || 'Veuillez entrer votre message');
      return;
    }
    
    setIsSending(true);
    try {
      // Simulate sending - in production this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t('feedbackSent') || 'Message envoyé avec succès');
      setFeedbackMessage('');
      setShowFeedback(false);
    } catch {
      toast.error(t('feedbackError') || 'Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-profit" />
              <h1 className="text-xl md:text-2xl font-bold">
                {t('helpTitle') || 'Aide'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchHelp') || 'Rechercher une question...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-primary">
              {t('loading') || 'Chargement...'}
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? t('noResultsFound') || 'Aucun résultat trouvé'
                : t('noArticles') || 'Aucun article disponible'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {filteredCategories.map((category) => (
              <div key={category.key} className="glass-card p-4 md:p-6">
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    {category.name}
                  </h2>
                </div>

                {/* Questions Accordion */}
                <Accordion type="single" collapsible className="space-y-2">
                  {category.articles.map((article) => (
                    <AccordionItem
                      key={article.id}
                      value={article.id}
                      className="border border-border rounded-lg px-4 bg-secondary/30"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-start gap-2 text-left">
                          <span className="text-profit font-bold shrink-0">?</span>
                          <span className="font-medium text-sm md:text-base">
                            {article.question}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="pl-5 space-y-3">
                          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                            {article.answer}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAnswer(article.id, article.answer)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {copiedId === article.id ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                {t('copied') || 'Copié'}
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                {t('copyAnswer') || 'Copier la réponse'}
                              </>
                            )}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Section */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-profit" />
                <h2 className="text-lg md:text-xl font-semibold text-foreground">
                  {t('feedbackTitle') || 'Vous n\'avez pas trouvé de réponse ?'}
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeedback(!showFeedback)}
                className="text-profit border-profit hover:bg-profit/10"
              >
                {showFeedback 
                  ? (t('hide') || 'Masquer') 
                  : (t('contactUs') || 'Nous contacter')}
              </Button>
            </div>

            {showFeedback && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-muted-foreground text-sm">
                  {t('feedbackDescription') || 'Décrivez votre question ou problème et nous vous répondrons dans les plus brefs délais.'}
                </p>
                
                {user && (
                  <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                    <span className="font-medium">{t('email') || 'Email'} : </span>
                    {user.email}
                  </div>
                )}

                <Textarea
                  placeholder={t('feedbackPlaceholder') || 'Décrivez votre question ou problème...'}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="min-h-[120px] bg-secondary/30 border-border resize-none"
                  disabled={isSending}
                />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSendFeedback}
                    disabled={isSending || !feedbackMessage.trim()}
                    className="bg-profit hover:bg-profit/90 text-white"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        {t('sending') || 'Envoi...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t('sendFeedback') || 'Envoyer'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;
