import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useFeedback } from '@/hooks/useFeedback';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Trade,
  ProfileData,
  formatNumberForPDF,
  formatPriceForPDF,
  createAmountFormatter,
  calculateStats,
  drawPerformanceChart,
} from '@/lib/pdfExport';

export interface PDFExportOptions {
  confidentialMode: boolean;
}

// Convert image to base64 for PDF embedding
const getLogoBase64 = async (): Promise<string | null> => {
  try {
    const response = await fetch('/assets/app-logo.jpg');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const usePDFExport = () => {
  const { language } = useLanguage();
  const { currency, getCurrencySymbol, convertFromBase, decimals } = useCurrency();
  const { triggerFeedback } = useFeedback();
  const locale = language === 'fr' ? fr : enUS;

  const formatAmountForPDF = useCallback(
    createAmountFormatter(convertFromBase, getCurrencySymbol, decimals),
    [convertFromBase, getCurrencySymbol, decimals]
  );

  const exportToPDF = useCallback(async (
    trades: Trade[],
    profile: ProfileData | null,
    periodLabel?: string,
    options?: PDFExportOptions
  ) => {
    triggerFeedback('click');
    const confidentialMode = options?.confidentialMode ?? false;

    // Create confidential formatter
    const formatAmount = confidentialMode 
      ? () => '****' 
      : formatAmountForPDF;

    const formatLot = confidentialMode
      ? () => '****'
      : (value: number) => formatNumberForPDF(value, 2);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Try to load logo
      const logoBase64 = await getLogoBase64();

      // Header with gradient effect
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Accent line
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 48, pageWidth, 2, 'F');
      
      // Logo area - use actual logo if available
      if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', 12, 13, 24, 24);
      } else {
        // Fallback circle with STT
        doc.setFillColor(59, 130, 246);
        doc.circle(24, 25, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('STT', 18, 27);
      }

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Smart Trade Tracker', 40, 24);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(language === 'fr' ? 'Rapport de Performance' : 'Performance Report', 40, 34);

      // ALPHA FX branding
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('ALPHA FX', pageWidth - 14, 18, { align: 'right' });

      // Profile info (right side)
      if (profile) {
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(`Level ${profile.level || 1} • ${profile.total_points || 0} pts`, pageWidth - 14, 28, { align: 'right' });
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

      // Confidential mode indicator
      if (confidentialMode) {
        doc.setFillColor(234, 179, 8);
        doc.roundedRect(pageWidth - 80, 30, 45, 8, 2, 2, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(language === 'fr' ? 'CONFIDENTIEL' : 'CONFIDENTIAL', pageWidth - 57.5, 35, { align: 'center' });
      }

      yPos = 60;

      // Period label
      if (periodLabel) {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, yPos - 5, pageWidth - 28, 12, 2, 2, 'F');
        doc.setTextColor(71, 85, 105);
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

      // Stats cards in grid - 3 rows of 3
      const cardWidth = (pageWidth - 32) / 3;
      const cardHeight = 22;
      
      const statsCards = [
        { label: 'Total Trades', value: stats.totalTrades.toString(), color: [59, 130, 246] as [number, number, number] },
        { label: 'Winrate', value: `${stats.winrate}%`, color: stats.winrate >= 50 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
        { label: 'Profit Factor', value: stats.profitFactor === Infinity ? '∞' : formatNumberForPDF(stats.profitFactor, 2), color: stats.profitFactor >= 1 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
        { label: language === 'fr' ? 'PnL Total' : 'Total PnL', value: formatAmount(stats.totalPnL), color: stats.totalPnL >= 0 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
        { label: language === 'fr' ? 'Meilleur Trade' : 'Best Trade', value: formatAmount(stats.bestTrade), color: [34, 197, 94] as [number, number, number] },
        { label: language === 'fr' ? 'Pire Trade' : 'Worst Trade', value: formatAmount(stats.worstTrade), color: [239, 68, 68] as [number, number, number] },
        { label: language === 'fr' ? 'Gain Moyen' : 'Avg Win', value: formatAmount(stats.avgWin || 0), color: [34, 197, 94] as [number, number, number] },
        { label: language === 'fr' ? 'Perte Moyenne' : 'Avg Loss', value: formatAmount(stats.avgLoss || 0), color: [239, 68, 68] as [number, number, number] },
        { label: language === 'fr' ? 'Profit Moyen' : 'Avg Profit', value: formatAmount(stats.avgProfit), color: stats.avgProfit >= 0 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
      ];

      statsCards.forEach((card, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = 14 + col * (cardWidth + 4);
        const y = yPos + row * (cardHeight + 4);

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');

        doc.setFillColor(...card.color);
        doc.rect(x, y, 3, cardHeight, 'F');

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(card.label, x + 6, y + 8);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...card.color);
        doc.text(card.value, x + 6, y + 17);
      });

      yPos += 3 * (cardHeight + 4) + 10;

      // Additional stats row
      const additionalStats = [
        { label: language === 'fr' ? 'Lot Moyen' : 'Avg Lot', value: formatLot(stats.avgLotSize) },
        { label: language === 'fr' ? 'Volume Total' : 'Total Volume', value: formatLot(stats.totalVolume) },
        { label: language === 'fr' ? 'Gains' : 'Wins', value: stats.winningTrades.toString() },
        { label: language === 'fr' ? 'Pertes' : 'Losses', value: stats.losingTrades.toString() },
        { label: 'BE', value: stats.breakeven.toString() },
      ];

      doc.setFontSize(9);
      const statWidth = (pageWidth - 28) / additionalStats.length;
      additionalStats.forEach((stat, i) => {
        const x = 14 + i * statWidth;
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label + ':', x, yPos);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, x + 25, yPos);
      });

      yPos += 12;

      // Performance distribution chart
      yPos = drawPerformanceChart(doc, stats, yPos, language);

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
        formatPriceForPDF(trade.entry_price),
        trade.exit_price ? formatPriceForPDF(trade.exit_price) : '-',
        formatLot(trade.lot_size),
        formatAmount(trade.profit_loss || 0),
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
          if (data.column.index === 6 && data.section === 'body') {
            if (confidentialMode) {
              data.cell.styles.textColor = [100, 100, 100];
            } else {
              const value = parseFloat(data.cell.text[0]?.replace(/[^0-9.-]/g, '') || '0');
              if (value > 0) {
                data.cell.styles.textColor = [34, 197, 94];
                data.cell.styles.fontStyle = 'bold';
              } else if (value < 0) {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
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
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Smart Trade Tracker', 14, pageHeight - 8);
        doc.text(
          `${language === 'fr' ? 'Page' : 'Page'} ${i}/${pageCount}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: 'right' }
        );
      }

      // Save
      const filename = `smart-trade-tracker-report-${format(new Date(), 'yyyy-MM-dd')}${confidentialMode ? '-confidentiel' : ''}.pdf`;
      doc.save(filename);

      triggerFeedback('success');
      toast.success(language === 'fr' ? 'PDF exporté avec succès!' : 'PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      triggerFeedback('error');
      toast.error(language === 'fr' ? "Erreur lors de l'export PDF" : 'PDF export error');
    }
  }, [language, currency, formatAmountForPDF, getCurrencySymbol, triggerFeedback, locale]);

  return { exportToPDF };
};

export default usePDFExport;