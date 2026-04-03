"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllStudents,
  getAllJudges,
  getCategories,
  type Student,
  type Judge,
  type Category,
} from "@/lib/firebase/database";
import {
  setJudgingAssignment,
  removeJudgingAssignment,
  getAllAssignments,
  getAllJudgeScores,
  clearAllJudgeScores,
  aggregateCategoryResults,
  aggregateFinalResults,
  exportScoresToCsv,
  exportDetailScoresToCsv,
  type JudgingPhase,
  type JudgingAssignment,
} from "@/lib/firebase/judging";

type SubTab = "assign" | "category" | "final";

export default function AdminJudgingScoring() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<SubTab>("assign");
  const [assignPhase, setAssignPhase] = useState<JudgingPhase>("category");
  const [students, setStudents] = useState<Student[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignments, setAssignments] = useState<JudgingAssignment[]>([]);
  const [scores, setScores] = useState<Awaited<ReturnType<typeof getAllJudgeScores>>>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clear scores
  const [clearingScores, setClearingScores] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Mock judge
  const [creatingMock, setCreatingMock] = useState(false);
  const [mockResult, setMockResult] = useState<{ email: string; password: string } | null>(null);

  const approvedJudges = useMemo(
    () => judges.filter((j) => j.adminApproved && j.id),
    [judges]
  );

  // Map of judgeId -> Set of categoryIds they are already assigned to in the category round
  const judgeCategoryAssignments = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of assignments) {
      if (a.phase !== "category" || !a.categoryId) continue;
      if (!map.has(a.judgeId)) map.set(a.judgeId, new Set());
      map.get(a.judgeId)!.add(a.categoryId);
    }
    return map;
  }, [assignments]);

  // Judges eligible for a given category:
  // - opted into this category (categoryIds includes catId)
  // - not already assigned to a DIFFERENT category
  const judgesForCategory = useCallback(
    (catId: string) =>
      approvedJudges.filter((j) => {
        if (!j.categoryIds?.includes(catId)) return false;
        const assignedCats = judgeCategoryAssignments.get(j.id!);
        if (!assignedCats) return true; // no assignments yet
        // Allow if their only assignments are within this same category
        for (const c of assignedCats) {
          if (c !== catId) return false;
        }
        return true;
      }),
    [approvedJudges, judgeCategoryAssignments]
  );

  // Judge IDs already used in the category round
  const categoryAssignedJudgeIds = useMemo(
    () => new Set(assignments.filter((a) => a.phase === "category").map((a) => a.judgeId)),
    [assignments]
  );

  // Final round eligible: approved + available in-person all day + NOT already in category round
  const finalRoundEligibleJudges = useMemo(
    () =>
      approvedJudges.filter(
        (j) =>
          j.availabilityApril18 === "in_person_full_day" &&
          !categoryAssignedJudgeIds.has(j.id!)
      ),
    [approvedJudges, categoryAssignedJudgeIds]
  );

  const isFinalJudge = useCallback(
    (judgeId: string) => assignments.some((a) => a.phase === "final" && a.judgeId === judgeId),
    [assignments]
  );

  const [finalBusyId, setFinalBusyId] = useState<string | null>(null);

  const toggleFinalJudge = async (judge: Judge, on: boolean) => {
    setFinalBusyId(judge.id!);
    setError(null);
    try {
      if (on) {
        // Assign this judge to every student for the final round
        await Promise.all(
          students.map((s) => setJudgingAssignment(judge.id!, s.id!, "final", null))
        );
      } else {
        // Remove all final-round assignments for this judge
        await Promise.all(
          students
            .filter((s) => isAssigned("final", judge.id!, s.id!))
            .map((s) => removeJudgingAssignment("final", judge.id!, s.id!))
        );
      }
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setFinalBusyId(null);
    }
  };

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [stu, jud, cat, asg, sc] = await Promise.all([
        getAllStudents(),
        getAllJudges(),
        getCategories(),
        getAllAssignments(),
        getAllJudgeScores(),
      ]);
      setStudents(stu);
      setJudges(jud);
      setCategories(cat.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setAssignments(asg);
      setScores(sc);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load judging data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleClearScores = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    setClearingScores(true);
    setError(null);
    try {
      const count = await clearAllJudgeScores();
      await loadAll();
      setClearConfirm(false);
      setError(null);
      alert(`Cleared ${count} score document(s).`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to clear scores");
    } finally {
      setClearingScores(false);
    }
  };

  const handleCreateMockJudge = async () => {
    if (!user) return;
    setCreatingMock(true);
    setError(null);
    setMockResult(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/create-mock-judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminIdToken: idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create mock judge");
      setMockResult({ email: data.email, password: data.password });
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create mock judge");
    } finally {
      setCreatingMock(false);
    }
  };

  const isAssigned = (phase: JudgingPhase, judgeId: string, studentId: string) =>
    assignments.some(
      (a) => a.phase === phase && a.judgeId === judgeId && a.studentId === studentId
    );

  const toggleAssign = async (
    phase: JudgingPhase,
    judgeId: string,
    studentId: string,
    categoryId: string | null,
    on: boolean
  ) => {
    const key = `${phase}-${judgeId}-${studentId}`;
    setBusyKey(key);
    setError(null);
    try {
      if (on) {
        await setJudgingAssignment(judgeId, studentId, phase, categoryId);
      } else {
        await removeJudgingAssignment(phase, judgeId, studentId);
      }
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyKey(null);
    }
  };

  const categoryMap = useMemo(() => {
    const m = new Map<string, Student[]>();
    for (const c of categories) {
      if (!c.id) continue;
      m.set(c.id, students.filter((s) => s.categoryId === c.id));
    }
    return m;
  }, [categories, students]);

  const unassignedStudents = useMemo(
    () => students.filter((s) => !s.categoryId),
    [students]
  );

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading judging data…</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Dev / testing tools */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Testing tools</p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={handleCreateMockJudge}
            disabled={creatingMock}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {creatingMock ? "Creating…" : "Create mock judge"}
          </button>
          <button
            type="button"
            onClick={handleClearScores}
            disabled={clearingScores}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
              clearConfirm
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
            }`}
          >
            {clearingScores ? "Clearing…" : clearConfirm ? "Confirm — delete all scores" : "Clear all scores"}
          </button>
          {clearConfirm && (
            <button
              type="button"
              onClick={() => setClearConfirm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel
            </button>
          )}
        </div>
        {mockResult && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm space-y-1">
            <p className="font-semibold text-green-800">Mock judge created (or recreated):</p>
            <p className="font-mono text-green-900">Email: {mockResult.email}</p>
            <p className="font-mono text-green-900">Password: {mockResult.password}</p>
            <p className="text-xs text-green-700 mt-1">Assign this judge to categories and students, then log in with these credentials to test scoring.</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {(
          [
            ["assign", "Assign judges"],
            ["category", "Category results"],
            ["final", "Final round results"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              subTab === id
                ? "bg-primary-blue text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === "assign" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-gray-700">Assignment round:</span>
            <button
              type="button"
              onClick={() => setAssignPhase("category")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                assignPhase === "category"
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-white border border-gray-300"
              }`}
            >
              Category judging
            </button>
            <button
              type="button"
              onClick={() => setAssignPhase("final")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                assignPhase === "final"
                  ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                  : "bg-white border border-gray-300"
              }`}
            >
              Final judging
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {assignPhase === "category"
              ? "Assign which judges score which students within each category. Only judges who marked the category as one they can judge are shown."
              : "Select which judges will participate in the final round. Only judges available in-person all day and not already in the category round are shown."}
          </p>

          {assignPhase === "category" && (
            <div className="space-y-8">
              {categories.map((cat) => {
                const catStudents = categoryMap.get(cat.id!) ?? [];
                const eligibleJudges = judgesForCategory(cat.id!);
                if (catStudents.length === 0) return null;
                return (
                  <div key={cat.id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      <p className="text-xs text-gray-500">
                        {catStudents.length} student(s) · {eligibleJudges.length} eligible judge(s) — only judges who marked this category on their application are shown.
                      </p>
                    </div>
                    {eligibleJudges.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-amber-800">
                        No approved judges have marked this category as one they can judge. Assign categories to judges under the Judges tab first.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-white">
                              <th className="text-left p-3 font-medium text-gray-700 sticky left-0 bg-white z-10 min-w-[140px]">
                                Student
                              </th>
                              {eligibleJudges.map((j) => (
                                <th
                                  key={j.id}
                                  className="p-2 text-center font-medium text-gray-600 whitespace-nowrap min-w-[100px]"
                                  title={j.email}
                                >
                                  <span className="block truncate max-w-[96px]">
                                    {j.firstName} {j.lastName?.[0]}.
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {catStudents.map((s) => (
                              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                                <td className="p-3 sticky left-0 bg-white">
                                  <div className="font-medium text-gray-900">
                                    {s.firstName} {s.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {s.projectTitle || "—"}
                                  </div>
                                </td>
                                {eligibleJudges.map((j) => {
                                  const key = `category-${j.id}-${s.id}`;
                                  const on = isAssigned("category", j.id!, s.id!);
                                  return (
                                    <td key={j.id} className="p-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={on}
                                        disabled={busyKey === key}
                                        onChange={(e) =>
                                          toggleAssign(
                                            "category",
                                            j.id!,
                                            s.id!,
                                            cat.id!,
                                            e.target.checked
                                          )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-primary-blue"
                                        aria-label={`Assign ${j.firstName} to ${s.firstName}`}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              {unassignedStudents.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <strong>{unassignedStudents.length}</strong> student(s) have no category assigned. Assign
                  categories under All Students first.
                </div>
              )}
            </div>
          )}

          {assignPhase === "final" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Eligible final-round judges must be available <strong>in-person all day</strong> and must not already be assigned to the category round. Selecting a judge assigns them to score all students.
              </p>
              {finalRoundEligibleJudges.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  No eligible final-round judges found. Judges must have selected &quot;In-person, full day&quot; availability during registration and must not already be assigned to the category round.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {finalRoundEligibleJudges.map((j) => {
                    const selected = isFinalJudge(j.id!);
                    const busy = finalBusyId === j.id;
                    return (
                      <label
                        key={j.id}
                        className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                          selected
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        } ${busy ? "opacity-60 pointer-events-none" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={busy}
                          onChange={(e) => toggleFinalJudge(j, e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {j.firstName} {j.lastName}
                          </p>
                          {j.institution && (
                            <p className="text-xs text-gray-500 truncate">{j.institution}</p>
                          )}
                          {j.areaOfExpertise && (
                            <p className="text-xs text-gray-500 truncate">{j.areaOfExpertise}</p>
                          )}
                          {selected && (
                            <span className="mt-1 inline-block text-xs font-medium text-indigo-700">
                              ✓ Final round judge
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {subTab === "category" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `njsrs_category_standings_${new Date().toISOString().slice(0, 10)}.csv`,
                  (() => {
                    const lines: string[] = [];
                    for (const cat of categories) {
                      if (!cat.id) continue;
                      const rows = aggregateCategoryResults(students, scores, cat.id);
                      if (rows.length === 0) continue;
                      lines.push(`Category,"${cat.name.replace(/"/g, '""')}"`);
                      lines.push(
                        exportScoresToCsv(
                          rows.map((r) => ({
                            studentId: r.studentId,
                            studentName: r.studentName,
                            projectTitle: r.projectTitle,
                            avgTotalScore: r.avgTotalScore,
                            avgRank: r.avgRank,
                            judgeCount: r.judgeCount,
                          })),
                          "category"
                        )
                      );
                      lines.push("");
                    }
                    return lines.join("\n");
                  })()
                )
              }
              className="bg-primary-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-darkGreen"
            >
              Export all category standings (CSV)
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `njsrs_all_judge_detail_scores_${new Date().toISOString().slice(0, 10)}.csv`,
                  exportDetailScoresToCsv(
                    scores.filter((s) => s.phase === "category"),
                    students,
                    judges
                  )
                )
              }
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Export category detail (per judge, per student)
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Rankings use average total rubric score first; when tied, lower average rank wins (rank 1 is best).
          </p>

          {categories.map((cat) => {
            if (!cat.id) return null;
            const rows = aggregateCategoryResults(students, scores, cat.id);
            if (rows.length === 0) return null;
            return (
              <div key={cat.id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <button
                    type="button"
                    onClick={() =>
                      downloadCsv(
                        `njsrs_category_${cat.id}_${new Date().toISOString().slice(0, 10)}.csv`,
                        exportScoresToCsv(
                          rows.map((r) => ({
                            studentId: r.studentId,
                            studentName: r.studentName,
                            projectTitle: r.projectTitle,
                            avgTotalScore: r.avgTotalScore,
                            avgRank: r.avgRank,
                            judgeCount: r.judgeCount,
                          })),
                          "category"
                        )
                      )
                    }
                    className="text-sm text-primary-blue hover:underline"
                  >
                    Export this category
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="p-3 w-10">#</th>
                        <th className="p-3">Student</th>
                        <th className="p-3">Project</th>
                        <th className="p-3">Avg score</th>
                        <th className="p-3">Avg rank</th>
                        <th className="p-3">Judges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={r.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-500">{idx + 1}</td>
                          <td className="p-3 font-medium text-gray-900">{r.studentName}</td>
                          <td className="p-3 text-gray-700 max-w-xs truncate">{r.projectTitle || "—"}</td>
                          <td className="p-3 tabular-nums">{r.avgTotalScore.toFixed(2)}</td>
                          <td className="p-3 tabular-nums">
                            {r.avgRank != null ? r.avgRank.toFixed(2) : "—"}
                          </td>
                          <td className="p-3 text-gray-600">{r.judgeCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === "final" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `njsrs_final_standings_${new Date().toISOString().slice(0, 10)}.csv`,
                  exportScoresToCsv(
                    aggregateFinalResults(students, scores).map((r) => ({
                      studentId: r.studentId,
                      studentName: r.studentName,
                      projectTitle: r.projectTitle,
                      avgTotalScore: r.avgTotalScore,
                      avgRank: r.avgRank,
                      judgeCount: r.judgeCount,
                    })),
                    "final"
                  )
                )
              }
              className="bg-primary-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-darkGreen"
            >
              Export final standings (CSV)
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `njsrs_final_detail_scores_${new Date().toISOString().slice(0, 10)}.csv`,
                  exportDetailScoresToCsv(
                    scores.filter((s) => s.phase === "final"),
                    students,
                    judges
                  )
                )
              }
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Export final detail (per judge, per student)
            </button>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600 bg-gray-50">
                    <th className="p-3 w-10">#</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Avg score</th>
                    <th className="p-3">Avg rank</th>
                    <th className="p-3">Judges</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregateFinalResults(students, scores).map((r, idx) => (
                    <tr key={r.studentId} className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-500">{idx + 1}</td>
                      <td className="p-3 font-medium text-gray-900">{r.studentName}</td>
                      <td className="p-3 text-gray-700 max-w-xs truncate">{r.projectTitle || "—"}</td>
                      <td className="p-3 tabular-nums">{r.avgTotalScore.toFixed(2)}</td>
                      <td className="p-3 tabular-nums">
                        {r.avgRank != null ? r.avgRank.toFixed(2) : "—"}
                      </td>
                      <td className="p-3 text-gray-600">{r.judgeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
