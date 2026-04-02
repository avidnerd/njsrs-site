"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getStudent, getCategories } from "@/lib/firebase/database";
import type { Student, Category } from "@/lib/firebase/database";
import {
  getAssignmentsForJudge,
  getJudgeScore,
  saveJudgeScore,
  RUBRIC_CRITERIA,
  RUBRIC_MAX_TOTAL,
  emptyRubricScores,
  computeRubricTotal,
  type JudgingPhase,
  type JudgingRubricScores,
  type JudgingAssignment,
} from "@/lib/firebase/judging";

interface JudgeScoringPanelProps {
  judgeId: string;
  phase: JudgingPhase;
}

export default function JudgeScoringPanel({ judgeId, phase }: JudgeScoringPanelProps) {
  const [assignments, setAssignments] = useState<JudgingAssignment[]>([]);
  const [categoryNames, setCategoryNames] = useState<Map<string, string>>(new Map());
  const [students, setStudents] = useState<Map<string, Student>>(new Map());
  const [loading, setLoading] = useState(true);
  const [rubrics, setRubrics] = useState<Record<string, JudgingRubricScores>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [rankMap, setRankMap] = useState<Record<string, number | "">>({});
  const [savingScoresId, setSavingScoresId] = useState<string | null>(null);
  const [savingRanksKey, setSavingRanksKey] = useState<string | null>(null);
  const [savedScoresId, setSavedScoresId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const cats: Category[] = await getCategories();
      const cn = new Map<string, string>();
      cats.forEach((c) => c.id && cn.set(c.id, c.name));
      setCategoryNames(cn);
      const assigns = await getAssignmentsForJudge(judgeId, phase);
      setAssignments(assigns);
      const stuMap = new Map<string, Student>();
      const r: Record<string, JudgingRubricScores> = {};
      const n: Record<string, string> = {};
      const rk: Record<string, number | ""> = {};
      for (const a of assigns) {
        const st = await getStudent(a.studentId);
        if (st?.id) stuMap.set(st.id, st);
        const existing = await getJudgeScore(phase, judgeId, a.studentId);
        if (existing) {
          r[a.studentId] = { ...emptyRubricScores(), ...existing.rubric };
          n[a.studentId] = existing.notes || "";
          rk[a.studentId] = existing.rank ?? "";
        } else {
          r[a.studentId] = emptyRubricScores();
          n[a.studentId] = "";
          rk[a.studentId] = "";
        }
      }
      setStudents(stuMap);
      setRubrics(r);
      setNotesMap(n);
      setRankMap(rk);
    } catch (e: unknown) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, [judgeId, phase]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    if (phase === "final") {
      return [{ key: "final", title: "Final round", items: assignments }];
    }
    const byCat = new Map<string, JudgingAssignment[]>();
    for (const a of assignments) {
      const cid = a.categoryId || "unknown";
      if (!byCat.has(cid)) byCat.set(cid, []);
      byCat.get(cid)!.push(a);
    }
    return Array.from(byCat.entries()).map(([key, items]) => ({
      key,
      title:
        key === "unknown"
          ? "Uncategorized"
          : categoryNames.get(key) || `Category ${key}`,
      items,
    }));
  }, [assignments, phase, categoryNames]);

  const updateRubric = (studentId: string, key: keyof JudgingRubricScores, val: number) => {
    setRubrics((prev) => ({
      ...prev,
      [studentId]: { ...emptyRubricScores(), ...prev[studentId], [key]: val },
    }));
  };

  // Save rubric + notes for one student; preserve the existing rank.
  const handleSaveScores = async (studentId: string) => {
    const rubric = rubrics[studentId] || emptyRubricScores();
    for (const c of RUBRIC_CRITERIA) {
      const v = Number(rubric[c.key]);
      if (Number.isNaN(v) || v < 0 || v > c.maxPoints) {
        setMessage({ type: "err", text: `Invalid score for "${c.shortLabel}" (0–${c.maxPoints} pts).` });
        return;
      }
    }
    const assign = assignments.find((a) => a.studentId === studentId);
    const categoryId = phase === "category" ? assign?.categoryId ?? null : null;
    const existingRank = rankMap[studentId];
    setSavingScoresId(studentId);
    setMessage(null);
    try {
      await saveJudgeScore(
        phase,
        judgeId,
        studentId,
        categoryId,
        rubric,
        existingRank !== "" ? Number(existingRank) : null,
        notesMap[studentId] || ""
      );
      setSavedScoresId(studentId);
      setTimeout(() => setSavedScoresId(null), 2000);
    } catch (e: unknown) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSavingScoresId(null);
    }
  };

  // Validate + save ranks for every student in a group.
  const handleSaveRanks = async (groupStudentIds: string[], categoryId: string | null) => {
    const n = groupStudentIds.length;
    const ranks: number[] = [];
    for (const sid of groupStudentIds) {
      const r = rankMap[sid];
      if (r === "" || r == null) {
        setMessage({ type: "err", text: "Enter a rank (1 = best) for every student before submitting." });
        return;
      }
      const num = Number(r);
      if (!Number.isInteger(num) || num < 1 || num > n) {
        setMessage({ type: "err", text: `Each rank must be an integer from 1 to ${n}.` });
        return;
      }
      ranks.push(num);
    }
    const sorted = [...ranks].sort((a, b) => a - b);
    for (let i = 0; i < n; i++) {
      if (sorted[i] !== i + 1) {
        setMessage({ type: "err", text: "Ranks must be unique and use every number from 1 to " + n + " (no ties or gaps)." });
        return;
      }
    }
    setSavingRanksKey(groupStudentIds.join(","));
    setMessage(null);
    try {
      await Promise.all(
        groupStudentIds.map((sid) =>
          saveJudgeScore(
            phase,
            judgeId,
            sid,
            categoryId,
            rubrics[sid] || emptyRubricScores(),
            Number(rankMap[sid]),
            notesMap[sid] || ""
          )
        )
      );
      setMessage({ type: "ok", text: "Rankings saved." });
    } catch (e: unknown) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSavingRanksKey(null);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600 py-8">Loading assignments…</p>;
  }

  if (assignments.length === 0) {
    return (
      <p className="text-gray-600 text-sm py-6 text-center bg-white rounded-lg border border-gray-200 px-4">
        No {phase === "category" ? "category" : "final"} assignments yet. The fair director will assign
        students to you when judging opens.
      </p>
    );
  }

  return (
    <div className="space-y-12">
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

      {grouped.map((group) => {
        const groupIds = group.items.map((a) => a.studentId);
        const catId = phase === "category" ? group.items[0]?.categoryId ?? null : null;

        return (
          <section key={group.key} className="space-y-6">
            {/* Group header */}
            <div className="border-b-2 border-primary-blue pb-2">
              <h2 className="text-xl font-bold text-primary-blue">{group.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {phase === "category"
                  ? `${groupIds.length} student(s) in this category — complete scores and notes for each, then submit your rankings at the bottom.`
                  : `${groupIds.length} student(s) in the final round — complete scores and notes for each, then submit your rankings at the bottom.`}
              </p>
            </div>

            {/* One full section per student */}
            {group.items.map((a, idx) => {
              const s = students.get(a.studentId);
              const rubric = rubrics[a.studentId] || emptyRubricScores();
              const total = computeRubricTotal(rubric);
              const isSaving = savingScoresId === a.studentId;
              const justSaved = savedScoresId === a.studentId;

              return (
                <div
                  key={a.studentId}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Student header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Student {idx + 1} of {groupIds.length}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
                        {s ? `${s.firstName} ${s.lastName}` : a.studentId}
                      </h3>
                      {s?.projectTitle && (
                        <p className="text-sm text-gray-600 mt-0.5">{s.projectTitle}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-bold text-primary-blue">{total}</span>
                      <span className="text-sm text-gray-500"> / {RUBRIC_MAX_TOTAL} pts</span>
                    </div>
                  </div>

                  <div className="px-5 py-5 space-y-6">
                    {/* Research paper link */}
                    {s?.researchReportUrl ? (
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
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                        JSHS-style rubric — {RUBRIC_MAX_TOTAL} pts total
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {RUBRIC_CRITERIA.map((c) => (
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
                              value={rubric[c.key]}
                              onChange={(e) =>
                                updateRubric(a.studentId, c.key, Number(e.target.value) || 0)
                              }
                              className="w-full max-w-[110px] px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-base"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Notes (private — visible only to you during ranking)
                      </label>
                      <textarea
                        value={notesMap[a.studentId] ?? ""}
                        onChange={(e) =>
                          setNotesMap((prev) => ({ ...prev, [a.studentId]: e.target.value }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-base"
                        placeholder="Strengths, weaknesses, questions, observations…"
                      />
                    </div>

                    {/* Save scores button */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveScores(a.studentId)}
                        className="px-5 py-2.5 rounded-lg bg-primary-green text-white font-semibold hover:bg-primary-darkGreen disabled:opacity-50 text-sm min-h-[40px]"
                      >
                        {isSaving ? "Saving…" : "Save scores & notes"}
                      </button>
                      {justSaved && (
                        <span className="text-sm text-green-600 font-medium">✓ Saved</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Rankings section for this group */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-indigo-900">
                  Submit Rankings — {group.title}
                </h3>
                <p className="text-sm text-indigo-700 mt-1">
                  Assign each student a unique rank from 1 to {groupIds.length} (1 = best).
                  Review your scores and notes below before submitting.
                </p>
              </div>

              <div className="space-y-3">
                {group.items.map((a) => {
                  const s = students.get(a.studentId);
                  const rubric = rubrics[a.studentId] || emptyRubricScores();
                  const total = computeRubricTotal(rubric);
                  const notes = notesMap[a.studentId] || "";

                  return (
                    <div
                      key={a.studentId}
                      className="bg-white rounded-lg border border-indigo-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {s ? `${s.firstName} ${s.lastName}` : a.studentId}
                        </p>
                        {s?.projectTitle && (
                          <p className="text-xs text-gray-500 truncate">{s.projectTitle}</p>
                        )}
                        <p className="text-xs text-indigo-700 mt-1">
                          Score: <strong>{total}/{RUBRIC_MAX_TOTAL}</strong>
                          {notes && (
                            <span className="ml-3 text-gray-500 italic truncate max-w-[260px] inline-block align-bottom">
                              "{notes.length > 80 ? notes.slice(0, 80) + "…" : notes}"
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Rank:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={groupIds.length}
                          value={rankMap[a.studentId] ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRankMap((prev) => ({
                              ...prev,
                              [a.studentId]: v === "" ? "" : Number(v),
                            }));
                          }}
                          className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-gray-900 text-base text-center"
                          placeholder="—"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={savingRanksKey === groupIds.join(",")}
                onClick={() => handleSaveRanks(groupIds, catId)}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 text-base"
              >
                {savingRanksKey === groupIds.join(",") ? "Saving rankings…" : "Submit rankings"}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
