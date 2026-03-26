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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rubrics, setRubrics] = useState<Record<string, JudgingRubricScores>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [rankMap, setRankMap] = useState<Record<string, number | "">>({});
  const [savingId, setSavingId] = useState<string | null>(null);
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

  const validateRanksForGroup = (studentIds: string[]): string | null => {
    const n = studentIds.length;
    if (n === 0) return null;
    const ranks: number[] = [];
    for (const sid of studentIds) {
      const r = rankMap[sid];
      if (r === "" || r == null) return "Enter a rank (1 = best) for every assigned student in this group.";
      const num = Number(r);
      if (!Number.isInteger(num) || num < 1 || num > n)
        return `Rank must be an integer from 1 to ${n} for each project in this group.`;
      ranks.push(num);
    }
    const sorted = [...ranks].sort((a, b) => a - b);
    for (let i = 0; i < n; i++) {
      if (sorted[i] !== i + 1) return "Ranks must be unique and use every number from 1 to n (no ties).";
    }
    return null;
  };

  const handleSave = async (studentId: string, groupStudentIds: string[]) => {
    setMessage(null);
    const rankErr = validateRanksForGroup(groupStudentIds);
    if (rankErr) {
      setMessage({ type: "err", text: rankErr });
      return;
    }
    const rubric = rubrics[studentId] || emptyRubricScores();
    for (const c of RUBRIC_CRITERIA) {
      const v = Number(rubric[c.key]);
      if (Number.isNaN(v) || v < 0 || v > c.maxPoints) {
        setMessage({ type: "err", text: `Invalid score for ${c.shortLabel} (0–${c.maxPoints}).` });
        return;
      }
    }
    const assign = assignments.find((a) => a.studentId === studentId);
    const categoryId = phase === "category" ? assign?.categoryId ?? null : null;
    setSavingId(studentId);
    try {
      await saveJudgeScore(
        phase,
        judgeId,
        studentId,
        categoryId,
        rubric,
        Number(rankMap[studentId]),
        notesMap[studentId] || ""
      );
      setMessage({ type: "ok", text: "Saved." });
    } catch (e: unknown) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSavingId(null);
    }
  };

  const updateRubric = (studentId: string, key: keyof JudgingRubricScores, val: number) => {
    setRubrics((prev) => ({
      ...prev,
      [studentId]: { ...emptyRubricScores(), ...prev[studentId], [key]: val },
    }));
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
    <div className="space-y-8">
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
        return (
          <section key={group.key} className="space-y-4">
            <h2 className="text-lg font-semibold text-primary-blue border-b border-gray-200 pb-2">
              {phase === "category" ? group.title : "Final round"}
              {phase === "category" && (
                <span className="block text-xs font-normal text-gray-500 mt-1">
                  Rank only among students in this category (1 = best in this group).
                </span>
              )}
              {phase === "final" && (
                <span className="block text-xs font-normal text-gray-500 mt-1">
                  Rank among all final-round projects assigned to you (1 = best).
                </span>
              )}
            </h2>

            <ol className="space-y-3">
              {group.items.map((a) => {
                const s = students.get(a.studentId);
                const open = expandedId === a.studentId;
                const rubric = rubrics[a.studentId] || emptyRubricScores();
                const total = computeRubricTotal(rubric);
                return (
                  <li
                    key={a.studentId}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : a.studentId)}
                      className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          {s ? `${s.firstName} ${s.lastName}` : a.studentId}
                        </span>
                        {s?.projectTitle && (
                          <span className="block text-xs text-gray-600 truncate max-w-[280px] sm:max-w-md">
                            {s.projectTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>
                          Score:{" "}
                          <strong className="text-gray-900">
                            {total} / {RUBRIC_MAX_TOTAL}
                          </strong>
                        </span>
                        <span className="text-primary-blue">{open ? "▼" : "▶"}</span>
                      </div>
                    </button>

                    {open && (
                      <div className="px-4 py-4 space-y-4 border-t border-gray-100">
                        {s?.researchReportUrl ? (
                          <a
                            href={s.researchReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary-blue text-white text-sm font-medium hover:opacity-90 break-all"
                          >
                            Open research paper (PDF)
                          </a>
                        ) : (
                          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                            No research report uploaded yet for this student.
                          </p>
                        )}

                        <div className="space-y-4">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                            JSHS-style rubric (100 pts total)
                          </p>
                          {RUBRIC_CRITERIA.map((c) => (
                            <div key={c.key} className="space-y-1">
                              <label className="block text-sm font-medium text-gray-900">
                                {c.label}{" "}
                                <span className="text-gray-500 font-normal">
                                  (0–{c.maxPoints} pts)
                                </span>
                              </label>
                              <p className="text-xs text-gray-500 leading-snug">{c.description}</p>
                              <input
                                type="number"
                                min={0}
                                max={c.maxPoints}
                                step={c.maxPoints <= 5 ? 1 : 1}
                                value={rubric[c.key]}
                                onChange={(e) =>
                                  updateRubric(a.studentId, c.key, Number(e.target.value) || 0)
                                }
                                className="w-full max-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-base"
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            Notes (private to scoring)
                          </label>
                          <textarea
                            value={notesMap[a.studentId] ?? ""}
                            onChange={(e) =>
                              setNotesMap((prev) => ({ ...prev, [a.studentId]: e.target.value }))
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-base"
                            placeholder="Observations, questions, conflicts of interest, etc."
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Rank in this group (1 = best)
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
                              className="w-full max-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-base"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              You must assign each rank from 1 to {groupIds.length} exactly once in
                              this group.
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={savingId === a.studentId}
                            onClick={() => handleSave(a.studentId, groupIds)}
                            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary-green text-white font-semibold hover:bg-primary-darkGreen disabled:opacity-50 text-base min-h-[44px]"
                          >
                            {savingId === a.studentId ? "Saving…" : "Save score & rank"}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
