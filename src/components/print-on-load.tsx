"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";

export function PrintOnLoad() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-md bg-action px-4 py-2.5 text-sm font-semibold text-white print:hidden"
      type="button"
      onClick={() => window.print()}
    >
      <Printer size={18} />
      Print QR
    </button>
  );
}
