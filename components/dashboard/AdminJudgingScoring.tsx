"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllStudents,
  getAllJudges,
  getCategories,
  updateJudgeFinalRoundStatus,
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
  promoteFirstPlaceToFinal,
  exportScoresToCsv,
  exportDetailScoresToCsv,
  type JudgingPhase,
  type JudgingAssignment,
} from "@/lib/firebase/judging";
import {
  SPECIAL_AWARDS,
  getAllSpecialAwardAssignments,
  getAllSpecialAwardScores,
  setSpecialAwardAssignment,
  removeSpecialAwardAssignment,
  getAllSpecialAwardCandidates,
  setSpecialAwardCandidates,
  type SpecialAwardAssignment,
  type SpecialAwardScore,
} from "@/lib/firebase/specialAwards";

type SubTab = "assign" | "special" | "category" | "final" | "specialResults";

export default function AdminJudgingScoring() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<SubTab>("assign");
  const [assignPhase, setAssignPhase] = useState<JudgingPhase>("category");
  const [students, setStudents] = useState<Student[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignments, setAssignments] = useState<JudgingAssignment[]>([]);
  const [scores, setScores] = useState<Awaited<ReturnType<typeof getAllJudgeScores>>>([]);
  const [specialAssignments, setSpecialAssignments] = useState<(SpecialAwardAssignment & { id: string })[]>([]);
  const [specialCandidates, setSpecialCandidates] = useState<Record<string, string[]>>({});
  const [specialScores, setSpecialScores] = useState<(SpecialAwardScore & { id: string })[]>([]);
  const [savingCandidatesId, setSavingCandidatesId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [specialBusyKey, setSpecialBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clear scores
  const [clearingScores, setClearingScores] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Mock judge
  const [creatingMock, setCreatingMock] = useState(false);
  const [mockResult, setMockResult] = useState<{ email: string; password: string } | null>(null);

  // Mock student
  const [creatingMockStudent, setCreatingMockStudent] = useState(false);
  const [mockStudentResult, setMockStudentResult] = useState<{ email: string; password: string } | null>(null);

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

  // Judge IDs assigned to any special award
  const specialAssignedJudgeIds = useMemo(
    () => new Set(specialAssignments.map((a) => a.judgeId)),
    [specialAssignments]
  );

  // Judge IDs designated as final round judges (flag on judge doc)
  const finalAssignedJudgeIds = useMemo(
    () => new Set(judges.filter((j) => j.finalRoundJudge && j.id).map((j) => j.id!)),
    [judges]
  );

  // Final round eligible: approved + in-person full day + NOT in category round + NOT in special awards
  const finalRoundEligibleJudges = useMemo(
    () =>
      approvedJudges.filter(
        (j) =>
          j.availabilityApril18 === "in_person_full_day" &&
          !categoryAssignedJudgeIds.has(j.id!) &&
          !specialAssignedJudgeIds.has(j.id!)
      ),
    [approvedJudges, categoryAssignedJudgeIds, specialAssignedJudgeIds]
  );

  const isFinalJudge = useCallback(
    (judgeId: string) => judges.some((j) => j.id === judgeId && j.finalRoundJudge === true),
    [judges]
  );

  const [finalBusyId, setFinalBusyId] = useState<string | null>(null);
  const [promotingFinalists, setPromotingFinalists] = useState(false);
  const [promoteResult, setPromoteResult] = useState<string | null>(null);

  const toggleFinalJudge = async (judge: Judge, on: boolean) => {
    setFinalBusyId(judge.id!);
    setError(null);
    try {
      await updateJudgeFinalRoundStatus(judge.id!, on);
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setFinalBusyId(null);
    }
  };

  const handlePromoteFirstPlace = async () => {
    setPromotingFinalists(true);
    setPromoteResult(null);
    setError(null);
    try {
      const finalJudgeIds = judges.filter((j) => j.finalRoundJudge && j.id).map((j) => j.id!);
      const count = await promoteFirstPlaceToFinal(categories, students, scores, finalJudgeIds);
      await loadAll();
      setPromoteResult(`${count} first-place winner(s) assigned to ${finalJudgeIds.length} final round judge(s).`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Promotion failed");
    } finally {
      setPromotingFinalists(false);
    }
  };

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [stu, jud, cat, asg, sc, spAsg, spCand, spSc] = await Promise.all([
        getAllStudents(),
        getAllJudges(),
        getCategories(),
        getAllAssignments(),
        getAllJudgeScores(),
        getAllSpecialAwardAssignments(),
        getAllSpecialAwardCandidates(),
        getAllSpecialAwardScores(),
      ]);
      setStudents(stu);
      setJudges(jud);
      setCategories(cat.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setAssignments(asg);
      setScores(sc);
      setSpecialAssignments(spAsg);
      setSpecialCandidates(spCand);
      setSpecialScores(spSc);
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

  const handleCreateMockStudent = async () => {
    if (!user) return;
    setCreatingMockStudent(true);
    setError(null);
    setMockStudentResult(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/create-mock-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminIdToken: idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create mock student");
      setMockStudentResult({ email: data.email, password: data.password });
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create mock student");
    } finally {
      setCreatingMockStudent(false);
    }
  };

  // Judges eligible for special awards: in-person full day + not in final round + not already assigned to another special award
  // (category judges ARE allowed to also judge special awards)
  const specialEligibleJudges = useMemo(
    () =>
      approvedJudges.filter(
        (j) =>
          j.availabilityApril18 === "in_person_full_day" &&
          !finalAssignedJudgeIds.has(j.id!) &&
          !specialAssignedJudgeIds.has(j.id!)
      ),
    [approvedJudges, finalAssignedJudgeIds, specialAssignedJudgeIds]
  );

  const isSpecialAssigned = (awardId: string, judgeId: string) =>
    specialAssignments.some((a) => a.awardId === awardId && a.judgeId === judgeId);

  const toggleSpecialAssign = async (awardId: string, judge: Judge, on: boolean) => {
    const key = `${awardId}_${judge.id}`;
    setSpecialBusyKey(key);
    setError(null);
    try {
      if (on) {
        await setSpecialAwardAssignment(awardId, judge.id!);
      } else {
        await removeSpecialAwardAssignment(awardId, judge.id!);
      }
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSpecialBusyKey(null);
    }
  };

  const candidatesKey = (awardId: string, judgeId: string) => `${awardId}_${judgeId}`;

  const toggleCandidate = (awardId: string, judgeId: string, studentId: string) => {
    const key = candidatesKey(awardId, judgeId);
    setSpecialCandidates((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId];
      return { ...prev, [key]: next };
    });
  };

  const saveCandidates = async (awardId: string, judgeId: string) => {
    const key = candidatesKey(awardId, judgeId);
    setSavingCandidatesId(key);
    setError(null);
    try {
      await setSpecialAwardCandidates(awardId, judgeId, specialCandidates[key] ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save candidates");
    } finally {
      setSavingCandidatesId(null);
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
            onClick={handleCreateMockStudent}
            disabled={creatingMockStudent}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
          >
            {creatingMockStudent ? "Creating…" : "Create mock student"}
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
        {mockStudentResult && (
          <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 text-sm space-y-1">
            <p className="font-semibold text-teal-800">Mock student created (or recreated):</p>
            <p className="font-mono text-teal-900">Email: {mockStudentResult.email}</p>
            <p className="font-mono text-teal-900">Password: {mockStudentResult.password}</p>
            <p className="text-xs text-teal-700 mt-1">Log in as this student to test the student dashboard, uploads, guest registration, etc.</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {(
          [
            ["assign", "Assign judges"],
            ["special", "Special awards"],
            ["category", "Category results"],
            ["final", "Final round results"],
            ["specialResults", "Special award results"],
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
              {/* Promote first-place winners */}
              {finalAssignedJudgeIds.size > 0 && (
                <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Assign first-place winners to final round</p>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      Once category judging is complete, click below to automatically assign the #1-ranked student from each category as a finalist. All designated final round judges will be assigned to score them.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={promotingFinalists}
                    onClick={handlePromoteFirstPlace}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {promotingFinalists ? "Assigning…" : "Promote first-place winners to final round"}
                  </button>
                  {promoteResult && (
                    <p className="text-sm text-green-700 font-medium">✓ {promoteResult}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {subTab === "special" && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Assign one judge per special award. Only judges who selected <strong>in-person, full day</strong> and are not already assigned to the category round are shown. The assigned judge will score all students using the award-specific rubric and select the winner.
          </p>
          {specialEligibleJudges.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No eligible judges found. Judges must have selected &quot;In-person, full day&quot; availability and must not already be assigned to the category round.
            </div>
          )}
          <div className="space-y-4">
            {SPECIAL_AWARDS.map((award) => {
              const assignedJudges = approvedJudges.filter((j) => isSpecialAssigned(award.id, j.id!));
              const atMax = assignedJudges.length >= 2;
              return (
                <div
                  key={award.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <h3 className="font-semibold text-gray-900 text-sm">{award.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Rubric: {award.criteria.map((c) => `${c.label} (${c.maxPoints} pts)`).join(" · ")}
                    </p>
                  </div>
                  <div className="px-4 py-4 space-y-5">
                    {/* Assigned judges — each with their own candidate picker */}
                    {assignedJudges.length > 0 && (
                      <div className="space-y-4">
                        {assignedJudges.map((j) => {
                          const key = candidatesKey(award.id, j.id!);
                          const selected = specialCandidates[key] ?? [];
                          return (
                            <div key={j.id} className="rounded-lg border border-gray-200 p-3 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-green-800 font-medium">
                                    ✓ {j.firstName} {j.lastName}
                                    {j.institution ? ` — ${j.institution}` : ""}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={specialBusyKey === `${award.id}_${j.id}`}
                                    onClick={() => toggleSpecialAssign(award.id, j, false)}
                                    className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  disabled={savingCandidatesId === key}
                                  onClick={() => saveCandidates(award.id, j.id!)}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-primary-blue text-white hover:opacity-90 disabled:opacity-50 shrink-0"
                                >
                                  {savingCandidatesId === key ? "Saving…" : `Save shortlist (${selected.length})`}
                                </button>
                              </div>
                              {students.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No students registered yet.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                                  {students.map((s) => {
                                    const checked = selected.includes(s.id!);
                                    return (
                                      <label
                                        key={s.id}
                                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                                          checked
                                            ? "border-primary-blue bg-blue-50"
                                            : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleCandidate(award.id, j.id!, s.id!)}
                                          className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary-blue shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">
                                            {s.firstName} {s.lastName}
                                          </p>
                                          {s.projectTitle && (
                                            <p className="text-xs text-gray-500 truncate">{s.projectTitle}</p>
                                          )}
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Picker for adding new judges — hidden when at max (2) */}
                    {!atMax && (
                      <div className="flex flex-wrap gap-2">
                        {specialEligibleJudges
                          .filter((j) => !isSpecialAssigned(award.id, j.id!))
                          .map((j) => (
                            <button
                              key={j.id}
                              type="button"
                              disabled={specialBusyKey === `${award.id}_${j.id}`}
                              onClick={() => toggleSpecialAssign(award.id, j, true)}
                              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 hover:border-primary-blue hover:text-primary-blue transition-colors disabled:opacity-40"
                            >
                              {j.firstName} {j.lastName}
                              {j.institution ? ` (${j.institution})` : ""}
                            </button>
                          ))}
                        {specialEligibleJudges.filter((j) => !isSpecialAssigned(award.id, j.id!)).length === 0 && assignedJudges.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No eligible judges available.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

      {subTab === "specialResults" && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => {
              const lines: string[] = ["Award,Project ID,Student,Project Title,Avg Score,Judge Count"];
              const stuMap = new Map(students.filter((s) => s.id).map((s) => [s.id!, s]));
              for (const award of SPECIAL_AWARDS) {
                const awardScores = specialScores.filter((sc) => sc.awardId === award.id);
                const byStudent = new Map<string, number[]>();
                for (const sc of awardScores) {
                  if (!byStudent.has(sc.studentId)) byStudent.set(sc.studentId, []);
                  byStudent.get(sc.studentId)!.push(sc.totalScore);
                }
                const rows = Array.from(byStudent.entries())
                  .map(([sid, totals]) => {
                    const s = stuMap.get(sid);
                    return {
                      sid,
                      avg: totals.reduce((a, b) => a + b, 0) / totals.length,
                      count: totals.length,
                      name: s ? `${s.firstName} ${s.lastName}` : sid,
                      projectId: s?.projectId || sid,
                      title: s?.projectTitle || "",
                    };
                  })
                  .sort((a, b) => b.avg - a.avg);
                for (const r of rows) {
                  lines.push(`"${award.name.replace(/"/g, '""')}","${r.projectId}","${r.name.replace(/"/g, '""')}","${r.title.replace(/"/g, '""')}",${r.avg.toFixed(2)},${r.count}`);
                }
              }
              downloadCsv(`njsrs_special_award_results_${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\n"));
            }}
            className="bg-primary-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-darkGreen"
          >
            Export all special award results (CSV)
          </button>

          {SPECIAL_AWARDS.map((award) => {
            const awardScores = specialScores.filter((sc) => sc.awardId === award.id);
            const stuMap = new Map(students.filter((s) => s.id).map((s) => [s.id!, s]));
            const byStudent = new Map<string, number[]>();
            for (const sc of awardScores) {
              if (!byStudent.has(sc.studentId)) byStudent.set(sc.studentId, []);
              byStudent.get(sc.studentId)!.push(sc.totalScore);
            }
            const rows = Array.from(byStudent.entries())
              .map(([sid, totals]) => {
                const s = stuMap.get(sid);
                return {
                  sid,
                  avg: totals.reduce((a, b) => a + b, 0) / totals.length,
                  count: totals.length,
                  projectId: s?.projectId || sid,
                  studentName: s ? `${s.firstName} ${s.lastName}` : sid,
                  projectTitle: s?.projectTitle || "",
                };
              })
              .sort((a, b) => b.avg - a.avg);

            const maxTotal = award.criteria.reduce((s, c) => s + c.maxPoints, 0);
            const assignedJudgeNames = specialAssignments
              .filter((a) => a.awardId === award.id)
              .map((a) => {
                const j = judges.find((jj) => jj.id === a.judgeId);
                return j ? `${j.firstName} ${j.lastName}` : a.judgeId;
              });

            return (
              <div key={award.id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
                  <h3 className="font-semibold text-purple-900">{award.name}</h3>
                  <p className="text-xs text-purple-700 mt-0.5">
                    Max score: {maxTotal} pts
                    {assignedJudgeNames.length > 0 && ` · Judge${assignedJudgeNames.length > 1 ? "s" : ""}: ${assignedJudgeNames.join(", ")}`}
                  </p>
                </div>
                {rows.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500 italic">No scores submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-600">
                          <th className="p-3 w-10">#</th>
                          <th className="p-3">Project ID</th>
                          <th className="p-3">Student</th>
                          <th className="p-3">Project</th>
                          <th className="p-3">Avg score</th>
                          <th className="p-3">Judges</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr key={r.sid} className={`border-b border-gray-100 hover:bg-gray-50 ${idx === 0 ? "bg-yellow-50" : ""}`}>
                            <td className="p-3 font-bold text-gray-500">{idx === 0 ? "🏆" : idx + 1}</td>
                            <td className="p-3 font-semibold text-indigo-700">{r.projectId}</td>
                            <td className="p-3 font-medium text-gray-900">{r.studentName}</td>
                            <td className="p-3 text-gray-700 max-w-xs truncate">{r.projectTitle || "—"}</td>
                            <td className="p-3 tabular-nums font-semibold">{r.avg.toFixed(2)} <span className="font-normal text-gray-400">/ {maxTotal}</span></td>
                            <td className="p-3 text-gray-600">{r.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
