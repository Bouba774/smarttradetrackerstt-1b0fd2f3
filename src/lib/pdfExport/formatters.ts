// PDF-safe number formatter that uses simple ASCII characters only
export const formatNumberForPDF = (value: number, decimals: number = 2): string => {
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

/**
 * Format price for PDF export with appropriate decimal precision
 * For trading prices (forex, crypto, etc.)
 */
export const formatPriceForPDF = (price: number | null | undefined): string => {
  if (price === null || price === undefined || isNaN(price)) return '-';
  
  const absPrice = Math.abs(price);
  let decimals = 2;
  
  if (absPrice < 0.0001) {
    decimals = 8;
  } else if (absPrice < 0.01) {
    decimals = 6;
  } else if (absPrice < 1) {
    decimals = 5;
  } else if (absPrice < 10) {
    decimals = 5;
  } else if (absPrice < 1000) {
    decimals = 4;
  } else if (absPrice < 10000) {
    decimals = 3;
  } else {
    decimals = 2;
  }
  
  return price.toFixed(decimals);
};

export const createAmountFormatter = (
  convertFromBase: (amount: number) => number,
  getCurrencySymbol: () => string,
  decimals: number
) => {
  return (amount: number | null | undefined, convertValue = true): string => {
    if (amount === null || amount === undefined) return '-';
    
    const displayAmount = convertValue ? convertFromBase(amount) : amount;
    const symbol = getCurrencySymbol();
    const formatted = formatNumberForPDF(displayAmount, decimals);
    
    return `${formatted} ${symbol}`;
  };
};
