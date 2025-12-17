import jsPDF from 'jspdf';
import { Trade, ExportStats, EquityPoint } from './types';
import { formatNumberForPDF } from './formatters';
import { calculateEquityCurve } from './statistics';

export const drawEquityCurve = (
  doc: jsPDF,
  trades: Trade[],
  startY: number,
  language: string,
  formatAmount: (amount: number) => string
): number => {
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
  doc.text(formatAmount(minValue), chartX + 2, chartY + chartHeight - 2);
  doc.text(formatAmount(maxValue), chartX + 2, chartY + 6);

  // Draw final equity value
  const finalEquity = equityData[equityData.length - 1].equity;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  if (finalEquity >= 0) {
    doc.setTextColor(34, 197, 94);
  } else {
    doc.setTextColor(239, 68, 68);
  }
  doc.text(formatAmount(finalEquity), chartX + chartWidth - 30, chartY + 10);

  return chartY + chartHeight + 15;
};

export const drawPerformanceChart = (
  doc: jsPDF,
  stats: ExportStats,
  startY: number,
  language: string
): number => {
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
