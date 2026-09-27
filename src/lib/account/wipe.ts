import { create } from "zustand";

// A page transition where the Portage line sweeps across the screen (components/account/PageWipe).
// "forward" draws left to right (signing in); "back" draws right to left (signing out, deleting).

export type Wipe = {
  id: number;
  href: string;
  direction: "forward" | "back";
  /** Runs once the screen is covered, before navigating (e.g. sign out, so the old page never flashes). */
  onCovered?: () => void;
};

type WipeState = {
  wipe: Wipe | null;
  start: (href: string, direction: Wipe["direction"], onCovered?: () => void) => void;
  finish: () => void;
};

let next = 0;

export const useWipeStore = create<WipeState>()((set) => ({
  wipe: null,
  start: (href, direction, onCovered) => set({ wipe: { id: ++next, href, direction, onCovered } }),
  finish: () => set({ wipe: null }),
}));
