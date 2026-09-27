import type { Profile } from "@/lib/engine/types";
import { changedFacts, editField, mergeVoice } from "./merge";
import { useAccountStore } from "./store";

/** Signed in: what the interview found joins the account (voice fills gaps; edits and documents win). */
export function saveVoice(profile: Profile) {
  const store = useAccountStore.getState();
  if (store.currentId) store.update((a) => mergeVoice(a, profile, new Date().toISOString()));
}

/** Signed in: a fact corrected on the chips counts as the person's own edit. */
export function saveEdits(before: Profile, after: Profile) {
  const store = useAccountStore.getState();
  if (!store.currentId) return;
  const at = new Date().toISOString();
  store.update((a) => changedFacts(before, after).reduce((acc, [path, value]) => editField(acc, path, value, at), a));
}
