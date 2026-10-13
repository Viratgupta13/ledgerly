export const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Rent', 'Friends', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];
