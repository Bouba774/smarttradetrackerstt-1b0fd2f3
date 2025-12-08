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
  Clock,
  Percent,
  Scale,
  Calendar,
  ArrowUpDown,
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
  PieChart,
  Pie,
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
    { date: 'Juil', value: 13200 },
    { date: 'Août', value: 12800 },
    { date: 'Sep', value: 14100 },
  ];

  const gainLossData = [
    { day: 'Lun', gain: 250, loss: -80 },
    { day: 'Mar', gain: 180, loss: -120 },
    { day: 'Mer', gain: 320, loss: -50 },
    { day: 'Jeu', gain: 150, loss: -200 },
    { day: 'Ven', gain: 400, loss: -30 },
  ];

  const hourlyData = [
    { hour: '06h', winrate: 35 },
    { hour: '07h', winrate: 42 },
    { hour: '08h', winrate: 55 },
    { hour: '09h', winrate: 72 },
    { hour: '10h', winrate: 85 },
    { hour: '11h', winrate: 68 },
    { hour: '12h', winrate: 45 },
    { hour: '13h', winrate: 40 },
    { hour: '14h', winrate: 78 },
    { hour: '15h', winrate: 82 },
    { hour: '16h', winrate: 65 },
    { hour: '17h', winrate: 48 },
    { hour: '18h', winrate: 38 },
  ];

  const monthlyData = [
    { month: 'Jan', pnl: 500 },
    { month: 'Fév', pnl: -200 },
    { month: 'Mar', pnl: 750 },
    { month: 'Avr', pnl: 1200 },
    { month: 'Mai', pnl: 600 },
    { month: 'Juin', pnl: 850 },
    { month: 'Juil', pnl: -150 },
    { month: 'Août', pnl: 920 },
    { month: 'Sep', pnl: 1100 },
  ];

  const positionData = [
    { name: 'Buy', value: 78, color: 'hsl(var(--profit))' },
    { name: 'Sell', value: 64, color: 'hsl(var(--loss))' },
  ];

  // Complete stats object
  const stats = {
    // Volume
    totalTrades: 142,
    winningTrades: 95,
    losingTrades: 42,
    breakeven: 5,
    buyPositions: 78,
    sellPositions: 64,
    
    // Financial
    grossProfit: 4280,
    grossLoss: 1830,
    netProfit: 2450,
    profitFactor: 2.34,
    winrate: 67,
    
    // Records
    bestProfit: 580,
    bestProfitAsset: 'EUR/USD',
    bestProfitDate: '15 Mars 2024',
    biggestLoss: 320,
    biggestLossAsset: 'GBP/JPY',
    biggestLossDate: '8 Février 2024',
    
    // Averages
    avgProfit: 45.05,
    avgLoss: 43.57,
    avgTradeSize: 0.35,
    avgTradeDuration: '2h 15m',
    
    // Best/Worst periods
    bestDay: { date: '15 Mars 2024', pnl: 580 },
    worstDay: { date: '8 Février 2024', pnl: -320 },
    bestMonth: { month: 'Avril 2024', pnl: 1200 },
    worstMonth: { month: 'Février 2024', pnl: -200 },
    
    // Totals for display
    totalGains: 4280,
    totalLosses: 1830,
    totalBreakeven: 5,
    
    // Performance metrics
    discipline: 82,
    emotions: 75,
    riskManagement: 88,
    tradeQuality: 71,
  };

  // Mock user profile - will be replaced with real data
  const userProfile = {
    nickname: 'Alex',
    level: 'Master Trader',
    levelNumber: 6,
  };

  return (
    <div className="space-y-6 py-4">
      {/* Welcome Message */}
      <div className="glass-card p-6 animate-fade-in bg-gradient-to-r from-primary/10 to-profit/10 border-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t('welcome')} {userProfile.nickname} 👋
            </h1>
            <p className="text-primary font-display font-semibold mt-1 neon-text">
              {userProfile.level} (Niveau {userProfile.levelNumber})
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-xs text-muted-foreground">Niveau actuel</p>
              <p className="font-display font-bold text-primary">{userProfile.levelNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Transactions"
          value={stats.totalTrades}
          icon={Activity}
          delay={0}
        />
        <StatCard
          title="Transactions Rentables"
          value={stats.winningTrades}
          icon={TrendingUp}
          variant="profit"
          delay={50}
        />
        <StatCard
          title="Transactions Perdantes"
          value={stats.losingTrades}
          icon={TrendingDown}
          variant="loss"
          delay={100}
        />
        <StatCard
          title="Positions Buy"
          value={stats.buyPositions}
          icon={TrendingUp}
          variant="profit"
          delay={150}
        />
        <StatCard
          title="Positions Sell"
          value={stats.sellPositions}
          icon={TrendingDown}
          variant="loss"
          delay={200}
        />
        <StatCard
          title="Break-even"
          value={stats.breakeven}
          icon={ArrowUpDown}
          variant="neutral"
          delay={250}
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Bénéfice Brut"
          value={`$${stats.grossProfit.toLocaleString()}`}
          icon={DollarSign}
          variant="profit"
          delay={300}
        />
        <StatCard
          title="Perte Brute"
          value={`$${stats.grossLoss.toLocaleString()}`}
          icon={DollarSign}
          variant="loss"
          delay={350}
        />
        <StatCard
          title="Bénéfice Net"
          value={`$${stats.netProfit.toLocaleString()}`}
          icon={DollarSign}
          variant="profit"
          trend="up"
          trendValue="+12%"
          delay={400}
        />
        <StatCard
          title="Facteur de Profit"
          value={stats.profitFactor.toFixed(2)}
          icon={Scale}
          variant={stats.profitFactor > 1 ? 'profit' : 'loss'}
          delay={450}
        />
        <StatCard
          title={t('winrate')}
          value={`${stats.winrate}%`}
          icon={Target}
          trend="up"
          trendValue="+5%"
          delay={500}
        />
        <StatCard
          title="Bénéfice Moyen"
          value={`$${stats.avgProfit.toFixed(2)}`}
          icon={Percent}
          variant="profit"
          delay={550}
        />
      </div>

      {/* Average Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Perte Moyenne"
          value={`$${stats.avgLoss.toFixed(2)}`}
          icon={Percent}
          variant="loss"
          delay={600}
        />
        <StatCard
          title="Taille Moyenne (Lots)"
          value={stats.avgTradeSize.toFixed(2)}
          icon={BarChart3}
          delay={650}
        />
        <StatCard
          title="Durée Moyenne"
          value={stats.avgTradeDuration}
          icon={Clock}
          delay={700}
        />
        <StatCard
          title="Total Gains"
          value={`$${stats.totalGains.toLocaleString()}`}
          icon={TrendingUp}
          variant="profit"
          delay={750}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '800ms' }}>
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
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '850ms' }}>
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

      {/* Monthly Performance & Position Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly PnL */}
        <div className="lg:col-span-2 glass-card p-6 animate-fade-in" style={{ animationDelay: '900ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Performance Mensuelle
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
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

        {/* Position Distribution */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '950ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-primary" />
            Distribution Positions
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
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-profit" />
              <span className="text-sm text-muted-foreground">Buy ({stats.buyPositions})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-loss" />
              <span className="text-sm text-muted-foreground">Sell ({stats.sellPositions})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Heatmap */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '1000ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          {t('heatmap')} - Winrate par Heure
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}%`, 'Winrate']}
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
            💡 <span className="text-foreground font-medium">Insight:</span> Tu performes mieux entre 9h-11h et 14h-16h. Évite de trader entre 12h-13h.
          </p>
        </div>
      </div>

      {/* Gauges Section */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '1050ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-6">
          Indicateurs de Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 justify-items-center">
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
            label="Gestion Risque"
            variant={stats.riskManagement >= 80 ? 'profit' : stats.riskManagement >= 60 ? 'primary' : 'loss'}
            size="md"
          />
          <GaugeChart
            value={stats.tradeQuality}
            label="Qualité Trades"
            variant={stats.tradeQuality >= 80 ? 'profit' : stats.tradeQuality >= 60 ? 'primary' : 'loss'}
            size="md"
          />
        </div>
      </div>

      {/* Records Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '1100ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-profit" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('bestProfit')}</p>
              <p className="font-display text-xl font-bold profit-text">${stats.bestProfit}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{stats.bestProfitAsset} • {stats.bestProfitDate}</p>
        </div>
        
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '1150ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-loss/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-loss" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('biggestLoss')}</p>
              <p className="font-display text-xl font-bold loss-text">-${stats.biggestLoss}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{stats.biggestLossAsset} • {stats.biggestLossDate}</p>
        </div>

        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '1200ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-profit" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Meilleure Journée</p>
              <p className="font-display text-xl font-bold profit-text">${stats.bestDay.pnl}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{stats.bestDay.date}</p>
        </div>

        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '1250ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-loss/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-loss" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pire Journée</p>
              <p className="font-display text-xl font-bold loss-text">-${Math.abs(stats.worstDay.pnl)}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{stats.worstDay.date}</p>
        </div>
      </div>

      {/* Best/Worst Month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '1300ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-profit" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Meilleur Mois</p>
              <p className="font-display text-2xl font-bold profit-text">${stats.bestMonth.pnl.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{stats.bestMonth.month}</p>
        </div>

        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '1350ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-loss/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-loss" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pire Mois</p>
              <p className="font-display text-2xl font-bold loss-text">-${Math.abs(stats.worstMonth.pnl).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{stats.worstMonth.month}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center animate-fade-in" style={{ animationDelay: '1400ms' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t('totalGains')}</p>
          <p className="font-display text-2xl font-bold profit-text">${stats.totalGains.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5 text-center animate-fade-in" style={{ animationDelay: '1450ms' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t('totalLosses')}</p>
          <p className="font-display text-2xl font-bold loss-text">${stats.totalLosses.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5 text-center animate-fade-in" style={{ animationDelay: '1500ms' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Break-even</p>
          <p className="font-display text-2xl font-bold text-muted-foreground">{stats.totalBreakeven}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
