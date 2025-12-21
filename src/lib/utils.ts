import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price for trading display
 * Ensures proper decimal precision (up to 8 decimals for crypto, 5 for forex)
 * Removes trailing zeros while keeping significant decimals
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '-';
  
  // Determine appropriate decimal places based on price magnitude
  const absPrice = Math.abs(price);
  let decimals = 2;
  
  if (absPrice < 0.0001) {
    decimals = 8; // For very small crypto prices
  } else if (absPrice < 0.01) {
    decimals = 6;
  } else if (absPrice < 1) {
    decimals = 5; // For forex pairs like 0.12345
  } else if (absPrice < 10) {
    decimals = 5; // For forex pairs like 1.08500
  } else if (absPrice < 1000) {
    decimals = 4;
  } else if (absPrice < 10000) {
    decimals = 3;
  } else {
    decimals = 2;
  }
  
  // Format with appropriate decimals, preserving trailing zeros for consistency
  return price.toFixed(decimals);
}

/**
 * Format price for export (CSV, JSON, PDF)
 * Returns raw number with full precision
 */
export function formatPriceForExport(price: number | null | undefined): number | null {
  if (price === null || price === undefined) return null;
  // Return with 8 decimal precision to preserve all trading data
  return Math.round(price * 100000000) / 100000000;
}
