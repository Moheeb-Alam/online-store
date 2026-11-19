"use client";

import { IconPrinter } from "./icons";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="adm-btn-secondary">
      <IconPrinter className="h-4 w-4" />
      Print invoice
    </button>
  );
}
