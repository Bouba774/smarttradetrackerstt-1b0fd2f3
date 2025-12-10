import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useFeedback } from '@/hooks/useFeedback';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

interface Trade {
  id: string;
  trade_date: string;
  asset: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  profit_loss: number | null;
  result: string | null;
  setup: string | null;
  emotions: string | null;
}

interface ProfileData {
  nickname: string;
  level: number | null;
  total_points: number | null;
}

interface ExportStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winrate: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  avgProfit: number;
  profitFactor: number;
}

export const usePDFExport = () => {
  const { language } = useLanguage();
  const { currency, formatAmount, convertFromBase, getCurrencySymbol } = useCurrency();
  const { triggerFeedback } = useFeedback();
  const locale = language === 'fr' ? fr : enUS;

  const calculateStats = (trades: Trade[]): ExportStats => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winrate: 0,
        totalPnL: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgProfit: 0,
        profitFactor: 0,
      };
    }

    const winningTrades = trades.filter(t => t.result === 'win').length;
    const losingTrades = trades.filter(t => t.result === 'loss').length;
    const totalPnL = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const profits = trades.filter(t => (t.profit_loss || 0) > 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const losses = Math.abs(trades.filter(t => (t.profit_loss || 0) < 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0));
    const pnls = trades.map(t => t.profit_loss || 0);

    return {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winrate: trades.length > 0 ? Math.round((winningTrades / trades.length) * 100) : 0,
      totalPnL,
      bestTrade: Math.max(...pnls),
      worstTrade: Math.min(...pnls),
      avgProfit: trades.length > 0 ? totalPnL / trades.length : 0,
      profitFactor: losses > 0 ? profits / losses : profits > 0 ? Infinity : 0,
    };
  };

  const exportToPDF = useCallback(async (
    trades: Trade[],
    profile: ProfileData | null,
    periodLabel?: string
  ) => {
    triggerFeedback('click');

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFillColor(26, 31, 44); // Dark background
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Smart Trade Tracker', 14, 25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(language === 'fr' ? 'Rapport de Trading' : 'Trading Report', 14, 35);

      // Profile info
      if (profile) {
        doc.setFontSize(10);
        doc.text(`${profile.nickname} - Level ${profile.level || 1}`, pageWidth - 14, 25, { align: 'right' });
      }

      // Date and currency
      doc.setFontSize(10);
      doc.text(
        `${format(new Date(), 'dd MMMM yyyy', { locale })} • ${getCurrencySymbol()} ${currency}`,
        pageWidth - 14,
        35,
        { align: 'right' }
      );

      yPos = 55;

      // Period if provided
      if (periodLabel) {
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(11);
        doc.text(periodLabel, 14, yPos);
        yPos += 10;
      }

      // Statistics section
      const stats = calculateStats(trades);
      
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'fr' ? 'Statistiques de Performance' : 'Performance Statistics', 14, yPos);
      yPos += 8;

      // Stats grid
      const statsData = [
        [
          language === 'fr' ? 'Total Trades' : 'Total Trades',
          stats.totalTrades.toString(),
          'Winrate',
          `${stats.winrate}%`,
        ],
        [
          language === 'fr' ? 'Gains' : 'Wins',
          stats.winningTrades.toString(),
          language === 'fr' ? 'Pertes' : 'Losses',
          stats.losingTrades.toString(),
        ],
        [
          language === 'fr' ? 'PnL Total' : 'Total PnL',
          formatAmount(stats.totalPnL),
          language === 'fr' ? 'Profit Moyen' : 'Avg Profit',
          formatAmount(stats.avgProfit),
        ],
        [
          language === 'fr' ? 'Meilleur Trade' : 'Best Trade',
          formatAmount(stats.bestTrade),
          language === 'fr' ? 'Pire Trade' : 'Worst Trade',
          formatAmount(stats.worstTrade),
        ],
        [
          'Profit Factor',
          stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2),
          '',
          '',
        ],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: statsData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { fontStyle: 'bold', cellWidth: 40 },
          3: { cellWidth: 40 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250],
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Trades table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'fr' ? 'Historique des Trades' : 'Trade History', 14, yPos);
      yPos += 5;

      const tableHeaders = [
        language === 'fr' ? 'Date' : 'Date',
        'Asset',
        language === 'fr' ? 'Dir.' : 'Dir.',
        language === 'fr' ? 'Entrée' : 'Entry',
        language === 'fr' ? 'Sortie' : 'Exit',
        'Lot',
        `PnL (${currency})`,
        language === 'fr' ? 'Résultat' : 'Result',
      ];

      const tableData = trades.slice(0, 50).map(trade => [
        format(new Date(trade.trade_date), 'dd/MM/yy'),
        trade.asset,
        trade.direction.toUpperCase().substring(0, 1),
        trade.entry_price.toFixed(2),
        trade.exit_price?.toFixed(2) || '-',
        trade.lot_size.toFixed(2),
        formatAmount(trade.profit_loss || 0),
        trade.result === 'win' ? '✓' : trade.result === 'loss' ? '✗' : '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [tableHeaders],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 25 },
          2: { cellWidth: 12 },
          3: { cellWidth: 22 },
          4: { cellWidth: 22 },
          5: { cellWidth: 18 },
          6: { cellWidth: 28 },
          7: { cellWidth: 18, halign: 'center' },
        },
        didParseCell: (data) => {
          // Color PnL column
          if (data.column.index === 6 && data.section === 'body') {
            const value = parseFloat(data.cell.text[0]?.replace(/[^0-9.-]/g, '') || '0');
            if (value > 0) {
              data.cell.styles.textColor = [34, 197, 94];
            } else if (value < 0) {
              data.cell.styles.textColor = [239, 68, 68];
            }
          }
          // Color result column
          if (data.column.index === 7 && data.section === 'body') {
            if (data.cell.text[0] === '✓') {
              data.cell.styles.textColor = [34, 197, 94];
            } else if (data.cell.text[0] === '✗') {
              data.cell.styles.textColor = [239, 68, 68];
            }
          }
        },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Smart Trade Tracker - ${language === 'fr' ? 'Page' : 'Page'} ${i}/${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      const filename = `smart-trade-tracker-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);

      triggerFeedback('success');
      toast.success(language === 'fr' ? 'PDF exporté avec succès!' : 'PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      triggerFeedback('error');
      toast.error(language === 'fr' ? 'Erreur lors de l\'export PDF' : 'PDF export error');
    }
  }, [language, currency, formatAmount, getCurrencySymbol, triggerFeedback, locale, convertFromBase]);

  return { exportToPDF };
};

export default usePDFExport;
