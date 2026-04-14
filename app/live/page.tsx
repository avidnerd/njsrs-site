"use client";

import { useEffect, useState } from "react";
import { subscribeLiveStatuses } from "@/lib/firebase/proctors";
import type { LivePresenter } from "@/lib/firebase/proctors";

export default function LiveMonitorPage() {
  const [statuses, setStatuses] = useState<LivePresenter[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLiveStatuses((data) => {
      const sorted = [...data].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      setStatuses(sorted);
      setConnected(true);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            NJSRS Live — Now Presenting
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            Updated in real time as proctors advance each category
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-500"}`}
            />
            <span className="text-xs text-gray-400">{connected ? "Live" : "Connecting…"}</span>
          </div>
        </div>

        {!connected ? (
          <p className="text-center text-gray-500 py-16">Connecting to live data…</p>
        ) : statuses.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-gray-800 bg-gray-900">
            <p className="text-gray-300 text-lg font-medium">No presentations are active right now.</p>
            <p className="text-gray-500 text-sm mt-2">Check back when the fair is underway.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {statuses.map((s) => (
              <div
                key={s.categoryId}
                className="rounded-2xl border border-gray-700 bg-gray-900 px-6 py-5 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    {s.categoryName}
                  </p>
                  {s.room && (
                    <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded font-mono shrink-0">
                      Room {s.room}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white leading-tight">
                  {s.projectId}
                </p>
                <p className="text-gray-300 text-sm mt-1 leading-snug">{s.projectTitle}</p>
                <p className="text-gray-500 text-xs mt-3">{s.studentName}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-700 text-xs mt-12">
          NJSRS {new Date().getFullYear()} · njsrs.org/live
        </p>
      </div>
    </div>
  );
}
