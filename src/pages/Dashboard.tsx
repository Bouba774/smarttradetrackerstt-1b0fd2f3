import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenges } from '@/hooks/useChallenges';
import { useTrades } from '@/hooks/useTrades';
import { useAdvancedStats } from '@/hooks/useAdvancedStats';
import { useCurrency } from '@/hooks/useCurrency';
import { APP_VERSION } from '@/lib/version';
import StatCard from '@/components/ui/StatCard';
import GaugeChart from '@/components/ui/GaugeChart';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Activity,
  Clock,
  Percent,
  Scale,
  Calendar,
  ArrowUpDown,
  Zap,
  Timer,
  Trophy,
  AlertTriangle,
  Layers,
  Flame,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { currentLevel } = useChallenges();
  const { trades, isLoading } = useTrades();
  const stats = useAdvancedStats(trades);
  const { formatAmount } = useCurrency();

  // User profile from auth
  const userNickname = profile?.nickname || 'Trader';
  const userLevel = profile?.level || 1;
  const levelTitle = language === 'fr' ? currentLevel.title : currentLevel.titleEn;

  // Generate equity curve data from trades (with default empty chart data)
  const equityData = React.useMemo(() => {
    if (trades.length === 0) {
      return [
        { date: 'J1', value: 10000 },
        { date: 'J2', value: 10000 },
        { date: 'J3', value: 10000 },
      ];
    }
    
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );
    
    let runningTotal = 10000; // Starting capital
    return sortedTrades.slice(-15).map((trade) => {
      runningTotal += trade.profit_loss || 0;
      return {
        date: format(parseISO(trade.trade_date), 'dd/MM', { locale: fr }),
        value: runningTotal,
      };
    });
  }, [trades]);

  // Generate monthly data (with default empty data)
  const monthlyData = React.useMemo(() => {
    if (trades.length === 0) {
      return [
        { month: 'Jan', pnl: 0, wins: 0, losses: 0 },
        { month: 'Fév', pnl: 0, wins: 0, losses: 0 },
        { month: 'Mar', pnl: 0, wins: 0, losses: 0 },
      ];
    }
    const months: { [key: string]: { pnl: number; wins: number; losses: number } } = {};
    trades.forEach(trade => {
      const monthKey = format(parseISO(trade.trade_date), 'MMM', { locale: fr });
      if (!months[monthKey]) {
        months[monthKey] = { pnl: 0, wins: 0, losses: 0 };
      }
      months[monthKey].pnl += trade.profit_loss || 0;
      if (trade.result === 'win') months[monthKey].wins++;
      if (trade.result === 'loss') months[monthKey].losses++;
    });
    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  }, [trades]);

  // Position distribution data (always show, even with 0 values)
  const positionData = [
    { name: t('longPositions'), value: stats.buyPositions || 0.1, actualValue: stats.buyPositions, color: 'hsl(var(--profit))' },
    { name: t('shortPositions'), value: stats.sellPositions || 0.1, actualValue: stats.sellPositions, color: 'hsl(var(--loss))' },
  ];

  // Results distribution
  const resultsData = [
    { name: t('winners'), value: stats.winningTrades || 0.1, actualValue: stats.winningTrades, color: 'hsl(var(--profit))' },
    { name: t('losers'), value: stats.losingTrades || 0.1, actualValue: stats.losingTrades, color: 'hsl(var(--loss))' },
    { name: t('breakeven'), value: stats.breakevenTrades || 0.1, actualValue: stats.breakevenTrades, color: 'hsl(var(--muted-foreground))' },
  ];

  // Radar chart data for performance overview
  const radarData = [
    { subject: t('winrate'), A: Math.min(100, stats.winrate), fullMark: 100 },
    { subject: t('profitFactor'), A: Math.min(100, stats.profitFactor * 25), fullMark: 100 },
    { subject: t('riskReward'), A: Math.min(100, stats.avgRiskReward * 25), fullMark: 100 },
    { subject: t('consistency'), A: stats.longestWinStreak > 0 ? Math.min(100, stats.longestWinStreak * 15) : 0, fullMark: 100 },
    { subject: t('riskManagement'), A: Math.max(0, 100 - stats.maxDrawdownPercent), fullMark: 100 },
  ];

  // No data message component
  const NoDataMessage = () => (
    <div className="text-center py-4 px-2 bg-muted/30 rounded-lg border border-border/50 mb-4">
      <p className="text-sm text-muted-foreground">
        {t('noDataYet')}
      </p>
    </div>
  );

  // Section header component
  const SectionHeader = ({ icon: Icon, title, delay = 0 }: { icon: any; title: string; delay?: number }) => (
    <div 
      className="flex items-center gap-2 mb-4 animate-fade-in" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
    </div>
  );

  return (
    <div className="space-y-6 py-4 w-full max-w-full overflow-x-hidden">
      {/* Welcome Message */}
      <div className="glass-card p-4 sm:p-6 animate-fade-in bg-gradient-to-r from-primary/10 to-profit/10 border-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">
              {t('welcome')} {userNickname} 👋
            </h1>
            <p className="text-primary font-display font-semibold mt-1 neon-text text-sm sm:text-base">
              {levelTitle} ({t('level')} {userLevel})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
              <span className="text-xl sm:text-2xl">🏆</span>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{t('level')}</p>
                <p className="font-display font-bold text-primary text-sm sm:text-base">{userLevel}</p>
              </div>
            </div>
            {stats.currentStreak.count > 0 && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                stats.currentStreak.type === 'win' 
                  ? 'bg-profit/20 border-profit/30' 
                  : 'bg-loss/20 border-loss/30'
              }`}>
                <Flame className={`w-5 h-5 ${stats.currentStreak.type === 'win' ? 'text-profit' : 'text-loss'}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('streak')}</p>
                  <p className={`font-bold text-sm ${stats.currentStreak.type === 'win' ? 'text-profit' : 'text-loss'}`}>
                    {stats.currentStreak.count} {stats.currentStreak.type === 'win' ? 'W' : 'L'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* No data message */}
      {trades.length === 0 && <NoDataMessage />}

      {/* Section: Statistiques Principales */}
      <div>
        <SectionHeader icon={Activity} title={t('mainStatistics')} delay={100} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            title={t('totalTransactions')}
            value={stats.totalTrades}
            icon={Activity}
            delay={150}
          />
          <StatCard
            title={t('winningTransactions')}
            value={stats.winningTrades}
            icon={TrendingUp}
            variant="profit"
            delay={200}
          />
          <StatCard
            title={t('losingTransactions')}
            value={stats.losingTrades}
            icon={TrendingDown}
            variant="loss"
            delay={250}
          />
          <StatCard
            title={t('victoryRate')}
            value={`${stats.winrate.toFixed(1)}%`}
            icon={Target}
            variant={stats.winrate >= 50 ? 'profit' : 'loss'}
            delay={300}
          />
          <StatCard
            title={t('breakeven')}
            value={stats.breakevenTrades}
            icon={ArrowUpDown}
            variant="neutral"
            delay={350}
          />
        </div>
      </div>

      {/* Section: Positions */}
      <div>
        <SectionHeader icon={ArrowUpDown} title={t('positions')} delay={400} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            title={t('buyPositions')}
            value={stats.buyPositions}
            icon={TrendingUp}
            variant="profit"
            delay={450}
          />
          <StatCard
            title={t('sellPositions')}
            value={stats.sellPositions}
            icon={TrendingDown}
            variant="loss"
            delay={500}
          />
          <StatCard
            title={t('avgLotSize')}
            value={stats.avgLotSize.toFixed(2)}
            icon={Layers}
            delay={550}
          />
          <StatCard
            title={t('pending')}
            value={stats.pendingTrades}
            icon={Clock}
            variant="neutral"
            delay={600}
          />
        </div>
      </div>

      {/* Section: Profits & Pertes */}
      <div>
        <SectionHeader icon={DollarSign} title={t('profitsAndLosses')} delay={650} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title={t('bestProfit')}
            value={formatAmount(stats.bestProfit)}
            icon={Trophy}
            variant="profit"
            delay={700}
          />
          <StatCard
            title={t('worstLoss')}
            value={formatAmount(stats.worstLoss)}
            icon={AlertTriangle}
            variant="loss"
            delay={750}
          />
          <StatCard
            title={t('avgProfitPerTrade')}
            value={formatAmount(stats.avgProfitPerTrade)}
            icon={TrendingUp}
            variant="profit"
            delay={800}
          />
          <StatCard
            title={t('avgLossPerTrade')}
            value={formatAmount(stats.avgLossPerTrade)}
            icon={TrendingDown}
            variant="loss"
            delay={850}
          />
          <StatCard
            title={t('totalProfit')}
            value={formatAmount(stats.totalProfit)}
            icon={DollarSign}
            variant="profit"
            delay={900}
          />
          <StatCard
            title={t('totalLoss')}
            value={formatAmount(stats.totalLoss)}
            icon={DollarSign}
            variant="loss"
            delay={950}
          />
        </div>
      </div>

      {/* Section: Indicateurs de Performance */}
      <div>
        <SectionHeader icon={Zap} title={t('performanceIndicators')} delay={1000} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard
            title={t('netProfit')}
            value={formatAmount(stats.netProfit)}
            icon={DollarSign}
            variant={stats.netProfit >= 0 ? 'profit' : 'loss'}
            delay={1050}
          />
          <StatCard
            title={t('profitFactorLabel')}
            value={stats.profitFactor.toFixed(2)}
            icon={Scale}
            variant={stats.profitFactor >= 1.5 ? 'profit' : stats.profitFactor >= 1 ? 'neutral' : 'loss'}
            delay={1100}
          />
          <StatCard
            title={t('avgRiskReward')}
            value={stats.avgRiskReward.toFixed(2)}
            icon={Scale}
            variant={stats.avgRiskReward >= 1.5 ? 'profit' : stats.avgRiskReward >= 1 ? 'neutral' : 'loss'}
            delay={1150}
          />
          <StatCard
            title={t('avgTradeResult')}
            value={formatAmount(stats.avgTradeResult)}
            icon={BarChart3}
            variant={stats.avgTradeResult >= 0 ? 'profit' : 'loss'}
            delay={1200}
          />
        </div>
      </div>

      {/* Section: Séries & Risque */}
      <div>
        <SectionHeader icon={Flame} title={t('streaks')} delay={1250} />
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title={t('maxWinStreak')}
            value={stats.longestWinStreak}
            icon={Award}
            variant="profit"
            delay={1300}
          />
          <StatCard
            title={t('maxLossStreak')}
            value={stats.longestLossStreak}
            icon={AlertTriangle}
            variant="loss"
            delay={1350}
          />
        </div>
      </div>

      {/* Section: Durée */}
      <div>
        <SectionHeader icon={Timer} title={t('tradeDuration')} delay={1400} />
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title={t('avgTradeDuration')}
            value={stats.avgTradeDuration}
            icon={Clock}
            delay={1450}
          />
          <StatCard
            title={t('totalTimeInPosition')}
            value={stats.totalTimeInPosition}
            icon={Timer}
            delay={1500}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="glass-card p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '1750ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            {t('equityCurve')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatAmount(value), 'Capital']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="glass-card p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '1800ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t('monthlyPerformance')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'pnl' ? formatAmount(value) : value,
                    name === 'pnl' ? 'P&L' : name === 'wins' ? t('winners') : t('losers')
                  ]}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Position Distribution */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '1850ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-primary" />
            {t('positionDistribution')}
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {positionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string, props: any) => [props.payload.actualValue, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-profit" />
              <span className="text-sm text-muted-foreground">{t('longPositions')} ({stats.buyPositions})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-loss" />
              <span className="text-sm text-muted-foreground">{t('shortPositions')} ({stats.sellPositions})</span>
            </div>
          </div>
        </div>

        {/* Results Distribution */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '1900ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {t('resultsLabel')}
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resultsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resultsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string, props: any) => [props.payload.actualValue, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-profit" />
              <span className="text-xs text-muted-foreground">{t('winners')} ({stats.winningTrades})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-loss" />
              <span className="text-xs text-muted-foreground">{t('losers')} ({stats.losingTrades})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('breakeven')} ({stats.breakevenTrades})</span>
            </div>
          </div>
        </div>

        {/* Radar Performance */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '1950ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {t('overview')}
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gauges */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '2000ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          {t('keyIndicators')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center">
          <GaugeChart
            value={Math.min(100, stats.winrate)}
            label={t('winrate')}
            variant={stats.winrate >= 60 ? 'profit' : stats.winrate >= 40 ? 'primary' : 'loss'}
          />
          <GaugeChart
            value={Math.min(100, stats.profitFactor * 25)}
            label={t('profitFactor')}
            variant={stats.profitFactor >= 1.5 ? 'profit' : stats.profitFactor >= 1 ? 'primary' : 'loss'}
          />
          <GaugeChart
            value={Math.min(100, stats.avgRiskReward * 25)}
            label={t('avgRiskReward')}
            variant={stats.avgRiskReward >= 1.5 ? 'profit' : stats.avgRiskReward >= 1 ? 'primary' : 'loss'}
          />
          <GaugeChart
            value={stats.expectancy >= 0 ? Math.min(100, stats.expectancy * 10) : 0}
            label={t('expectancy')}
            variant={stats.expectancy > 0 ? 'profit' : 'loss'}
          />
          <GaugeChart
            value={Math.max(0, 100 - stats.maxDrawdownPercent)}
            label={t('securityIndicator')}
            variant={stats.maxDrawdownPercent <= 10 ? 'profit' : stats.maxDrawdownPercent <= 20 ? 'primary' : 'loss'}
          />
          <GaugeChart
            value={stats.longestWinStreak > 0 ? Math.min(100, stats.longestWinStreak * 15) : 0}
            label={t('consistency')}
            variant="primary"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          {t('slogan')}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Smart Trade Tracker <span className="text-primary font-semibold">V{APP_VERSION}</span>
        </p>
      </div>
    </div>
  );
};

export default Dashboard;