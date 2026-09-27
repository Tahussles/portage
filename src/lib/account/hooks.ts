import { useMemo } from "react";
import type { Profile } from "@/lib/engine/types";
import { useAppStore } from "@/lib/store";
import { useCurrentAccount } from "./store";
import type { Account } from "./types";

/** The account's profile as the engine and "Hear your plan" expect it (spoken language included). */
export function profileOf(account: Account): Profile {
  return { ...account.profile, spokenLanguage: account.spokenLanguage };
}

/**
 * The profile the product pages use: the signed-in account's, else the one from this visit's intake
 * (null until someone does the intake; pages then show Priya's sample). Signed out, nothing changes.
 */
export function useActiveProfile(): Profile | null {
  const account = useCurrentAccount();
  const visit = useAppStore((s) => s.profile);
  return useMemo(() => (account ? profileOf(account) : visit), [account, visit]);
}
