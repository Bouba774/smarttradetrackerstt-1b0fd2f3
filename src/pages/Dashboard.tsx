import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import StatCard from '@/components/ui/StatCard';
import GaugeChart from '@/components/ui/GaugeChart';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Activity,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
} from 'recharts';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();

  // Mock data - will be replaced with real data from database
  const equityData = [
    { date: 'Jan', value: 10000 },
    { date: 'Fév', value: 10500 },
    { date: 'Mar', value: 10200 },
    { date: 'Avr', value: 11200 },
    { date: 'Mai', value: 11800 },
    { date: 'Juin', value: 12450 },
  ];

  const gainLossData = [
    { day: 'Lun', gain: 250, loss: -80 },
    { day: 'Mar', gain: 180, loss: -120 },
    { day: 'Mer', gain: 320, loss: -50 },
    { day: 'Jeu', gain: 150, loss: -200 },
    { day: 'Ven', gain: 400, loss: -30 },
  ];

  const hourlyData = [
    { hour: '08h', winrate: 45 },
    { hour: '09h', winrate: 62 },
    { hour: '10h', winrate: 78 },
    { hour: '11h', winrate: 55 },
    { hour: '12h', winrate: 40 },
    { hour: '13h', winrate: 35 },
    { hour: '14h', winrate: 72 },
    { hour: '15h', winrate: 85 },
    { hour: '16h', winrate: 68 },
    { hour: '17h', winrate: 50 },
  ];

  const stats = {
    winrate: 67,
    totalPnL: '+$2,450',
    totalGains: '$4,280',
    totalLosses: '$1,830',
    riskReward: '1:2.3',
    netProfit: '$2,450',
    profitFactor: 2.34,
    totalTrades: 142,
    winningTrades: 95,
    losingTrades: 42,
    breakeven: 5,
    buyPositions: 78,
    sellPositions: 64,
    bestProfit: '$580',
    biggestLoss: '$320',
    avgProfit: '$45',
    avgLoss: '$43',
    discipline: 82,
    emotions: 75,
    riskManagement: 88,
    tradeQuality: 71,
  };

  return (
    <div className="space-y-6 py-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('dashboard')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d'ensemble de vos performances de trading
          </p>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title={t('winrate')}
          value={`${stats.winrate}%`}
          icon={Target}
          variant="default"
          trend="up"
          trendValue="+5%"
          delay={0}
        />
        <StatCard
          title={t('totalPnL')}
          value={stats.totalPnL}
          icon={DollarSign}
          variant="profit"
          trend="up"
          trendValue="+12%"
          delay={50}
        />
        <StatCard
          title={t('totalGains')}
          value={stats.totalGains}
          icon={TrendingUp}
          variant="profit"
          delay={100}
        />
        <StatCard
          title={t('totalLosses')}
          value={stats.totalLosses}
          icon={TrendingDown}
          variant="loss"
          delay={150}
        />
        <StatCard
          title={t('riskReward')}
          value={stats.riskReward}
          icon={BarChart3}
          delay={200}
        />
        <StatCard
          title={t('profitFactor')}
          value={stats.profitFactor}
          icon={Activity}
          variant={stats.profitFactor > 1 ? 'profit' : 'loss'}
          delay={250}
        />
      </div>

      {/* Volume Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title={t('totalTrades')}
          value={stats.totalTrades}
          delay={300}
        />
        <StatCard
          title={t('winningTrades')}
          value={stats.winningTrades}
          variant="profit"
          delay={350}
        />
        <StatCard
          title={t('losingTrades')}
          value={stats.losingTrades}
          variant="loss"
          delay={400}
        />
        <StatCard
          title={t('breakeven')}
          value={stats.breakeven}
          variant="neutral"
          delay={450}
        />
        <StatCard
          title={t('buyPositions')}
          value={stats.buyPositions}
          delay={500}
        />
        <StatCard
          title={t('sellPositions')}
          value={stats.sellPositions}
          delay={550}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
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
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
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

        {/* Gain/Loss Chart */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '650ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {t('gainLossChart')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gainLossData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="gain" fill="hsl(var(--profit))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loss" fill="hsl(var(--loss))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hourly Heatmap */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '700ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          {t('heatmap')}
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="winrate" radius={[4, 4, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.winrate >= 70
                        ? 'hsl(var(--profit))'
                        : entry.winrate >= 50
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--loss))'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            💡 <span className="text-foreground font-medium">Insight:</span> Tu performes mieux entre 10h et 11h, et entre 14h et 16h.
          </p>
        </div>
      </div>

      {/* Gauges Section */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '750ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-6">
          Indicateurs de Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
          <GaugeChart
            value={stats.discipline}
            label={t('discipline')}
            variant={stats.discipline >= 80 ? 'profit' : stats.discipline >= 60 ? 'primary' : 'loss'}
            size="md"
          />
          <GaugeChart
            value={stats.winrate}
            label={t('winrate')}
            variant={stats.winrate >= 60 ? 'profit' : stats.winrate >= 50 ? 'primary' : 'loss'}
            size="md"
          />
          <GaugeChart
            value={stats.emotions}
            label={t('emotions')}
            variant={stats.emotions >= 80 ? 'profit' : stats.emotions >= 60 ? 'primary' : 'loss'}
            size="md"
          />
          <GaugeChart
            value={stats.riskManagement}
            label={t('riskManagement')}
            variant={stats.riskManagement >= 80 ? 'profit' : stats.riskManagement >= 60 ? 'primary' : 'loss'}
            size="md"
          />
        </div>
      </div>

      {/* Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-profit" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('bestProfit')}</p>
              <p className="font-display text-xl font-bold profit-text">{stats.bestProfit}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">EUR/USD • 15 Mars 2024</p>
        </div>
        
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '850ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-loss/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-loss" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('biggestLoss')}</p>
              <p className="font-display text-xl font-bold loss-text">-{stats.biggestLoss}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">GBP/JPY • 8 Février 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
