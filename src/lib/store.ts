import { create } from "zustand";
import type { Locale, Profile } from "@/lib/engine/types";

type AppState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Filled by the intake flow (Step 5). Kept in memory only, never persisted. */
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  /** `?demo=1` was on the URL: internal links keep it so the whole walk-through uses fixtures. */
  demo: boolean;
  setDemo: (demo: boolean) => void;
  /** Arrived from the in-app pitch (`?from=pitch`): internal links keep it and the nav offers "Back to pitch". */
  fromPitch: boolean;
  setFromPitch: (fromPitch: boolean) => void;
  /** `?reset=1`: forget the profile, demo mode and pitch mode (locale stays). */
  reset: () => void;
};

export const useAppStore = create<AppState>()((set) => ({
  locale: "en",
  setLocale: (locale) => set({ locale }),
  profile: null,
  setProfile: (profile) => set({ profile }),
  demo: false,
  setDemo: (demo) => set({ demo }),
  fromPitch: false,
  setFromPitch: (fromPitch) => set({ fromPitch }),
  reset: () => set({ profile: null, demo: false, fromPitch: false }),
}));
