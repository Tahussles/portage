"use client";

import { useEffect } from "react";

/** A short status message at the bottom of the screen; it clears itself after 4 s. */
export function Toast({ message, onDone }: { message: { text: string; id: number } | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [message, onDone]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      {message && (
        <p key={message.id} className="rounded-full border border-slate-line bg-granite px-5 py-2.5 text-sm text-paper shadow-xl">
          {message.text}
        </p>
      )}
    </div>
  );
}
