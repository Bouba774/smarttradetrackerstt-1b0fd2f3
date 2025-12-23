/**
 * MetaTrader Trade History Parser
 * Supports CSV, HTML, XML, JSON, and XLS exports from MT4/MT5
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
  format: string;
}

// Date parsing patterns for various MT export formats
const DATE_PATTERNS = [
  // 2024.01.15 10:30:00 or 2024.01.15 10:30
  /^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
  // 2024-01-15 10:30:00
  /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
  // 2024/01/15 10:30:00
  /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
  // 15.01.2024 10:30:00
  /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
  // 15-01-2024 10:30:00
  /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
  // 01/15/2024 10:30:00
  /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
  // 2024.01.15 (date only)
  /^(\d{4})\.(\d{2})\.(\d{2})$/,
  // 15.01.2024 (date only)
  /^(\d{2})\.(\d{2})\.(\d{4})$/,
];

/**
 * Parse various date formats from MT exports
 */
export function parseTradeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim();
  if (!cleaned) return null;
  
  for (const pattern of DATE_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      try {
        let year: number, month: number, day: number;
        
        if (match[1].length === 4) {
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
        } else if (match[3].length === 4) {
          if (pattern.source.includes('/')) {
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
      } catch {
        continue;
      }
    }
  }
  
  // Try ISO 8601 format
  if (cleaned.includes('T')) {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date;
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
export function parseNumber(str: string): number {
  if (!str) return 0;
  
  let cleaned = str.replace(/\s+/g, '').replace(/[$€£¥₽₿]/g, '');
  
  const lastComma = cleaned.lastIndexOf(',');
  const lastPeriod = cleaned.lastIndexOf('.');
  
  if (lastComma > lastPeriod) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Detect CSV delimiter
 */
function detectDelimiter(content: string): string {
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  const tabCount = (firstLines.match(/\t/g) || []).length;
  const semicolonCount = (firstLines.match(/;/g) || []).length;
  const commaCount = (firstLines.match(/,/g) || []).length;
  
  if (tabCount > semicolonCount && tabCount > commaCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
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
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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
 * Find column index by possible header names
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  for (const name of possibleNames) {
    const idx = lowerHeaders.findIndex(h => h.includes(name.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Parse a CSV trade row into structured data with flexible column detection
 */
function parseCSVTradeFlexible(columns: string[], headers: string[]): ParsedMTTrade | null {
  const getField = (names: string[]): string => {
    const idx = findColumnIndex(headers, names);
    return idx !== -1 && columns[idx] ? columns[idx].trim() : '';
  };
  
  const ticket = getField(['ticket', 'order', '#', 'deal', 'position', 'id']);
  const typeStr = getField(['type', 'direction', 'action', 'operation', 'side']);
  const symbol = getField(['symbol', 'instrument', 'pair', 'item', 'asset']);
  
  const typeLower = typeStr.toLowerCase();
  
  // Skip non-trade entries
  if (!ticket && !symbol) return null;
  if (typeLower.includes('balance') || typeLower.includes('deposit') || 
      typeLower.includes('withdrawal') || typeLower.includes('credit') ||
      typeLower.includes('transfer')) {
    return null;
  }
  
  if (!typeLower.includes('buy') && !typeLower.includes('sell') && 
      !typeLower.includes('long') && !typeLower.includes('short')) {
    return null;
  }
  
  const openTimeStr = getField(['open time', 'time', 'open', 'entry time', 'entry', 'date']);
  const closeTimeStr = getField(['close time', 'close', 'exit time', 'exit']);
  
  const openTime = parseTradeDate(openTimeStr);
  if (!openTime) return null;
  
  const volume = parseNumber(getField(['volume', 'lots', 'size', 'qty', 'quantity', 'amount']));
  if (volume <= 0) return null;
  
  return {
    ticket: ticket || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    openTime,
    closeTime: parseTradeDate(closeTimeStr),
    type: (typeLower.includes('sell') || typeLower.includes('short')) ? 'sell' : 'buy',
    symbol: symbol.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'UNKNOWN',
    volume,
    openPrice: parseNumber(getField(['open price', 'price', 'entry price', 'open'])),
    closePrice: parseNumber(getField(['close price', 'exit price', 'close'])),
    stopLoss: parseNumber(getField(['s/l', 'sl', 'stop loss', 'stop', 'stoploss'])) || null,
    takeProfit: parseNumber(getField(['t/p', 'tp', 'take profit', 'target', 'takeprofit'])) || null,
    commission: parseNumber(getField(['commission', 'comm', 'fee', 'fees'])),
    swap: parseNumber(getField(['swap', 'overnight', 'rollover', 'financing'])),
    profit: parseNumber(getField(['profit', 'p/l', 'pnl', 'result', 'net profit', 'gain'])),
    comment: getField(['comment', 'note', 'notes', 'remark', 'remarks'])
  };
}

/**
 * Parse MT4/MT5 CSV export file
 */
export function parseCSVFile(content: string): ParseResult {
  const errors: string[] = [];
  const trades: ParsedMTTrade[] = [];
  
  try {
    const delimiter = detectDelimiter(content);
    const lines = content.trim().split(/\r?\n/).filter(l => l.trim());
    
    if (lines.length < 2) {
      return {
        success: false,
        trades: [],
        errors: ['File is empty or has no data rows'],
        totalTrades: 0,
        importedTrades: 0,
        format: 'CSV'
      };
    }
    
    // Find header row
    const headerKeywords = ['ticket', 'order', 'symbol', 'type', 'profit', 'deal', 'position', 'open', 'close', 'volume', 'lots'];
    let headerIdx = 0;
    
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const lowerLine = lines[i].toLowerCase();
      const matchCount = headerKeywords.filter(k => lowerLine.includes(k)).length;
      if (matchCount >= 2) {
        headerIdx = i;
        break;
      }
    }
    
    const headers = parseCSVLine(lines[headerIdx], delimiter);
    
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const columns = parseCSVLine(line, delimiter);
        const trade = parseCSVTradeFlexible(columns, headers);
        
        if (trade) {
          trades.push(trade);
        }
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Parse error'}`);
      }
    }
    
    return {
      success: trades.length > 0,
      trades,
      errors,
      totalTrades: lines.length - headerIdx - 1,
      importedTrades: trades.length,
      format: 'CSV'
    };
  } catch (e) {
    return {
      success: false,
      trades: [],
      errors: [e instanceof Error ? e.message : 'Unknown error'],
      totalTrades: 0,
      importedTrades: 0,
      format: 'CSV'
    };
  }
}

/**
 * Parse HTML table row into trade
 */
function parseHTMLTrade(cells: string[], headers: string[]): ParsedMTTrade | null {
  const getField = (names: string[]): string => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
      if (idx !== -1 && cells[idx]) {
        return cells[idx].trim();
      }
    }
    return '';
  };
  
  // Find type by checking all cells if not found by header
  let typeStr = getField(['type', 'direction', 'action']);
  let typeIdx = -1;
  
  if (!typeStr) {
    for (let i = 0; i < Math.min(6, cells.length); i++) {
      const cell = cells[i].toLowerCase();
      if (cell.includes('buy') || cell.includes('sell')) {
        typeStr = cell;
        typeIdx = i;
        break;
      }
    }
  }
  
  if (!typeStr) return null;
  
  const typeLower = typeStr.toLowerCase();
  if (!typeLower.includes('buy') && !typeLower.includes('sell')) return null;
  if (typeLower.includes('balance') || typeLower.includes('deposit')) return null;
  
  // Find ticket
  let ticket = getField(['ticket', 'order', '#', 'deal']);
  if (!ticket) {
    for (let i = 0; i < Math.min(3, cells.length); i++) {
      if (/^\d{5,}$/.test(cells[i].trim())) {
        ticket = cells[i].trim();
        break;
      }
    }
  }
  
  // Find dates
  let openTime: Date | null = null;
  let closeTime: Date | null = null;
  
  const openTimeStr = getField(['open time', 'time', 'open']);
  const closeTimeStr = getField(['close time', 'close']);
  
  openTime = parseTradeDate(openTimeStr);
  closeTime = parseTradeDate(closeTimeStr);
  
  if (!openTime) {
    for (const cell of cells) {
      const date = parseTradeDate(cell);
      if (date) {
        if (!openTime) openTime = date;
        else if (!closeTime) closeTime = date;
      }
    }
  }
  
  if (!openTime) openTime = new Date();
  
  // Find symbol
  let symbol = getField(['symbol', 'instrument', 'item']);
  if (!symbol) {
    for (const cell of cells) {
      const cleaned = cell.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (cleaned.length >= 3 && cleaned.length <= 10 && /^[A-Z]+$/.test(cleaned)) {
        symbol = cleaned;
        break;
      }
    }
  }
  
  // Extract numeric values
  const volume = parseNumber(getField(['volume', 'lots', 'size']));
  const openPrice = parseNumber(getField(['open price', 'price']));
  const closePrice = parseNumber(getField(['close price']));
  const stopLoss = parseNumber(getField(['s/l', 'sl', 'stop loss']));
  const takeProfit = parseNumber(getField(['t/p', 'tp', 'take profit']));
  const commission = parseNumber(getField(['commission', 'comm']));
  const swap = parseNumber(getField(['swap']));
  const profit = parseNumber(getField(['profit', 'p/l', 'result']));
  
  return {
    ticket: ticket || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    openTime,
    closeTime,
    type: typeLower.includes('sell') ? 'sell' : 'buy',
    symbol: symbol || 'UNKNOWN',
    volume: volume || 0.01,
    openPrice,
    closePrice: closePrice || null,
    stopLoss: stopLoss || null,
    takeProfit: takeProfit || null,
    profit,
    swap,
    commission,
    comment: ''
  };
}

/**
 * Parse MT4/MT5 HTML Statement export
 */
export function parseHTMLFile(content: string): ParseResult {
  const errors: string[] = [];
  const trades: ParsedMTTrade[] = [];
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const tables = doc.querySelectorAll('table');
    
    if (tables.length === 0) {
      return {
        success: false,
        trades: [],
        errors: ['No tables found in HTML file'],
        totalTrades: 0,
        importedTrades: 0,
        format: 'HTML'
      };
    }
    
    let totalRows = 0;
    
    for (const table of Array.from(tables)) {
      const rows = table.querySelectorAll('tr');
      if (rows.length < 2) continue;
      
      // Find header row
      let headers: string[] = [];
      let dataStartIdx = 0;
      
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('th, td');
        const cellTexts = Array.from(cells).map(c => (c.textContent || '').toLowerCase());
        const headerKeywords = ['ticket', 'order', 'symbol', 'type', 'profit', 'deal', 'item'];
        
        if (headerKeywords.some(k => cellTexts.some(t => t.includes(k)))) {
          headers = Array.from(cells).map(c => c.textContent?.trim() || '');
          dataStartIdx = i + 1;
          break;
        }
      }
      
      for (let i = dataStartIdx; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td'));
        if (cells.length < 5) continue;
        
        totalRows++;
        
        try {
          const cellValues = cells.map(c => c.textContent?.trim() || '');
          const trade = parseHTMLTrade(cellValues, headers);
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
      totalTrades: totalRows,
      importedTrades: trades.length,
      format: 'HTML Statement'
    };
  } catch (e) {
    return {
      success: false,
      trades: [],
      errors: [e instanceof Error ? e.message : 'Unknown error'],
      totalTrades: 0,
      importedTrades: 0,
      format: 'HTML'
    };
  }
}

/**
 * Parse XML file (Excel XML or generic XML)
 */
export function parseXMLFile(content: string): ParseResult {
  const errors: string[] = [];
  const trades: ParsedMTTrade[] = [];
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    
    // Check for Excel XML format
    const worksheets = doc.querySelectorAll('Worksheet, ss\\:Worksheet');
    
    if (worksheets.length > 0) {
      // Excel XML format
      for (const ws of Array.from(worksheets)) {
        const rows = ws.querySelectorAll('Row, ss\\:Row');
        let headers: string[] = [];
        let dataStartIdx = 0;
        
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const cells = rows[i].querySelectorAll('Cell, ss\\:Cell');
          const cellTexts = Array.from(cells).map(c => 
            (c.querySelector('Data, ss\\:Data')?.textContent || '').toLowerCase()
          );
          
          if (['ticket', 'order', 'symbol', 'type', 'profit'].some(k => cellTexts.some(t => t.includes(k)))) {
            headers = Array.from(cells).map(c => c.querySelector('Data, ss\\:Data')?.textContent?.trim() || '');
            dataStartIdx = i + 1;
            break;
          }
        }
        
        for (let i = dataStartIdx; i < rows.length; i++) {
          const cells = Array.from(rows[i].querySelectorAll('Cell, ss\\:Cell'));
          const values = cells.map(c => c.querySelector('Data, ss\\:Data')?.textContent?.trim() || '');
          
          try {
            const trade = parseCSVTradeFlexible(values, headers);
            if (trade) trades.push(trade);
          } catch (e) {
            errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Parse error'}`);
          }
        }
      }
    } else {
      // Generic XML format with trade elements
      const tradeElements = doc.querySelectorAll('trade, Trade, order, Order, deal, Deal, position, Position');
      
      for (const el of Array.from(tradeElements)) {
        try {
          const getAttr = (names: string[]): string => {
            for (const name of names) {
              const attr = el.getAttribute(name) || el.querySelector(name)?.textContent;
              if (attr) return attr.trim();
            }
            return '';
          };
          
          const ticket = getAttr(['ticket', 'id', 'order', 'deal']);
          const symbol = getAttr(['symbol', 'instrument', 'pair']);
          const typeStr = getAttr(['type', 'direction', 'side']).toLowerCase();
          
          if (!symbol) continue;
          if (!typeStr.includes('buy') && !typeStr.includes('sell')) continue;
          
          const openTime = parseTradeDate(getAttr(['openTime', 'open_time', 'time', 'entry_time', 'entryTime']));
          if (!openTime) continue;
          
          trades.push({
            ticket: ticket || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            openTime,
            closeTime: parseTradeDate(getAttr(['closeTime', 'close_time', 'exit_time', 'exitTime'])),
            type: typeStr.includes('sell') ? 'sell' : 'buy',
            symbol: symbol.toUpperCase(),
            volume: parseNumber(getAttr(['volume', 'lots', 'size', 'quantity'])),
            openPrice: parseNumber(getAttr(['openPrice', 'open_price', 'entry_price', 'entryPrice'])),
            closePrice: parseNumber(getAttr(['closePrice', 'close_price', 'exit_price', 'exitPrice'])),
            stopLoss: parseNumber(getAttr(['stopLoss', 'sl', 'stop_loss'])) || null,
            takeProfit: parseNumber(getAttr(['takeProfit', 'tp', 'take_profit'])) || null,
            commission: parseNumber(getAttr(['commission', 'fee'])),
            swap: parseNumber(getAttr(['swap', 'overnight'])),
            profit: parseNumber(getAttr(['profit', 'pnl', 'result'])),
            comment: getAttr(['comment', 'note']) || ''
          });
        } catch (e) {
          errors.push(`Trade element: ${e instanceof Error ? e.message : 'Parse error'}`);
        }
      }
    }
    
    return {
      success: trades.length > 0,
      trades,
      errors,
      totalTrades: trades.length + errors.length,
      importedTrades: trades.length,
      format: worksheets.length > 0 ? 'Excel XML' : 'XML'
    };
  } catch (e) {
    return {
      success: false,
      trades: [],
      errors: [e instanceof Error ? e.message : 'Invalid XML'],
      totalTrades: 0,
      importedTrades: 0,
      format: 'XML'
    };
  }
}

/**
 * Parse JSON file (API exports or custom formats)
 */
export function parseJSONFile(content: string): ParseResult {
  const errors: string[] = [];
  const trades: ParsedMTTrade[] = [];
  
  try {
    const data = JSON.parse(content);
    
    // Find the trades array
    let tradeArray: any[] = [];
    if (Array.isArray(data)) {
      tradeArray = data;
    } else {
      // Common property names for trade arrays
      const arrayProps = ['trades', 'orders', 'deals', 'history', 'positions', 'data', 'results', 'records'];
      for (const prop of arrayProps) {
        if (Array.isArray(data[prop])) {
          tradeArray = data[prop];
          break;
        }
      }
    }
    
    for (let i = 0; i < tradeArray.length; i++) {
      const t = tradeArray[i];
      
      try {
        const ticket = String(t.ticket || t.id || t.order || t.deal || t.position || i);
        const symbol = String(t.symbol || t.instrument || t.pair || t.asset || '');
        const typeStr = String(t.type || t.direction || t.side || t.action || '').toLowerCase();
        
        if (!symbol) continue;
        if (typeStr.includes('balance') || typeStr.includes('deposit') || typeStr.includes('withdrawal')) continue;
        if (!typeStr.includes('buy') && !typeStr.includes('sell') && !typeStr.includes('long') && !typeStr.includes('short')) continue;
        
        const openTime = parseTradeDate(t.openTime || t.open_time || t.time || t.entry_time || t.entryTime || t.date || t.created_at);
        if (!openTime) continue;
        
        trades.push({
          ticket,
          openTime,
          closeTime: parseTradeDate(t.closeTime || t.close_time || t.exit_time || t.exitTime),
          type: (typeStr.includes('sell') || typeStr.includes('short')) ? 'sell' : 'buy',
          symbol: symbol.toUpperCase(),
          volume: parseNumber(String(t.volume || t.lots || t.size || t.quantity || t.amount || 0.01)),
          openPrice: parseNumber(String(t.openPrice || t.open_price || t.entry_price || t.entryPrice || t.price || 0)),
          closePrice: parseNumber(String(t.closePrice || t.close_price || t.exit_price || t.exitPrice || 0)),
          stopLoss: parseNumber(String(t.stopLoss || t.sl || t.stop_loss || 0)) || null,
          takeProfit: parseNumber(String(t.takeProfit || t.tp || t.take_profit || 0)) || null,
          commission: parseNumber(String(t.commission || t.fee || t.fees || 0)),
          swap: parseNumber(String(t.swap || t.overnight || t.financing || 0)),
          profit: parseNumber(String(t.profit || t.pnl || t.result || t.gain || t.pl || 0)),
          comment: t.comment || t.note || t.notes || t.remark || ''
        });
      } catch (e) {
        errors.push(`Item ${i}: ${e instanceof Error ? e.message : 'Parse error'}`);
      }
    }
    
    return {
      success: trades.length > 0,
      trades,
      errors,
      totalTrades: tradeArray.length,
      importedTrades: trades.length,
      format: 'JSON'
    };
  } catch (e) {
    return {
      success: false,
      trades: [],
      errors: [`JSON parse error: ${e instanceof Error ? e.message : 'Invalid JSON'}`],
      totalTrades: 0,
      importedTrades: 0,
      format: 'JSON'
    };
  }
}

/**
 * Convert parsed MT trades to app trade format
 */
export function convertToAppTrades(mtTrades: ParsedMTTrade[], userId: string): any[] {
  return mtTrades
    .filter(mt => mt.closeTime !== null)
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
  const trimmedContent = content.trim();
  
  // Detect by extension first
  if (lowerName.endsWith('.json')) {
    return parseJSONFile(content);
  }
  
  if (lowerName.endsWith('.xml') || lowerName.endsWith('.xls')) {
    return parseXMLFile(content);
  }
  
  // Detect by content
  if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    return parseJSONFile(content);
  }
  
  if (trimmedContent.startsWith('<?xml') || trimmedContent.includes('<Workbook') || trimmedContent.includes('<ss:Workbook')) {
    return parseXMLFile(content);
  }
  
  if (trimmedContent.includes('<!DOCTYPE') || trimmedContent.includes('<html') || 
      trimmedContent.includes('<HTML') || trimmedContent.includes('<table') || 
      trimmedContent.includes('<TABLE') || /<tr[>\s]/i.test(trimmedContent)) {
    return parseHTMLFile(content);
  }
  
  if (lowerName.endsWith('.htm') || lowerName.endsWith('.html')) {
    return parseHTMLFile(content);
  }
  
  // Default to CSV
  return parseCSVFile(content);
}
