"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "njsrs-deadline-banner-dismissed";

export default function DeadlineBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-center gap-4 text-center text-sm font-medium shadow">
      <span>
        Registration deadline has been moved to <strong>March 18, 2026</strong>.
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-amber-600/30 focus:outline-none focus:ring-2 focus:ring-amber-700"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
