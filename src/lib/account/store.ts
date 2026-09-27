import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Locale } from "@/lib/engine/types";
import { DEMO_ACCOUNT_ID, createEmailAccount, seedPriya } from "./seed";
import type { Account } from "./types";

export const ACCOUNT_STORAGE_KEY = "portage.account.v1";

type AccountState = {
  /** Accounts created in this browser, by id. Nothing leaves the browser. */
  accounts: Record<string, Account>;
  currentId: string | null;
  /** False until the stored accounts have been read (after mount), so the first render matches the server. */
  hydrated: boolean;
  continueAsDemo: (locale: Locale) => void;
  continueWithEmail: (email: string, locale: Locale) => void;
  signOut: () => void;
  /** Puts Priya's demo account back to its seed. */
  resetDemo: () => void;
  /** Deletes the signed-in account from this browser. */
  deleteCurrent: () => void;
  /** Applies a change to the signed-in account (see merge.ts). */
  update: (change: (account: Account) => Account) => void;
};

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: {},
      currentId: null,
      hydrated: false,
      continueAsDemo: (locale) =>
        set((s) => ({
          accounts: { ...s.accounts, [DEMO_ACCOUNT_ID]: s.accounts[DEMO_ACCOUNT_ID] ?? seedPriya(new Date(), locale) },
          currentId: DEMO_ACCOUNT_ID,
        })),
      continueWithEmail: (email, locale) => {
        const account = createEmailAccount(email, locale);
        set((s) => ({ accounts: { ...s.accounts, [account.id]: s.accounts[account.id] ?? account }, currentId: account.id }));
      },
      signOut: () => set({ currentId: null }),
      resetDemo: () => set((s) => ({ accounts: { ...s.accounts, [DEMO_ACCOUNT_ID]: seedPriya(new Date(), s.accounts[DEMO_ACCOUNT_ID]?.preferredLanguage ?? "en") } })),
      deleteCurrent: () => {
        const { currentId, accounts } = get();
        if (!currentId) return;
        const rest = { ...accounts };
        delete rest[currentId];
        set({ accounts: rest, currentId: null });
      },
      update: (change) => {
        const { currentId, accounts } = get();
        const account = currentId ? accounts[currentId] : null;
        if (account) set({ accounts: { ...accounts, [account.id]: change(account) } });
      },
    }),
    {
      name: ACCOUNT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accounts: s.accounts, currentId: s.currentId }),
      skipHydration: true,
      onRehydrateStorage: () => () => useAccountStore.setState({ hydrated: true }),
    },
  ),
);

/** The signed-in account, or null (signed out, or not read from storage yet). */
export function useCurrentAccount(): Account | null {
  return useAccountStore((s) => (s.currentId ? (s.accounts[s.currentId] ?? null) : null));
}
