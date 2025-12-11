import React from 'react';
import { ArrowLeft, TrendingUp, Target, Eye, Sparkles, Shield, Heart, Rocket, BarChart3, Brain, Video, BookOpen, Trophy, Calculator, Bot, Globe, Palette, Zap, Lock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const About: React.FC = () => {
  const features = [
    { icon: BarChart3, title: 'Dashboard', description: 'Complete overview of your trading performance with real-time statistics and visual charts.' },
    { icon: TrendingUp, title: 'Trade Entry & Full History', description: 'Log every trade with detailed information and review your complete trading history anytime.' },
    { icon: Sparkles, title: 'Advanced Reports & Analytics', description: 'Deep insights into your performance with equity curves, win rates, and custom date filtering.' },
    { icon: Brain, title: 'Weekly Emotional Analysis', description: 'Track your emotional states and understand how they impact your trading decisions.' },
    { icon: Target, title: 'Psychological Tools', description: 'Identify patterns in your behavior to overcome fear, greed, and impulsive trading.' },
    { icon: Video, title: 'Video/Audio Trading Journal', description: 'Record up to 60 seconds of video or audio to capture your thoughts and market analysis.' },
    { icon: BookOpen, title: 'Lessons & Daily Routine', description: 'Pre-market checklists, daily objectives, and lesson tracking to build consistent habits.' },
    { icon: Trophy, title: 'Challenges & Gamification', description: 'Progress through levels from Beginner to Legend by completing trading challenges.' },
    { icon: Calculator, title: 'Lot Size Calculator', description: 'Calculate optimal position sizes for Forex, Crypto, Indices, and Metals with precision.' },
    { icon: Bot, title: 'AI Assistant 24/7', description: 'Get personalized trading insights and analysis from an AI that knows your trading data.' },
  ];

  const uniqueFeatures = [
    { icon: Zap, title: 'All-in-One System', description: 'Everything you need to track, analyze, and improve your trading in one place.' },
    { icon: Globe, title: 'Automatic Currency Conversion', description: 'Real-time exchange rates for USD, EUR, GBP, JPY, XAF, and XOF.' },
    { icon: Palette, title: 'Clean & Intuitive UX', description: 'Modern design optimized for mobile-first trading on the go.' },
    { icon: Brain, title: 'Deep Psychological Integration', description: 'Emotional tracking woven into every aspect of your trading journal.' },
    { icon: Target, title: 'Built for Real Discipline', description: 'Tools designed by a trader to enforce discipline and consistency.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-profit" />
            <span className="font-display font-semibold text-foreground">About Smart Trade Tracker</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-screen">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 space-y-8">
          
          {/* Mission Statement */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Smart Trade Tracker was created with one purpose: to help traders develop the discipline and clarity they need to succeed. We believe that consistent profitability comes from understanding your psychology, tracking your data, and learning from every trade. Our mission is to provide the tools that turn scattered trading into a structured, data-driven journey toward mastery.
            </p>
          </section>

          {/* What is Smart Trade Tracker */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-profit/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-profit" />
              </div>
              <h2 className="text-xl font-bold text-foreground">What is Smart Trade Tracker?</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Smart Trade Tracker is a comprehensive trading journal designed to help you track every trade, analyze your performance, and master your emotions. It solves the most common problems traders face:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-profit mt-1">•</span>
                <span><strong className="text-foreground">Emotional trading</strong> — Understand how your feelings affect your decisions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-profit mt-1">•</span>
                <span><strong className="text-foreground">Inconsistency</strong> — Build habits with daily routines and checklists</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-profit mt-1">•</span>
                <span><strong className="text-foreground">Overtrading</strong> — Track your activity and identify harmful patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-profit mt-1">•</span>
                <span><strong className="text-foreground">Lack of data</strong> — Every trade is logged with full details for analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-profit mt-1">•</span>
                <span><strong className="text-foreground">Confusion</strong> — Clear dashboards and reports show exactly where you stand</span>
              </li>
            </ul>
          </section>

          {/* Our Vision */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Our Vision</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We envision a world where every trader has the tools to become consistently profitable. Our goal is to help you make data-driven decisions, achieve psychological balance, and master the discipline that separates successful traders from the rest. Long-term mastery is built one trade at a time — and we're here to help you track every step of that journey.
            </p>
          </section>

          {/* Key Features */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Key Features</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                  <feature.icon className="w-5 h-5 text-profit shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What Makes Us Unique */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-profit/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-profit" />
              </div>
              <h2 className="text-xl font-bold text-foreground">What Makes Smart Trade Tracker Unique</h2>
            </div>
            <div className="space-y-4">
              {uniqueFeatures.map((feature, index) => (
                <div key={index} className="flex gap-3">
                  <feature.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Our Commitment */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Our Commitment to Users</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-profit shrink-0 mt-1" />
                <span><strong className="text-foreground">Privacy Protection</strong> — Your trading data is encrypted and secure</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-profit shrink-0 mt-1" />
                <span><strong className="text-foreground">No Sale of Personal Data</strong> — Your information is never sold to third parties</span>
              </li>
              <li className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-profit shrink-0 mt-1" />
                <span><strong className="text-foreground">Full Transparency</strong> — Clear policies and honest communication</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-profit shrink-0 mt-1" />
                <span><strong className="text-foreground">Secure Data Handling</strong> — Local and cloud storage with industry-standard security</span>
              </li>
            </ul>
          </section>

          {/* Call to Action */}
          <section className="glass-card p-6 sm:p-8 text-center bg-gradient-to-br from-primary/10 to-profit/10">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-neon">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Start Your Journey Today</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Every successful trader tracks their trades. Every consistent trader knows their data. Start logging your trades today and discover the power of discipline and data-driven trading.
            </p>
            <p className="text-profit font-display font-semibold mb-4">
              "Discipline is the bridge between goals and accomplishment."
            </p>
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Contact us: <a href="mailto:alphafx@outlook.fr" className="text-profit hover:underline font-medium">alphafx@outlook.fr</a>
              </p>
            </div>
          </section>

          {/* Legal Information */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Legal Information</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/privacy-policy" className="flex-1">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Shield className="w-4 h-4 text-profit" />
                  Privacy Policy
                </Button>
              </Link>
              <Link to="/terms-of-use" className="flex-1">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4 text-profit" />
                  Terms of Use
                </Button>
              </Link>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Created by a trader for traders. <span className="text-profit font-semibold">ALPHA FX.</span>
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default About;
