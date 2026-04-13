"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "njsrs-national-jshs-banner-v1";

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
    <div className="bg-primary-blue text-white px-4 py-3 flex items-center justify-center gap-4 text-center shadow-md">
      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
        <span className="text-base font-bold tracking-wide uppercase shrink-0">
          🏆 Official Announcement
        </span>
        <span className="text-sm sm:text-base">
          <strong>NJSRS is now a regional qualifier for the National Junior Science and Humanities Symposium (JSHS).</strong>{" "}
          The <strong>top 5 finalists</strong> from the Final Round will be invited to represent New Jersey at the National JSHS.
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
