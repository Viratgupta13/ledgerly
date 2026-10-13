import type { Category } from './categories';

/** Well-known payees and the built-in category they almost always belong to. */
const BRANDS: Record<string, Category> = {
  // Food and quick commerce
  zomato: 'Food', swiggy: 'Food', blinkit: 'Food', zepto: 'Food', instamart: 'Food', bigbasket: 'Food',
  dominos: 'Food', mcdonalds: 'Food', kfc: 'Food', starbucks: 'Food', eatsure: 'Food', faasos: 'Food',
  // Transport
  uber: 'Transport', ola: 'Transport', rapido: 'Transport', redbus: 'Transport', fastag: 'Transport',
  irctc: 'Transport', yatri: 'Transport', petrol: 'Transport', petroleum: 'Transport', dmrc: 'Transport',
  // Shopping
  amazon: 'Shopping', flipkart: 'Shopping', myntra: 'Shopping', ajio: 'Shopping', meesho: 'Shopping', nykaa: 'Shopping',
  // Bills
  jio: 'Bills', airtel: 'Bills', bsnl: 'Bills', vodafone: 'Bills', bescom: 'Bills', netflix: 'Bills',
  spotify: 'Bills', hotstar: 'Bills', electricity: 'Bills', broadband: 'Bills',
};

/**
 * Suggests a category from a normalised payee key ("zomato", "zomato-order@hdfcbank").
 * Matches whole words, plus longer brand names as a prefix, so "ola" never matches "solanki".
 */
export function suggestCategory(payeeKey: string | null): Category | null {
  if (!payeeKey) return null;
  const tokens = payeeKey.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    for (const [brand, category] of Object.entries(BRANDS)) {
      if (token === brand || (brand.length >= 5 && token.startsWith(brand))) return category;
    }
  }
  return null;
}
