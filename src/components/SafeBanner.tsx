"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

export function SafeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if not dismissed in current session
    const dismissed = sessionStorage.getItem("cs_safe_banner_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("cs_safe_banner_dismissed", "true");
  };

  if (!visible) return null;

  return (
    <aside aria-label="Security and safety notice" className="w-full bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-2 text-xs md:text-sm text-emerald-400 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-2 mx-auto">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong className="font-semibold text-emerald-300">TalkToStranger is Safe:</strong>{" "}
          100% SSL Encrypted · No Personal Info Required · Instant 1-Click Report &amp; Block
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="text-emerald-400/70 hover:text-emerald-300 p-1 rounded transition"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
}
