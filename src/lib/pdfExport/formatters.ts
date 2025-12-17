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
