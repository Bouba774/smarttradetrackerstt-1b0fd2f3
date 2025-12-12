import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/hooks/useTrades';
import { useAdvancedStats } from '@/hooks/useAdvancedStats';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIChatBot: React.FC = () => {
  const { language } = useLanguage();
  const { trades } = useTrades();
  const { profile } = useAuth();
  const stats = useAdvancedStats(trades);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build real user data from trades and stats
  const userData = useMemo(() => {
    // Get recent trades (last 10)
    const recentTrades = trades.slice(0, 10).map(t => ({
      asset: t.asset,
      direction: t.direction,
      pnl: t.profit_loss || 0,
      setup: t.setup || t.custom_setup || 'N/A',
      emotion: t.emotions || 'N/A',
      result: t.result,
      date: t.trade_date
    }));

    // Calculate most profitable setup
    const setupStats: Record<string, { count: number; profit: number }> = {};
    trades.forEach(t => {
      const setup = t.setup || t.custom_setup || 'Unknown';
      if (!setupStats[setup]) {
        setupStats[setup] = { count: 0, profit: 0 };
      }
      setupStats[setup].count++;
      setupStats[setup].profit += t.profit_loss || 0;
    });
    
    const mostProfitableSetup = Object.entries(setupStats)
      .sort((a, b) => b[1].profit - a[1].profit)[0]?.[0] || 'N/A';

    // Calculate trading hours patterns
    const hourStats: Record<number, { wins: number; losses: number; profit: number }> = {};
    trades.forEach(t => {
      const hour = new Date(t.trade_date).getHours();
      if (!hourStats[hour]) {
        hourStats[hour] = { wins: 0, losses: 0, profit: 0 };
      }
      if (t.result === 'win') hourStats[hour].wins++;
      if (t.result === 'loss') hourStats[hour].losses++;
      hourStats[hour].profit += t.profit_loss || 0;
    });

    const sortedHours = Object.entries(hourStats).sort((a, b) => b[1].profit - a[1].profit);
    const bestHours = sortedHours.slice(0, 2).map(([h]) => `${h}h-${parseInt(h) + 1}h`);
    const worstHours = sortedHours.slice(-2).map(([h]) => `${h}h-${parseInt(h) + 1}h`);

    // Get user level
    const level = profile?.level || 1;
    const levelTitles: Record<number, string> = {
      1: 'Débutant',
      2: 'Intermédiaire',
      3: 'Analyste',
      4: 'Pro',
      5: 'Expert',
      6: 'Légende'
    };
    const userLevel = `${levelTitles[level] || 'Débutant'} (Niveau ${level})`;

    return {
      nickname: profile?.nickname || 'Trader',
      userLevel,
      totalPoints: profile?.total_points || 0,
      stats: {
        totalTrades: stats.totalTrades,
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        breakevenTrades: stats.breakevenTrades,
        buyPositions: stats.buyPositions,
        sellPositions: stats.sellPositions,
        winrate: stats.winrate.toFixed(1),
        netProfit: stats.netProfit.toFixed(2),
        totalProfit: stats.totalProfit.toFixed(2),
        totalLoss: stats.totalLoss.toFixed(2),
        profitFactor: stats.profitFactor.toFixed(2),
        expectancy: stats.expectancy.toFixed(2),
        expectancyPercent: stats.expectancyPercent.toFixed(2),
        avgProfitPerTrade: stats.avgProfitPerTrade.toFixed(2),
        avgLossPerTrade: stats.avgLossPerTrade.toFixed(2),
        avgRiskReward: stats.avgRiskReward.toFixed(2),
        bestProfit: stats.bestProfit.toFixed(2),
        worstLoss: stats.worstLoss.toFixed(2),
        longestWinStreak: stats.longestWinStreak,
        longestLossStreak: stats.longestLossStreak,
        currentStreak: stats.currentStreak,
        maxDrawdown: stats.maxDrawdown.toFixed(2),
        maxDrawdownPercent: stats.maxDrawdownPercent.toFixed(2),
        avgLotSize: stats.avgLotSize.toFixed(2),
        avgTradeDuration: stats.avgTradeDuration,
        totalTimeInPosition: stats.totalTimeInPosition,
      },
      recentTrades,
      bestHours: bestHours.length > 0 ? bestHours : ['N/A'],
      worstHours: worstHours.length > 0 ? worstHours : ['N/A'],
      mostProfitableSetup,
      setupStats: Object.entries(setupStats).map(([setup, data]) => ({
        setup,
        count: data.count,
        profit: data.profit.toFixed(2)
      }))
    };
  }, [trades, stats, profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          userData,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de connexion');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: error instanceof Error ? `❌ ${error.message}` : '❌ Une erreur est survenue.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    streamChat(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
          "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-300 transform origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="glass-card border border-primary/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-gradient-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-primary-foreground text-sm">
                  Assistant IA
                </h3>
                <p className="text-primary-foreground/70 text-xs">
                  Smart Trade Tracker
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  {language === 'fr' ? 'Bonjour! 👋' : 'Hello! 👋'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === 'fr'
                    ? "Je suis votre assistant IA de trading. Posez-moi des questions sur vos performances, demandez des conseils, ou analysons ensemble vos trades!"
                    : "I'm your AI trading assistant. Ask me about your performance, get advice, or let's analyze your trades together!"}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    language === 'fr' ? 'Analyse mes stats' : 'Analyze my stats',
                    language === 'fr' ? 'Conseils du jour' : 'Daily tips',
                    language === 'fr' ? 'Meilleur setup?' : 'Best setup?',
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setInput(suggestion);
                        streamChat(suggestion);
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
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
                      {msg.content || (
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
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
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

          {/* Input */}
          <div className="p-4 border-t border-border bg-background/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'fr' ? 'Posez votre question...' : 'Ask your question...'}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-gradient-primary hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatBot;
