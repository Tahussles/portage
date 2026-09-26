import { create } from "zustand";
import type { Locale, Profile } from "@/lib/engine/types";

type AppState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Filled by the intake flow (Step 5). Kept in memory only, never persisted. */
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
};

export const useAppStore = create<AppState>()((set) => ({
  locale: "en",
  setLocale: (locale) => set({ locale }),
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
