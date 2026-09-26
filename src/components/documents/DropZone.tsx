"use client";

import { Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { ACCEPT } from "./doc-check";

type DropZoneProps = {
  disabled?: boolean;
  onFile: (file: File) => void;
};

/** Drag and drop, or click / Enter to open the file picker. */
export function DropZone({ disabled, onFile }: DropZoneProps) {
  const t = useT();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file && !disabled) onFile(file);
      }}
      className={cn(
        "rounded-[var(--radius)] border-2 border-dashed transition-colors has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ink",
        over ? "border-ink bg-white" : "border-rule bg-white/60",
      )}
    >
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 px-6 py-12 text-center md:py-16",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <Upload aria-hidden="true" className="size-6 text-quiet" />
        <span className="font-display text-2xl leading-tight font-medium tracking-tight text-ink md:text-4xl">
          {t("docs.drop")}
        </span>
        <span className="text-sm text-quiet">{t("docs.dropHint")}</span>
        <span className="mt-2 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper">{t("docs.choose")}</span>
      </label>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept={ACCEPT}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
        className="sr-only"
      />
    </div>
  );
}
