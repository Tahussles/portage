"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useHref } from "./links";

/** next/link that keeps `?demo=1` across the walk-through. */
export function AppLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const toHref = useHref();
  return <Link href={toHref(href)} {...props} />;
}
