import { create } from "zustand";
import type { Locale } from "@/lib/engine/types";

type AppState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useAppStore = create<AppState>()((set) => ({
  locale: "en",
  setLocale: (locale) => set({ locale }),
}));
