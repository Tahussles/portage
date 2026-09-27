"use client";

import { useEffect } from "react";
import { useAccountStore } from "@/lib/account/store";

/** Reads the account from this browser after mount, so the server render and hydration agree. */
export function AccountSync() {
  useEffect(() => {
    void useAccountStore.persist.rehydrate();
  }, []);
  return null;
}
