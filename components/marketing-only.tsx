"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { conference } from "@/lib/conference/config";
/** Keep focused event pages free of the full navigation and newsletter footer. */
export function MarketingOnly({ children }: { children: ReactNode }) {
  return usePathname() === conference.path ? null : children;
}
