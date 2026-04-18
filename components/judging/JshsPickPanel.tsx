"use client";

import { useEffect, useState } from "react";
import { getAllAssignments } from "@/lib/firebase/judging";
import { getStudentsByIds } from "@/lib/firebase/database";
import type { Student } from "@/lib/firebase/database";
import { saveJshsPicks, getJshsPicks } from "@/lib/firebase/jshsPicks";

const MAX_PICKS = 5;

interface Props {
  judgeId: string;
}

export default function JshsPickPanel({ judgeId }: Props) {
  const [finalists, setFinalists] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [judgeId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignments, existingPicks] = await Promise.all([
        getAllAssignments("final"),
        getJshsPicks(judgeId),
      ]);

      const studentIds = [...new Set(assignments.map((a) => a.studentId))];
      const studentsMap = studentIds.length > 0 ? await getStudentsByIds(studentIds) : new Map<string, Student>();
      const students = Array.from(studentsMap.values());

      // Sort by projectId then name
      students.sort((a, b) => {
        const pid = (a.projectId ?? "").localeCompare(b.projectId ?? "");
        if (pid !== 0) return pid;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });

      setFinalists(students);
      if (existingPicks) setSelected(existingPicks.studentIds);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load finalists");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (studentId: string) => {
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(studentId)) return prev.filter((id) => id !== studentId);
      if (prev.length >= MAX_PICKS) return prev; // already at max, ignore
      return [...prev, studentId];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveJshsPicks(judgeId, selected);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save picks");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading finalists…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Explanation banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-300 px-5 py-4">
        <p className="text-sm font-bold text-amber-900 mb-1">JSHS Judge — Top 5 Selection</p>
        <p className="text-sm text-amber-800">
          Review the finalists below and select your top 5 presentations. Your selections will be
          recorded separately and <strong>will not affect the official final-round scores</strong> or
          standings.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {finalists.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-center text-sm text-amber-900">
          No finalists have been assigned yet. Check back after category judging is complete.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Select up to <strong>{MAX_PICKS} finalists</strong> — {selected.length} of {MAX_PICKS} chosen.
          </p>

          <div className="space-y-2">
            {finalists.map((s) => {
              const checked = selected.includes(s.id!);
              const rank = checked ? selected.indexOf(s.id!) + 1 : null;
              const atMax = !checked && selected.length >= MAX_PICKS;
              return (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-colors ${
                    checked
                      ? "border-amber-400 bg-amber-50 cursor-pointer"
                      : atMax
                      ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={atMax}
                    onChange={() => toggle(s.id!)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-500 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.projectId && (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {s.projectId}
                        </span>
                      )}
                      <p className="font-semibold text-gray-900">
                        {s.firstName} {s.lastName}
                      </p>
                      {rank !== null && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Pick #{rank}
                        </span>
                      )}
                    </div>
                    {s.projectTitle && (
                      <p className="text-sm text-gray-600 mt-0.5">{s.projectTitle}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selected.length === 0}
              className="px-5 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : `Save my top ${selected.length === 0 ? "picks" : `${selected.length}`}`}
            </button>
            {saved && (
              <p className="text-sm font-medium text-green-700">
                ✓ Picks saved successfully
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400">
            You can update your picks at any time before the competition ends. The order in which
            you selected the projects is recorded (first selected = Pick #1).
          </p>
        </>
      )}
    </div>
  );
}
