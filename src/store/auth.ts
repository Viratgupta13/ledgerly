import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { resetDemo } from '../demo/db';

type AuthState = {
  session: Session | null;
  initialized: boolean;
  /** True while the user is resetting a password, so the session from the reset code does not open the app. */
  recovering: boolean;
  /** "Try demo": run against in-memory sample data instead of Supabase. */
  demo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  setRecovering: (v: boolean) => void;
  setSession: (session: Session | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  recovering: false,
  demo: false,
  enterDemo: () => {
    resetDemo();
    set({ demo: true });
  },
  exitDemo: () => set({ demo: false }),
  setRecovering: (recovering) => set({ recovering }),
  setSession: (session) => set({ session, initialized: true }),
}));

/** The signed-in user's id, or 'demo' in demo mode. */
export const useUserId = () => useAuthStore((s) => s.session?.user.id ?? (s.demo ? 'demo' : undefined));
export const isDemo = () => useAuthStore.getState().demo;
