import { create } from 'zustand';

/** Lets any screen (or a tapped notification) ask the tab pager to show a given tab. */
type TabState = {
  requested: { index: number; nonce: number } | null;
  go: (index: number) => void;
};

export const TAB = { home: 0, inbox: 1, transactions: 2, rules: 3 } as const;

export const useTabStore = create<TabState>((set) => ({
  requested: null,
  go: (index) => set({ requested: { index, nonce: Date.now() } }),
}));
