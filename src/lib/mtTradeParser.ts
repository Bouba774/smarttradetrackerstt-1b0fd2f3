/**
 * MetaTrader Trade History Parser
 * Supports CSV and HTML exports from MT4/MT5
 */

export interface ParsedMTTrade {
  ticket: string;
  openTime: Date;
  closeTime: Date | null;
  type: 'buy' | 'sell';
  symbol: string;
  volume: number;
  openPrice: number;
  closePrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number;
  swap: number;
  commission: number;
  comment: string;
}

export interface ParseResult {
  success: boolean;
  trades: ParsedMTTrade[];
  errors: string[];
  totalTrades: number;
  importedTrades: number;
}

/**
 * Parse MT4/MT5 CSV export file
 * Format: Ticket;Open Time;Type;Size;Item;Price;S / L;T / P;Close Time;Price;Commission;Taxes;Swap;Profit
 */
export function parseCSVFile(content: string): ParseResult {
  const errors: string[] = [];
  const trades: ParsedMTTrade[] = [];
  
  try {
    // Detect delimiter (comma or semicolon)
    const firstLine = content.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const lines = content.trim().split('\n');
    
    // Skip header line if present
    let startIndex = 0;
    const headerIndicators = ['ticket', 'open time', 'type', 'symbol', 'item', 'size', 'volume'];
    if (headerIndicators.some(h => lines[0].toLowerCase().includes(h))) {
      startIndex = 1;
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const columns = parseCSVLine(line, delimiter);
        const trade = parseCSVTrade(columns);
        if (trade) {
          trades.push(trade);
        }
      } catch (e) {
        errors.push(`Line ${i + 1}: ${e instanceof Error ? e.message : 'Parse error'}`);
      }
    }
    
    return {
      success: trades.length > 0,
      trades,
      errors,
      totalTrades: lines.length - startIndex,
      importedTrades: trades.length
    };
  } catch (e) {
    return {
      success: false,
      trades: [],
      errors: [e instanceof Error ? e.message : 'Unknown error'],
      totalTrades: 0,
      importedTrades: 0
    };
  }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Parse a CSV trade row into structured data
 */
function parseCSVTrade(columns: string[]): ParsedMTTrade | null {
  // MT4/MT5 export typically has these columns:
  // Ticket, Open Time, Type, Size/Volume, Item/Symbol, Price, S/L, T/P, Close Time, Close Price, Commission, Taxes, Swap, Profit
  
  if (columns.length < 10) return null;
  
  // Skip balance operations, deposits, withdrawals
  const type = columns[2]?.toLowerCase() || '';
  if (!type.includes('buy') && !type.includes('sell')) {
    return null;
  }
  
  const ticket = columns[0]?.replace(/[^0-9]/g, '') || '';
  if (!ticket) return null;
  
  // Parse dates - handle various formats
  const openTime = parseTradeDate(columns[1]);
  const closeTime = parseTradeDate(columns[8]);
  
  if (!openTime) return null;
  
  // Parse numeric values
  const volume = parseNumber(columns[3]);
  const symbol = columns[4]?.trim().toUpperCase() || '';
  const openPrice = parseNumber(columns[5]);
  const stopLoss = parseNumber(columns[6]);
  const takeProfit = parseNumber(columns[7]);
  const closePrice = parseNumber(columns[9]);
  const commission = parseNumber(columns[10]);
  const swap = parseNumber(columns[12] || columns[11]);
  const profit = parseNumber(columns[13] || columns[12] || columns[11]);
  const comment = columns[14]?.trim() || '';
  
  if (!symbol || volume <= 0) return null;
  
  return {
    ticket,
    openTime,
    closeTime,
    type: type.includes('buy') ? 'buy' : 'sell',
    symbol,
    volume,
    openPrice,
    closePrice,
    stopLoss: stopLoss || null,
    takeProfit: takeProfit || null,
    profit,
    swap,
    commission,
    comment
  };
}

/**
 * Parse MT4/MT5 HTML Statement export
 */
export function parseHTMLFile(content: string): ParseResult {
  const errors: string[] = [];
  const trades: ParsedMTTrade[] = [];
  
  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Find all tables (MT exports typically have multiple tables)
    const tables = doc.querySelectorAll('table');
    
    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      
      // Skip if too few rows
      if (rows.length < 2) continue;
      
      // Check if this is a trades table by looking at headers
      const headerRow = rows[0];
      const headerText = headerRow.textContent?.toLowerCase() || '';
      
      if (!headerText.includes('ticket') && !headerText.includes('symbol') && !headerText.includes('order')) {
        continue;
      }
      
      // Parse each row (skip header)
      for (let i = 1; i < rows.length; i++) {
        try {
          const cells = rows[i].querySelectorAll('td');
          if (cells.length < 8) continue;
          
          const cellValues = Array.from(cells).map(c => c.textContent?.trim() || '');
          const trade = parseHTMLTrade(cellValues);
          if (trade) {
            trades.push(trade);
          }
        } catch (e) {
          errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Parse error'}`);
        }
      }
    }
    
    return {
      success: trades.length > 0,
      trades,
      errors,
      totalTrades: trades.length + errors.length,
      importedTrades: trades.length
    };
  } catch (e) {
    return {
      success: false,
      trades: [],
      errors: [e instanceof Error ? e.message : 'Unknown error'],
      totalTrades: 0,
      importedTrades: 0
    };
  }
}

/**
 * Parse HTML table row into trade
 */
function parseHTMLTrade(cells: string[]): ParsedMTTrade | null {
  // MT HTML format varies but typically:
  // Ticket, Open Time, Type, Volume, Symbol, Price, S/L, T/P, Close Time, Close Price, Commission, Swap, Profit
  
  if (cells.length < 8) return null;
  
  // Find type column
  let typeIndex = -1;
  for (let i = 0; i < Math.min(5, cells.length); i++) {
    if (cells[i].toLowerCase().includes('buy') || cells[i].toLowerCase().includes('sell')) {
      typeIndex = i;
      break;
    }
  }
  
  if (typeIndex === -1) return null;
  
  const type = cells[typeIndex].toLowerCase();
  if (!type.includes('buy') && !type.includes('sell')) return null;
  
  // Ticket is usually first numeric column
  let ticket = '';
  for (let i = 0; i < typeIndex; i++) {
    if (/^\d+$/.test(cells[i].trim())) {
      ticket = cells[i].trim();
      break;
    }
  }
  
  if (!ticket) ticket = Date.now().toString();
  
  // Find dates - look for date patterns
  let openTime: Date | null = null;
  let closeTime: Date | null = null;
  
  for (let i = 0; i < cells.length; i++) {
    const date = parseTradeDate(cells[i]);
    if (date) {
      if (!openTime) openTime = date;
      else if (!closeTime) closeTime = date;
    }
  }
  
  if (!openTime) openTime = new Date();
  
  // Extract numeric values
  const numericValues: number[] = [];
  const symbolCandidates: string[] = [];
  
  for (let i = typeIndex + 1; i < cells.length; i++) {
    const num = parseNumber(cells[i]);
    if (num !== 0 || cells[i].includes('0.0')) {
      numericValues.push(num);
    }
    
    // Check for symbol pattern (letters only, 3-10 chars)
    if (/^[A-Z]{3,10}$/i.test(cells[i].replace(/[^A-Za-z]/g, ''))) {
      symbolCandidates.push(cells[i].replace(/[^A-Za-z]/g, '').toUpperCase());
    }
  }
  
  const symbol = symbolCandidates[0] || 'UNKNOWN';
  const volume = numericValues[0] || 0.01;
  const openPrice = numericValues[1] || 0;
  const stopLoss = numericValues.length > 3 ? numericValues[2] : null;
  const takeProfit = numericValues.length > 4 ? numericValues[3] : null;
  const closePrice = numericValues.length > 2 ? numericValues[numericValues.length - 3] : openPrice;
  const swap = numericValues.length > 2 ? numericValues[numericValues.length - 2] : 0;
  const profit = numericValues.length > 0 ? numericValues[numericValues.length - 1] : 0;
  
  return {
    ticket,
    openTime,
    closeTime,
    type: type.includes('buy') ? 'buy' : 'sell',
    symbol,
    volume,
    openPrice,
    closePrice,
    stopLoss,
    takeProfit,
    profit,
    swap,
    commission: 0,
    comment: ''
  };
}

/**
 * Parse various date formats from MT exports
 */
function parseTradeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim();
  if (!cleaned) return null;
  
  // Try various formats
  const formats = [
    // 2024.01.15 10:30:00
    /^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
    // 2024-01-15 10:30:00
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
    // 15.01.2024 10:30:00
    /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
    // 01/15/2024 10:30:00
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      try {
        let year: number, month: number, day: number;
        
        if (match[1].length === 4) {
          // YYYY.MM.DD format
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
        } else if (match[3].length === 4) {
          // DD.MM.YYYY or MM/DD/YYYY
          if (format.source.includes('/')) {
            month = parseInt(match[1]) - 1;
            day = parseInt(match[2]);
          } else {
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
          }
          year = parseInt(match[3]);
        } else {
          continue;
        }
        
        const hour = parseInt(match[4]) || 0;
        const minute = parseInt(match[5]) || 0;
        const second = parseInt(match[6]) || 0;
        
        const date = new Date(year, month, day, hour, minute, second);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  // Try native parsing as fallback
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
    return parsed;
  }
  
  return null;
}

/**
 * Parse a number from string, handling various locales
 */
function parseNumber(str: string): number {
  if (!str) return 0;
  
  // Remove spaces and common currency symbols
  let cleaned = str.replace(/\s+/g, '').replace(/[$€£¥]/g, '');
  
  // Handle both comma and period as decimal separator
  // If there's both, assume the last one is decimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastPeriod = cleaned.lastIndexOf('.');
  
  if (lastComma > lastPeriod) {
    // European format: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert parsed MT trades to app trade format
 */
export function convertToAppTrades(mtTrades: ParsedMTTrade[], userId: string): any[] {
  return mtTrades
    .filter(mt => mt.closeTime !== null) // Only closed trades
    .map(mt => {
      let result: 'win' | 'loss' | 'breakeven' = 'breakeven';
      if (mt.profit > 0) result = 'win';
      else if (mt.profit < 0) result = 'loss';
      
      return {
        user_id: userId,
        asset: mt.symbol,
        direction: mt.type === 'buy' ? 'long' : 'short',
        entry_price: mt.openPrice,
        exit_price: mt.closePrice || mt.openPrice,
        lot_size: mt.volume,
        stop_loss: mt.stopLoss,
        take_profit: mt.takeProfit,
        profit_loss: mt.profit + mt.swap + mt.commission,
        result,
        trade_date: mt.openTime.toISOString(),
        exit_timestamp: mt.closeTime?.toISOString(),
        notes: `Imported from MetaTrader - Ticket #${mt.ticket}${mt.comment ? ` - ${mt.comment}` : ''}`
      };
    });
}

/**
 * Auto-detect file format and parse
 */
export function parseTradeFile(content: string, fileName: string): ParseResult {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || content.trim().startsWith('<')) {
    return parseHTMLFile(content);
  }
  
  return parseCSVFile(content);
}
