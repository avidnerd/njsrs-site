"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
  aggregateCategoryResults,
  aggregateFinalResults,
  exportScoresToCsv,
  exportDetailScoresToCsv,
  type JudgingPhase,
  type JudgingAssignment,
} from "@/lib/firebase/judging";

type SubTab = "assign" | "category" | "final";

export default function AdminJudgingScoring() {
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

  const approvedJudges = useMemo(
    () => judges.filter((j) => j.adminApproved && j.id),
    [judges]
  );

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
              ? "Assign which judges score which students within each category. Judges only see students you assign here."
              : "Final round: assign judges to students (e.g. finalists). categoryId is not used for final phase."}
          </p>

          {assignPhase === "category" && (
            <div className="space-y-8">
              {categories.map((cat) => {
                const catStudents = categoryMap.get(cat.id!) ?? [];
                if (catStudents.length === 0) return null;
                return (
                  <div key={cat.id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      <p className="text-xs text-gray-500">
                        {catStudents.length} student(s) — check each judge who should score this student.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-white">
                            <th className="text-left p-3 font-medium text-gray-700 sticky left-0 bg-white z-10 min-w-[140px]">
                              Student
                            </th>
                            {approvedJudges.map((j) => (
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
                              {approvedJudges.map((j) => {
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
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
                        Student
                      </th>
                      {approvedJudges.map((j) => (
                        <th
                          key={j.id}
                          className="p-2 text-center font-medium text-gray-600 whitespace-nowrap min-w-[100px]"
                        >
                          <span className="block truncate max-w-[96px]">
                            {j.firstName} {j.lastName?.[0]}.
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100">
                        <td className="p-3 sticky left-0 bg-white">
                          <div className="font-medium text-gray-900">
                            {s.firstName} {s.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {categories.find((c) => c.id === s.categoryId)?.name || "No category"}
                          </div>
                        </td>
                        {approvedJudges.map((j) => {
                          const on = isAssigned("final", j.id!, s.id!);
                          return (
                            <td key={j.id} className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={(e) =>
                                  toggleAssign("final", j.id!, s.id!, null, e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-primary-blue"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
