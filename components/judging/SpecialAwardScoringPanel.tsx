"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllStudents } from "@/lib/firebase/database";
import type { Student } from "@/lib/firebase/database";
import {
  SPECIAL_AWARDS,
  getSpecialAwardAssignmentsForJudge,
  getSpecialAwardScoresForJudge,
  getSpecialAwardCandidates,
  saveSpecialAwardScore,
  emptySpecialRubric,
  computeSpecialAwardTotal,
  type SpecialAward,
} from "@/lib/firebase/specialAwards";

interface SpecialAwardScoringPanelProps {
  judgeId: string;
}

export default function SpecialAwardScoringPanel({ judgeId }: SpecialAwardScoringPanelProps) {
  const [assignedAwards, setAssignedAwards] = useState<SpecialAward[]>([]);
  // candidateMap[awardId] = filtered student list for that award
  const [candidateMap, setCandidateMap] = useState<Record<string, Student[]>>({});
  const [activeAwardId, setActiveAwardId] = useState<string | null>(null);
  // rubrics[awardId][studentId] = rubric
  const [rubrics, setRubrics] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [notesMap, setNotesMap] = useState<Record<string, Record<string, string>>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [asgDocs, allStudents] = await Promise.all([
        getSpecialAwardAssignmentsForJudge(judgeId),
        getAllStudents(),
      ]);

      const awards = asgDocs
        .map((a) => SPECIAL_AWARDS.find((aw) => aw.id === a.awardId))
        .filter(Boolean) as SpecialAward[];
      setAssignedAwards(awards);

      if (awards.length > 0 && !activeAwardId) {
        setActiveAwardId(awards[0].id);
      }

      // For each award, fetch candidate IDs and filter students
      const newCandidateMap: Record<string, Student[]> = {};
      const newRubrics: Record<string, Record<string, Record<string, number>>> = {};
      const newNotes: Record<string, Record<string, string>> = {};

      for (const award of awards) {
        const candidateIds = await getSpecialAwardCandidates(award.id, judgeId);
        // If no candidates shortlisted yet, show all students; otherwise filter
        const awardStudents = candidateIds.length > 0
          ? allStudents.filter((s) => s.id && candidateIds.includes(s.id))
          : allStudents.filter((s) => s.id);
        newCandidateMap[award.id] = awardStudents;

        const scores = await getSpecialAwardScoresForJudge(judgeId, award.id);
        newRubrics[award.id] = {};
        newNotes[award.id] = {};
        for (const sc of scores) {
          newRubrics[award.id][sc.studentId] = { ...emptySpecialRubric(award.criteria), ...sc.rubric };
          newNotes[award.id][sc.studentId] = sc.notes || "";
        }
        for (const s of awardStudents) {
          if (!s.id) continue;
          if (!newRubrics[award.id][s.id]) newRubrics[award.id][s.id] = emptySpecialRubric(award.criteria);
          if (!newNotes[award.id][s.id]) newNotes[award.id][s.id] = "";
        }
      }

      setCandidateMap(newCandidateMap);
      setRubrics(newRubrics);
      setNotesMap(newNotes);
    } catch (e: unknown) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, [judgeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const updateRubric = (awardId: string, studentId: string, key: string, val: number) => {
    setRubrics((prev) => ({
      ...prev,
      [awardId]: {
        ...prev[awardId],
        [studentId]: { ...(prev[awardId]?.[studentId] ?? {}), [key]: val },
      },
    }));
  };

  const handleSave = async (award: SpecialAward, studentId: string) => {
    const rubric = rubrics[award.id]?.[studentId] ?? emptySpecialRubric(award.criteria);
    for (const c of award.criteria) {
      const v = Number(rubric[c.key]);
      if (Number.isNaN(v) || v < 0 || v > c.maxPoints) {
        setMessage({ type: "err", text: `Invalid score for "${c.label}" (0–${c.maxPoints} pts).` });
        return;
      }
    }
    const key = `${award.id}_${studentId}`;
    setSavingKey(key);
    setMessage(null);
    try {
      await saveSpecialAwardScore(
        award.id,
        judgeId,
        studentId,
        award.criteria,
        rubric,
        notesMap[award.id]?.[studentId] ?? ""
      );
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (e: unknown) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600 py-8">Loading special award assignments…</p>;
  }

  if (assignedAwards.length === 0) {
    return (
      <p className="text-gray-600 text-sm py-6 text-center bg-white rounded-lg border border-gray-200 px-4">
        You have no special award assignments. The fair director will assign you to a special award if applicable.
      </p>
    );
  }

  const activeAward = assignedAwards.find((a) => a.id === activeAwardId) ?? assignedAwards[0];
  const maxTotal = activeAward.criteria.reduce((s, c) => s + c.maxPoints, 0);
  const awardStudents = candidateMap[activeAward.id] ?? [];

  // Sort by score descending so judge can see who's leading
  const scoredStudents = [...awardStudents].sort((a, b) => {
    const ta = computeSpecialAwardTotal(activeAward.criteria, rubrics[activeAward.id]?.[a.id!] ?? {});
    const tb = computeSpecialAwardTotal(activeAward.criteria, rubrics[activeAward.id]?.[b.id!] ?? {});
    return tb - ta;
  });

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Award selector (if judge has multiple awards) */}
      {assignedAwards.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {assignedAwards.map((aw) => (
            <button
              key={aw.id}
              type="button"
              onClick={() => setActiveAwardId(aw.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                activeAwardId === aw.id
                  ? "bg-primary-blue text-white border-primary-blue"
                  : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              {aw.name}
            </button>
          ))}
        </div>
      )}

      {/* Active award header */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-4">
        <h2 className="text-lg font-bold text-indigo-900">{activeAward.name}</h2>
        <p className="text-sm text-indigo-700 mt-1">
          {scoredStudents.length > 0
            ? `Score each shortlisted candidate below using the award-specific rubric. The student with the highest total score will be recommended for this award.`
            : `No candidates have been shortlisted for this award yet. The fair director will add candidates from the admin dashboard.`}
        </p>
        <p className="text-xs text-indigo-600 mt-2 font-medium">
          Rubric criteria: {activeAward.criteria.map((c) => `${c.label} (${c.maxPoints} pts)`).join(" · ")}
        </p>
      </div>

      {/* Student list */}
      <div className="space-y-6">
        {scoredStudents.map((s, idx) => {
          if (!s.id) return null;
          const rubric = rubrics[activeAward.id]?.[s.id] ?? emptySpecialRubric(activeAward.criteria);
          const total = computeSpecialAwardTotal(activeAward.criteria, rubric);
          const key = `${activeAward.id}_${s.id}`;
          const isSaving = savingKey === key;
          const justSaved = savedKey === key;
          const hasAnyScore = total > 0 || (notesMap[activeAward.id]?.[s.id] || "").length > 0;

          return (
            <div
              key={s.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                total > 0 ? "border-indigo-200" : "border-gray-200"
              }`}
            >
              {/* Student header */}
              <div className={`border-b px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${total > 0 ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Student {idx + 1} of {scoredStudents.length}
                    {total > 0 && <span className="ml-2 text-indigo-600">· Scored</span>}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
                    {s.projectId || s.id}
                  </h3>
                  {s.projectTitle && (
                    <p className="text-sm text-gray-600 mt-0.5">{s.projectTitle}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-2xl font-bold ${total > 0 ? "text-indigo-700" : "text-gray-400"}`}>
                    {total}
                  </span>
                  <span className="text-sm text-gray-500"> / {maxTotal} pts</span>
                </div>
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* Research paper link */}
                {s.researchReportUrl ? (
                  <a
                    href={s.researchReportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-medium hover:opacity-90"
                  >
                    Open research paper (PDF)
                  </a>
                ) : (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    No research report uploaded yet for this student.
                  </p>
                )}

                {/* Rubric */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {activeAward.name} rubric — {maxTotal} pts total
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeAward.criteria.map((c) => (
                      <div key={c.key} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-900">
                          {c.label}{" "}
                          <span className="font-normal text-gray-500">(0–{c.maxPoints} pts)</span>
                        </label>
                        <p className="text-xs text-gray-500 leading-snug">{c.description}</p>
                        <input
                          type="number"
                          min={0}
                          max={c.maxPoints}
                          step={1}
                          value={rubric[c.key] ?? 0}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            const clamped = Number.isNaN(raw) ? 0 : Math.min(c.maxPoints, Math.max(0, raw));
                            updateRubric(activeAward.id, s.id!, c.key, clamped);
                          }}
                          className="w-full max-w-[110px] px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-base"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Notes (private)
                  </label>
                  <textarea
                    value={notesMap[activeAward.id]?.[s.id] ?? ""}
                    onChange={(e) =>
                      setNotesMap((prev) => ({
                        ...prev,
                        [activeAward.id]: {
                          ...prev[activeAward.id],
                          [s.id!]: e.target.value,
                        },
                      }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-base"
                    placeholder="Why this project deserves (or doesn't deserve) this award…"
                  />
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave(activeAward, s.id!)}
                    className="px-5 py-2.5 rounded-lg bg-primary-green text-white font-semibold hover:bg-primary-darkGreen disabled:opacity-50 text-sm min-h-[40px]"
                  >
                    {isSaving ? "Saving…" : hasAnyScore ? "Update score" : "Save score"}
                  </button>
                  {justSaved && (
                    <span className="text-sm text-green-600 font-medium">✓ Saved</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
