"use client";

import { usePathname } from "next/navigation";
import { NavList } from "./nav-list";

export function AdminNav({ variant }: { variant: "sidebar" | "mobile" }) {
  return <NavList pathname={usePathname()} variant={variant} />;
}
