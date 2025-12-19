import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Loader2, AlertTriangle, TrendingUp, TrendingDown, Sparkles, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EconomicEvent {
  id: string;
  event: string;
  currency: string;
  time: string;
  forecast: string;
  previous: string;
}

interface AIAnalysis {
  eventId: string;
  scenarios: {
    aboveForecast: {
      impact: string;
      affectedAssets: string[];
      probability: number;
    };
    belowForecast: {
      impact: string;
      affectedAssets: string[];
      probability: number;
    };
  };
  macroContext: string;
}

// Mock events for AI analysis
const mockEvents: EconomicEvent[] = [
  { id: '1', event: 'Décision taux Fed (FOMC)', currency: 'USD', time: '14:00', forecast: '5.50%', previous: '5.50%' },
  { id: '2', event: 'IPC Zone Euro (YoY)', currency: 'EUR', time: '11:00', forecast: '2.8%', previous: '2.9%' },
  { id: '3', event: 'NFP - Emplois non agricoles', currency: 'USD', time: '14:30', forecast: '180K', previous: '216K' },
];

// Mock AI analysis
const mockAnalyses: Record<string, AIAnalysis> = {
  '1': {
    eventId: '1',
    scenarios: {
      aboveForecast: {
        impact: 'Renforcement du Dollar, pression sur l\'or et les actions. Les rendements obligataires pourraient grimper.',
        affectedAssets: ['DXY ↑', 'XAUUSD ↓', 'SP500 ↓', 'EURUSD ↓'],
        probability: 35,
      },
      belowForecast: {
        impact: 'Affaiblissement du Dollar, rally des actifs risqués. L\'or et le Bitcoin pourraient s\'apprécier.',
        affectedAssets: ['DXY ↓', 'XAUUSD ↑', 'BTC ↑', 'SP500 ↑'],
        probability: 25,
      },
    },
    macroContext: 'L\'inflation reste persistante à 3.1%. Le marché du travail montre des signes de ralentissement modéré. La Fed devrait maintenir son stance hawkish tout en laissant la porte ouverte à des baisses en 2025.',
  },
  '2': {
    eventId: '2',
    scenarios: {
      aboveForecast: {
        impact: 'Renforcement de l\'Euro, la BCE pourrait retarder les baisses de taux.',
        affectedAssets: ['EURUSD ↑', 'DAX ↓', 'Bunds ↓'],
        probability: 40,
      },
      belowForecast: {
        impact: 'Affaiblissement de l\'Euro, anticipations de politique plus accommodante.',
        affectedAssets: ['EURUSD ↓', 'DAX ↑', 'CAC40 ↑'],
        probability: 30,
      },
    },
    macroContext: 'L\'inflation en zone euro continue de décélérer mais reste au-dessus de la cible de 2%. La croissance économique stagne.',
  },
  '3': {
    eventId: '3',
    scenarios: {
      aboveForecast: {
        impact: 'Dollar fort, marché du travail robuste = moins de baisses de taux.',
        affectedAssets: ['DXY ↑', 'USDJPY ↑', 'Actions ↓'],
        probability: 45,
      },
      belowForecast: {
        impact: 'Dollar faible, anticipations de pivot Fed = risk-on.',
        affectedAssets: ['DXY ↓', 'XAUUSD ↑', 'Actions ↑', 'BTC ↑'],
        probability: 35,
      },
    },
    macroContext: 'Le marché du travail américain reste résilient malgré les hausses de taux agressives. Les secteurs cycliques montrent des faiblesses.',
  },
};

const AIEconomicPrediction: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium] = useState(true); // Mock premium status

  const analyzeEvent = async (eventId: string) => {
    setSelectedEvent(eventId);
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Use mock data
    const mockAnalysis = mockAnalyses[eventId];
    if (mockAnalysis) {
      setAnalysis(mockAnalysis);
    }
    
    setIsLoading(false);
  };

  if (!isPremium) {
    return (
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Fonctionnalité Premium</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Accédez aux prédictions IA et analyses macro-économiques avancées.
          </p>
          <Button>Passer Premium</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Brain className="h-5 w-5 text-primary" />
          Prédictions IA - Impact Économique
          <Badge variant="secondary" className="ml-auto text-xs bg-primary/20 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {mockEvents.map((event) => (
            <Button
              key={event.id}
              variant={selectedEvent === event.id ? 'default' : 'outline'}
              size="sm"
              className="h-auto py-2 px-3 text-left flex-col items-start"
              onClick={() => analyzeEvent(event.id)}
              disabled={isLoading}
            >
              <span className="font-medium text-xs truncate w-full">{event.event}</span>
              <span className="text-xs text-muted-foreground">{event.currency} • {event.time}</span>
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Analyse en cours...</span>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && !isLoading && (
          <div className="space-y-4">
            {/* Macro Context */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Contexte Macro-économique
              </h4>
              <p className="text-xs text-muted-foreground">{analysis.macroContext}</p>
            </div>

            {/* Scenarios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Above Forecast */}
              <div className="p-4 rounded-lg bg-profit/5 border border-profit/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm flex items-center gap-2 text-profit">
                    <TrendingUp className="h-4 w-4" />
                    Si résultat &gt; prévision
                  </h4>
                  <Badge className="text-xs bg-profit/20 text-profit border-profit/30">
                    {analysis.scenarios.aboveForecast.probability}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {analysis.scenarios.aboveForecast.impact}
                </p>
                <div className="flex flex-wrap gap-1">
                  {analysis.scenarios.aboveForecast.affectedAssets.map((asset, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Below Forecast */}
              <div className="p-4 rounded-lg bg-loss/5 border border-loss/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm flex items-center gap-2 text-loss">
                    <TrendingDown className="h-4 w-4" />
                    Si résultat &lt; prévision
                  </h4>
                  <Badge className="text-xs bg-loss/20 text-loss border-loss/30">
                    {analysis.scenarios.belowForecast.probability}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {analysis.scenarios.belowForecast.impact}
                </p>
                <div className="flex flex-wrap gap-1">
                  {analysis.scenarios.belowForecast.affectedAssets.map((asset, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-yellow-500">Avertissement:</strong> Ces analyses sont générées par IA et constituent uniquement une aide à la décision. 
                Elles ne garantissent pas les résultats futurs et ne doivent pas être considérées comme des conseils financiers.
              </p>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!selectedEvent && !isLoading && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Sélectionnez un événement économique pour obtenir une analyse IA détaillée
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIEconomicPrediction;
