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
  breakeven: number;
  winrate: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  avgProfit: number;
  profitFactor: number;
  avgLotSize: number;
  totalVolume: number;
}

// PDF-safe number formatter that uses simple ASCII characters only
const formatNumberForPDF = (value: number, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  
  const absValue = Math.abs(value);
  const fixedValue = absValue.toFixed(decimals);
  
  // Split into integer and decimal parts
  const [intPart, decPart] = fixedValue.split('.');
  
  // Add thousand separators using simple space (ASCII 32)
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Combine with decimal part
  const formatted = decPart ? `${formattedInt}.${decPart}` : formattedInt;
  
  // Add sign if negative
  return value < 0 ? `-${formatted}` : formatted;
};

export const usePDFExport = () => {
  const { language } = useLanguage();
  const { currency, getCurrencySymbol, convertFromBase, decimals } = useCurrency();
  const { triggerFeedback } = useFeedback();
  const locale = language === 'fr' ? fr : enUS;

  // PDF-specific amount formatter using raw numeric values
  const formatAmountForPDF = useCallback((amount: number | null | undefined, convertValue = true): string => {
    if (amount === null || amount === undefined) return '-';
    
    const displayAmount = convertValue ? convertFromBase(amount) : amount;
    const symbol = getCurrencySymbol();
    const formatted = formatNumberForPDF(displayAmount, decimals);
    
    return `${formatted} ${symbol}`;
  }, [convertFromBase, getCurrencySymbol, decimals]);

  const calculateStats = (trades: Trade[]): ExportStats => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakeven: 0,
        winrate: 0,
        totalPnL: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgProfit: 0,
        profitFactor: 0,
        avgLotSize: 0,
        totalVolume: 0,
      };
    }

    const winningTrades = trades.filter(t => t.result === 'win').length;
    const losingTrades = trades.filter(t => t.result === 'loss').length;
    const breakeven = trades.filter(t => t.result === 'breakeven').length;
    const totalPnL = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const profits = trades.filter(t => (t.profit_loss || 0) > 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const losses = Math.abs(trades.filter(t => (t.profit_loss || 0) < 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0));
    const pnls = trades.map(t => t.profit_loss || 0);
    const totalVolume = trades.reduce((sum, t) => sum + t.lot_size, 0);

    return {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      breakeven,
      winrate: trades.length > 0 ? Math.round((winningTrades / trades.length) * 100) : 0,
      totalPnL,
      bestTrade: Math.max(...pnls, 0),
      worstTrade: Math.min(...pnls, 0),
      avgProfit: trades.length > 0 ? totalPnL / trades.length : 0,
      profitFactor: losses > 0 ? profits / losses : profits > 0 ? Infinity : 0,
      avgLotSize: trades.length > 0 ? totalVolume / trades.length : 0,
      totalVolume,
    };
  };

  // Calculate equity curve data
  const calculateEquityCurve = (trades: Trade[]): { date: string; equity: number }[] => {
    if (trades.length === 0) return [];

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    let cumulative = 0;
    return sortedTrades.map(trade => {
      cumulative += trade.profit_loss || 0;
      return {
        date: trade.trade_date,
        equity: cumulative,
      };
    });
  };

  // Draw equity curve chart
  const drawEquityCurve = (doc: jsPDF, trades: Trade[], startY: number): number => {
    const equityData = calculateEquityCurve(trades);
    if (equityData.length < 2) return startY;

    const pageWidth = doc.internal.pageSize.getWidth();
    const chartWidth = pageWidth - 28;
    const chartHeight = 50;
    const chartX = 14;
    const chartY = startY;

    // Draw chart title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(language === 'fr' ? 'Courbe d\'Équité' : 'Equity Curve', 14, chartY - 5);

    // Draw chart background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 2, 2, 'F');

    // Calculate min/max values
    const values = equityData.map(d => d.equity);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 0);
    const range = maxValue - minValue || 1;

    // Draw grid lines
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    for (let i = 0; i <= 4; i++) {
      const y = chartY + (chartHeight / 4) * i;
      doc.line(chartX, y, chartX + chartWidth, y);
    }

    // Draw zero line if applicable
    if (minValue < 0 && maxValue > 0) {
      const zeroY = chartY + chartHeight - ((0 - minValue) / range) * chartHeight;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(chartX, zeroY, chartX + chartWidth, zeroY);
    }

    // Draw the equity curve
    doc.setLineWidth(1.5);
    
    const points: { x: number; y: number }[] = equityData.map((d, i) => ({
      x: chartX + (i / (equityData.length - 1)) * chartWidth,
      y: chartY + chartHeight - ((d.equity - minValue) / range) * chartHeight,
    }));

    // Draw line segments with color based on direction
    for (let i = 1; i < points.length; i++) {
      const prevEquity = equityData[i - 1].equity;
      const currEquity = equityData[i].equity;
      
      if (currEquity >= prevEquity) {
        doc.setDrawColor(34, 197, 94); // Green for up
      } else {
        doc.setDrawColor(239, 68, 68); // Red for down
      }
      
      doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }

    // Draw start and end values
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(formatAmountForPDF(minValue), chartX + 2, chartY + chartHeight - 2);
    doc.text(formatAmountForPDF(maxValue), chartX + 2, chartY + 6);

    // Draw final equity value
    const finalEquity = equityData[equityData.length - 1].equity;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    if (finalEquity >= 0) {
      doc.setTextColor(34, 197, 94);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(formatAmountForPDF(finalEquity), chartX + chartWidth - 30, chartY + 10);

    return chartY + chartHeight + 15;
  };

  // Draw performance distribution chart
  const drawPerformanceChart = (doc: jsPDF, stats: ExportStats, startY: number): number => {
    const chartX = 14;
    const chartY = startY;
    const barWidth = 50;
    const barHeight = 8;
    const spacing = 3;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(language === 'fr' ? 'Distribution des Résultats' : 'Results Distribution', 14, chartY - 5);

    const total = stats.winningTrades + stats.losingTrades + stats.breakeven;
    if (total === 0) return chartY + 10;

    const winPct = (stats.winningTrades / total) * 100;
    const lossPct = (stats.losingTrades / total) * 100;
    const bePct = (stats.breakeven / total) * 100;

    const data = [
      { label: language === 'fr' ? 'Gains' : 'Wins', value: stats.winningTrades, pct: winPct, color: [34, 197, 94] as [number, number, number] },
      { label: language === 'fr' ? 'Pertes' : 'Losses', value: stats.losingTrades, pct: lossPct, color: [239, 68, 68] as [number, number, number] },
      { label: 'Breakeven', value: stats.breakeven, pct: bePct, color: [156, 163, 175] as [number, number, number] },
    ];

    data.forEach((item, i) => {
      const y = chartY + i * (barHeight + spacing);
      
      // Label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(item.label, chartX, y + 6);

      // Background bar
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(chartX + 35, y, barWidth, barHeight, 1, 1, 'F');

      // Filled bar
      const fillWidth = (item.pct / 100) * barWidth;
      if (fillWidth > 0) {
        doc.setFillColor(...item.color);
        doc.roundedRect(chartX + 35, y, Math.max(fillWidth, 2), barHeight, 1, 1, 'F');
      }

      // Value
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(`${item.value} (${item.pct.toFixed(1)}%)`, chartX + 90, y + 6);
    });

    return chartY + data.length * (barHeight + spacing) + 10;
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
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Header with gradient effect
      doc.setFillColor(15, 23, 42); // Dark slate
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Accent line
      doc.setFillColor(59, 130, 246); // Blue
      doc.rect(0, 48, pageWidth, 2, 'F');
      
      // Logo area
      doc.setFillColor(59, 130, 246);
      doc.circle(20, 25, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('STT', 15.5, 27);

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Smart Trade Tracker', 32, 24);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(language === 'fr' ? 'Rapport de Performance' : 'Performance Report', 32, 34);

      // Profile info (right side)
      if (profile) {
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`${profile.nickname}`, pageWidth - 14, 22, { align: 'right' });
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.text(`Level ${profile.level || 1} • ${profile.total_points || 0} pts`, pageWidth - 14, 32, { align: 'right' });
      }

      // Date and currency badge
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${format(new Date(), 'dd MMMM yyyy', { locale })} • ${getCurrencySymbol()} ${currency}`,
        pageWidth - 14,
        42,
        { align: 'right' }
      );

      yPos = 60;

      // Period label
      if (periodLabel) {
        doc.setFillColor(241, 245, 249); // Slate 100
        doc.roundedRect(14, yPos - 5, pageWidth - 28, 12, 2, 2, 'F');
        doc.setTextColor(71, 85, 105); // Slate 600
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(language === 'fr' ? 'Période: ' : 'Period: ', 18, yPos + 3);
        doc.setFont('helvetica', 'normal');
        doc.text(periodLabel, 45, yPos + 3);
        yPos += 18;
      }

      // Statistics section
      const stats = calculateStats(trades);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'fr' ? 'Statistiques de Performance' : 'Performance Statistics', 14, yPos);
      yPos += 8;

      // Stats cards in grid
      const cardWidth = (pageWidth - 32) / 3;
      const cardHeight = 22;
      
      const statsCards = [
        { label: 'Total Trades', value: stats.totalTrades.toString(), color: [59, 130, 246] as [number, number, number] },
        { label: 'Winrate', value: `${stats.winrate}%`, color: stats.winrate >= 50 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
        { label: 'Profit Factor', value: stats.profitFactor === Infinity ? 'Inf' : formatNumberForPDF(stats.profitFactor, 2), color: stats.profitFactor >= 1 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
        { label: language === 'fr' ? 'PnL Total' : 'Total PnL', value: formatAmountForPDF(stats.totalPnL), color: stats.totalPnL >= 0 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
        { label: language === 'fr' ? 'Meilleur Trade' : 'Best Trade', value: formatAmountForPDF(stats.bestTrade), color: [34, 197, 94] as [number, number, number] },
        { label: language === 'fr' ? 'Pire Trade' : 'Worst Trade', value: formatAmountForPDF(stats.worstTrade), color: [239, 68, 68] as [number, number, number] },
      ];

      statsCards.forEach((card, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = 14 + col * (cardWidth + 4);
        const y = yPos + row * (cardHeight + 4);

        // Card background
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');

        // Accent line
        doc.setFillColor(...card.color);
        doc.rect(x, y, 3, cardHeight, 'F');

        // Label
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(card.label, x + 6, y + 8);

        // Value
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...card.color);
        doc.text(card.value, x + 6, y + 17);
      });

      yPos += 2 * (cardHeight + 4) + 10;

      // Additional stats row
      const additionalStats = [
        { label: language === 'fr' ? 'Lot Moyen' : 'Avg Lot', value: formatNumberForPDF(stats.avgLotSize, 2) },
        { label: language === 'fr' ? 'Volume Total' : 'Total Volume', value: formatNumberForPDF(stats.totalVolume, 2) },
        { label: language === 'fr' ? 'Profit Moyen' : 'Avg Profit', value: formatAmountForPDF(stats.avgProfit) },
      ];

      doc.setFontSize(9);
      additionalStats.forEach((stat, i) => {
        const x = 14 + i * ((pageWidth - 28) / 3);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label + ':', x, yPos);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, x + 30, yPos);
      });

      yPos += 12;

      // Performance distribution chart
      yPos = drawPerformanceChart(doc, stats, yPos);

      // Equity curve
      if (trades.length >= 2) {
        yPos = drawEquityCurve(doc, trades, yPos);
      }

      // Check if we need a new page for trade history
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      // Trades table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(language === 'fr' ? 'Historique des Trades' : 'Trade History', 14, yPos);
      yPos += 5;

      const tableHeaders = [
        language === 'fr' ? 'Date' : 'Date',
        'Asset',
        language === 'fr' ? 'Dir.' : 'Dir.',
        language === 'fr' ? 'Entrée' : 'Entry',
        language === 'fr' ? 'Sortie' : 'Exit',
        'Lot',
        `PnL`,
        language === 'fr' ? 'Rés.' : 'Res.',
      ];

      const tableData = trades.slice(0, 100).map(trade => [
        format(new Date(trade.trade_date), 'dd/MM/yy'),
        trade.asset.length > 10 ? trade.asset.substring(0, 10) + '...' : trade.asset,
        trade.direction.toUpperCase().substring(0, 1),
        formatNumberForPDF(trade.entry_price, 2),
        trade.exit_price ? formatNumberForPDF(trade.exit_price, 2) : '-',
        formatNumberForPDF(trade.lot_size, 2),
        formatAmountForPDF(trade.profit_loss || 0),
        trade.result === 'win' ? 'W' : trade.result === 'loss' ? 'L' : 'BE',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [tableHeaders],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 3,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 24 },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 22, halign: 'right' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 16, halign: 'right' },
          6: { cellWidth: 26, halign: 'right' },
          7: { cellWidth: 14, halign: 'center' },
        },
        didParseCell: (data) => {
          // Color PnL column
          if (data.column.index === 6 && data.section === 'body') {
            const value = parseFloat(data.cell.text[0]?.replace(/[^0-9.-]/g, '') || '0');
            if (value > 0) {
              data.cell.styles.textColor = [34, 197, 94];
              data.cell.styles.fontStyle = 'bold';
            } else if (value < 0) {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          // Color result column
          if (data.column.index === 7 && data.section === 'body') {
            if (data.cell.text[0] === 'W') {
              data.cell.styles.textColor = [34, 197, 94];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.text[0] === 'L') {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [156, 163, 175];
            }
          }
        },
      });

      // Footer on all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          'Smart Trade Tracker',
          14,
          pageHeight - 8
        );
        doc.text(
          `${language === 'fr' ? 'Page' : 'Page'} ${i}/${pageCount}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: 'right' }
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
  }, [language, currency, formatAmountForPDF, getCurrencySymbol, triggerFeedback, locale, convertFromBase, decimals]);

  return { exportToPDF };
};

export default usePDFExport;
