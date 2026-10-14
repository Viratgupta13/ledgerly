import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthState = {
  session: Session | null;
  initialized: boolean;
  /** True while the user is resetting a password, so the session from the reset code does not open the app. */
  recovering: boolean;
  setRecovering: (v: boolean) => void;
  setSession: (session: Session | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  recovering: false,
  setRecovering: (recovering) => set({ recovering }),
  setSession: (session) => set({ session, initialized: true }),
}));
