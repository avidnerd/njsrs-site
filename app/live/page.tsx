"use client";

import { useEffect, useState } from "react";
import { subscribeLiveStatuses, subscribeFinalists } from "@/lib/firebase/proctors";
import type { LivePresenter, FinalistsDoc } from "@/lib/firebase/proctors";

export default function LiveMonitorPage() {
  const [statuses, setStatuses] = useState<LivePresenter[]>([]);
  const [finalists, setFinalists] = useState<FinalistsDoc | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsubStatuses = subscribeLiveStatuses((data) => {
      const sorted = [...data].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      setStatuses(sorted);
      setConnected(true);
    });
    const unsubFinalists = subscribeFinalists((data) => {
      setFinalists(data);
    });
    return () => {
      unsubStatuses();
      unsubFinalists();
    };
  }, []);

  const showFinalists = finalists?.published && (finalists.students?.length ?? 0) > 0;

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

        {/* Finalists board */}
        {showFinalists && (
          <div className="mb-10 rounded-2xl border border-yellow-400/40 bg-gradient-to-b from-yellow-950/60 to-gray-900 px-6 py-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🏆</span>
              <div>
                <h2 className="text-xl font-extrabold text-yellow-300 tracking-tight">
                  Final Round Finalists
                </h2>
                <p className="text-xs text-yellow-600 mt-0.5">Congratulations to all who advanced!</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {finalists!.students.map((s) => (
                <div
                  key={s.studentId}
                  className="rounded-xl border border-yellow-400/20 bg-gray-900/70 px-4 py-3"
                >
                  {s.categoryName && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-yellow-500 mb-1">
                      {s.categoryName}
                    </p>
                  )}
                  <p className="font-bold text-white text-base leading-tight">
                    {s.projectId && (
                      <span className="text-yellow-300 mr-2 font-mono">{s.projectId}</span>
                    )}
                    {s.studentName}
                  </p>
                  {s.projectTitle && (
                    <p className="text-gray-400 text-sm mt-0.5 leading-snug">{s.projectTitle}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
                {/* Category header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    {s.categoryName}
                  </p>
                  {s.room && (
                    <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded font-mono shrink-0">
                      Room {s.room}
                    </span>
                  )}
                </div>

                {/* Current presenter */}
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-indigo-600 text-white uppercase tracking-wide mb-1.5">
                    Now Presenting
                  </span>
                  <p className="text-2xl font-bold text-white leading-tight">{s.projectId}</p>
                  <p className="text-gray-300 text-sm mt-0.5 leading-snug">{s.projectTitle}</p>
                  <p className="text-gray-500 text-xs mt-2">{s.studentName}</p>
                </div>

                {/* Next presenter */}
                {s.nextStudentName && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-amber-500 text-white uppercase tracking-wide mb-1.5">
                      Up Next
                    </span>
                    <p className="text-lg font-bold text-amber-300 leading-tight">
                      {s.nextProjectId && <span className="mr-2">{s.nextProjectId}</span>}
                      {s.nextStudentName}
                    </p>
                    {s.nextProjectTitle && (
                      <p className="text-gray-400 text-sm mt-0.5 leading-snug">{s.nextProjectTitle}</p>
                    )}
                  </div>
                )}
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
