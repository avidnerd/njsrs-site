"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllStudents,
  getAllJudges,
  getCategories,
  updateJudgeFinalRoundStatus,
  updateJudgeJshsStatus,
  type Student,
  type Judge,
  type Category,
} from "@/lib/firebase/database";
import {
  getAllJshsPicks,
  clearJshsPicks,
  type JshsPicksDoc,
} from "@/lib/firebase/jshsPicks";
import {
  setJudgingAssignment,
  removeJudgingAssignment,
  removeAllCategoryAssignmentsForJudge,
  getAllAssignments,
  getAllJudgeScores,
  clearAllJudgeScores,
  clearFinalRoundScores,
  clearFinalRoundPromotions,
  aggregateCategoryResults,
  aggregateFinalResults,
  promoteFirstPlaceToFinal,
  promoteStudentsToFinal,
  exportScoresToCsv,
  exportDetailScoresToCsv,
  type JudgingPhase,
  type JudgingAssignment,
} from "@/lib/firebase/judging";
import {
  publishFinalists,
  unpublishFinalists,
  updateFinalistsList,
  setScoringLock,
  subscribeFinalists,
  subscribeScoringLock,
  type PublishedFinalist,
} from "@/lib/firebase/proctors";
import {
  SPECIAL_AWARDS,
  getAllSpecialAwardAssignments,
  getAllSpecialAwardScores,
  clearAllSpecialAwardScores,
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
  const [cleaningKey, setCleaningKey] = useState<string | null>(null);
  const [specialBusyKey, setSpecialBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // JSHS judge picks
  const [jshsPicks, setJshsPicks] = useState<(JshsPicksDoc & { id: string })[]>([]);
  const [jshsBusyId, setJshsBusyId] = useState<string | null>(null);
  const [clearingJshsPicks, setClearingJshsPicks] = useState(false);
  const [clearJshsPicksConfirm, setClearJshsPicksConfirm] = useState(false);

  // Create final round judge
  const [showCreateFinalJudge, setShowCreateFinalJudge] = useState(false);
  const [createFinalJudgeForm, setCreateFinalJudgeForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingFinalJudge, setCreatingFinalJudge] = useState(false);
  const [createFinalJudgeResult, setCreateFinalJudgeResult] = useState<{ email: string; password: string } | null>(null);

  // Clear scores
  const [clearingScores, setClearingScores] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Clear final round promotions
  const [clearingFinal, setClearingFinal] = useState(false);
  const [clearFinalConfirm, setClearFinalConfirm] = useState(false);

  // Clear final round scores only
  const [clearingFinalScores, setClearingFinalScores] = useState(false);
  const [clearFinalScoresConfirm, setClearFinalScoresConfirm] = useState(false);

  // Clear special award scores
  const [clearingSpecialScores, setClearingSpecialScores] = useState(false);
  const [clearSpecialScoresConfirm, setClearSpecialScoresConfirm] = useState(false);

  // Mock judge
  const [creatingMock, setCreatingMock] = useState(false);
  const [mockResult, setMockResult] = useState<{ email: string; password: string } | null>(null);

  // Mock student
  const [creatingMockStudent, setCreatingMockStudent] = useState(false);
  const [mockStudentResult, setMockStudentResult] = useState<{ email: string; password: string } | null>(null);

  // Bulk mock judges
  const [creatingBulkMock, setCreatingBulkMock] = useState(false);
  const [bulkMockResult, setBulkMockResult] = useState<{ judges: { email: string; password: string }[]; failures: { email: string; error: string }[] } | null>(null);

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

  // Judge ID designated as the JSHS judge (only one)
  const jshsJudgeId = useMemo(
    () => judges.find((j) => j.jshsJudge && j.id)?.id ?? null,
    [judges]
  );

  // Final round eligible: approved + in-person full day + NOT in category round + NOT in special awards + NOT JSHS judge
  const finalRoundEligibleJudges = useMemo(
    () =>
      approvedJudges.filter(
        (j) =>
          j.availabilityApril18 === "in_person_full_day" &&
          !categoryAssignedJudgeIds.has(j.id!) &&
          !specialAssignedJudgeIds.has(j.id!) &&
          j.id !== jshsJudgeId
      ),
    [approvedJudges, categoryAssignedJudgeIds, specialAssignedJudgeIds, jshsJudgeId]
  );

  // JSHS judge eligible: approved + in-person full day + NOT a regular final round judge + NOT special awards + NOT category
  const jshsEligibleJudges = useMemo(
    () =>
      approvedJudges.filter(
        (j) =>
          j.availabilityApril18 === "in_person_full_day" &&
          !finalAssignedJudgeIds.has(j.id!) &&
          !specialAssignedJudgeIds.has(j.id!) &&
          !categoryAssignedJudgeIds.has(j.id!)
      ),
    [approvedJudges, finalAssignedJudgeIds, specialAssignedJudgeIds, categoryAssignedJudgeIds]
  );

  const isFinalJudge = useCallback(
    (judgeId: string) => judges.some((j) => j.id === judgeId && j.finalRoundJudge === true),
    [judges]
  );

  const [finalBusyId, setFinalBusyId] = useState<string | null>(null);
  const [promotingFinalists, setPromotingFinalists] = useState(false);
  const [promoteResult, setPromoteResult] = useState<string | null>(null);

  // Publish finalists to live page
  const [publishingFinalists, setPublishingFinalists] = useState(false);
  const [finalistsPublished, setFinalistsPublished] = useState(false);

  // Manual finalists editor
  const [publishedFinalistsList, setPublishedFinalistsList] = useState<PublishedFinalist[]>([]);
  const [editingFinalists, setEditingFinalists] = useState(false);
  const [draftFinalists, setDraftFinalists] = useState<PublishedFinalist[]>([]);
  const [savingFinalistsDraft, setSavingFinalistsDraft] = useState(false);
  const [finalistsAddStudentId, setFinalistsAddStudentId] = useState("");

  // Scoring lock
  const [scoresLocked, setScoresLocked] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);

  // Manual final round selection (category results tab)
  const [selectedForFinal, setSelectedForFinal] = useState<Set<string>>(new Set());
  const [promotingManual, setPromotingManual] = useState(false);
  const [manualPromoteResult, setManualPromoteResult] = useState<string | null>(null);

  const toggleFinalJudge = async (judge: Judge, on: boolean) => {
    setFinalBusyId(judge.id!);
    setError(null);
    try {
      await updateJudgeFinalRoundStatus(judge.id!, on);
      // When designating a judge as final round, assign them to all already-promoted finalists
      if (on) {
        const finalStudentIds = [...new Set(
          assignments.filter((a) => a.phase === "final").map((a) => a.studentId)
        )];
        if (finalStudentIds.length > 0) {
          await Promise.all(
            finalStudentIds.map((sid) => setJudgingAssignment(judge.id!, sid, "final", null))
          );
        }
      }
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setFinalBusyId(null);
    }
  };

  const toggleJshsJudge = async (judge: Judge, on: boolean) => {
    setJshsBusyId(judge.id!);
    setError(null);
    try {
      // Deselect any currently-selected JSHS judge first (only one allowed)
      if (on) {
        const current = judges.find((j) => j.jshsJudge && j.id !== judge.id);
        if (current?.id) await updateJudgeJshsStatus(current.id, false);
      }
      await updateJudgeJshsStatus(judge.id!, on);
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setJshsBusyId(null);
    }
  };

  const handleCreateFinalJudge = async () => {
    if (!user) return;
    const { firstName, lastName, email, password, confirmPassword } = createFinalJudgeForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name, and email are all required.");
      return;
    }
    if (!password) {
      setError("Please set a password for this account.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setCreatingFinalJudge(true);
    setError(null);
    setCreateFinalJudgeResult(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/create-final-judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminIdToken: idToken, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");
      setCreateFinalJudgeResult({ email: data.email, password: data.password });
      setCreateFinalJudgeForm({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
      setShowPassword(false);

      // Auto-assign new judge to all already-promoted finalists
      const finalStudentIds = [...new Set(
        assignments.filter((a) => a.phase === "final").map((a) => a.studentId)
      )];
      if (finalStudentIds.length > 0) {
        await Promise.all(
          finalStudentIds.map((sid) => setJudgingAssignment(data.uid, sid, "final", null))
        );
      }
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create judge account");
    } finally {
      setCreatingFinalJudge(false);
    }
  };

  const handleClearJshsPicks = async () => {
    if (!clearJshsPicksConfirm) { setClearJshsPicksConfirm(true); return; }
    setClearingJshsPicks(true);
    setError(null);
    try {
      const count = await clearJshsPicks();
      await loadAll();
      setClearJshsPicksConfirm(false);
      alert(`Cleared ${count} JSHS pick document(s).`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to clear JSHS picks");
    } finally {
      setClearingJshsPicks(false);
    }
  };

  /**
   * Fetches the current final-round assignments from Firestore and publishes
   * that list to the live page. Uses the in-memory `students` and `categories`
   * state for names / titles (they don't change during promotion).
   */
  const autoPublishFinalists = useCallback(async () => {
    const freshAssignments = await getAllAssignments("final");
    const finalStudentIds = new Set(freshAssignments.map((a) => a.studentId));
    const finalistData = students
      .filter((s) => s.id && finalStudentIds.has(s.id))
      .map((s) => ({
        studentId: s.id!,
        studentName: `${s.firstName} ${s.lastName}`,
        projectId: s.projectId ?? "",
        projectTitle: s.projectTitle ?? "",
        categoryName: categories.find((c) => c.id === s.categoryId)?.name ?? "",
      }));
    if (finalistData.length > 0) {
      await publishFinalists(finalistData);
      setFinalistsPublished(true);
    }
  }, [students, categories]);

  const handlePromoteFirstPlace = async () => {
    setPromotingFinalists(true);
    setPromoteResult(null);
    setError(null);
    try {
      const finalJudgeIds = judges.filter((j) => j.finalRoundJudge && j.id).map((j) => j.id!);
      const count = await promoteFirstPlaceToFinal(categories, students, scores, finalJudgeIds);
      await autoPublishFinalists();
      await loadAll();
      setPromoteResult(`${count} first-place winner(s) promoted and posted to the live page.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Promotion failed");
    } finally {
      setPromotingFinalists(false);
    }
  };

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [stu, jud, cat, asg, sc, spAsg, spCand, spSc, jshsPks] = await Promise.all([
        getAllStudents(),
        getAllJudges(),
        getCategories(),
        getAllAssignments(),
        getAllJudgeScores(),
        getAllSpecialAwardAssignments(),
        getAllSpecialAwardCandidates(),
        getAllSpecialAwardScores(),
        getAllJshsPicks(),
      ]);
      setStudents(stu);
      setJudges(jud);
      setCategories(cat.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setAssignments(asg);
      setScores(sc);
      setSpecialAssignments(spAsg);
      setSpecialCandidates(spCand);
      setSpecialScores(spSc);
      setJshsPicks(jshsPks);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load judging data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const unsubFinalists = subscribeFinalists((data) => {
      setFinalistsPublished(data?.published ?? false);
      setPublishedFinalistsList(data?.students ?? []);
    });
    const unsubLock = subscribeScoringLock((locked) => {
      setScoresLocked(locked);
    });
    return () => { unsubFinalists(); unsubLock(); };
  }, []);

  const handleToggleLock = async () => {
    setTogglingLock(true);
    setError(null);
    try {
      await setScoringLock(!scoresLocked);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update lock");
    } finally {
      setTogglingLock(false);
    }
  };

  const openFinalistsEditor = () => {
    setDraftFinalists([...publishedFinalistsList]);
    setFinalistsAddStudentId("");
    setEditingFinalists(true);
  };

  const addFinalistToDraft = () => {
    const student = students.find((s) => s.id === finalistsAddStudentId);
    if (!student || !student.id) return;
    if (draftFinalists.some((f) => f.studentId === student.id)) return;
    const entry: PublishedFinalist = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      projectId: student.projectId ?? "",
      projectTitle: student.projectTitle ?? "",
      categoryName: categories.find((c) => c.id === student.categoryId)?.name ?? "",
    };
    setDraftFinalists((prev) => [...prev, entry]);
    setFinalistsAddStudentId("");
  };

  const removeFinalistFromDraft = (studentId: string) => {
    setDraftFinalists((prev) => prev.filter((f) => f.studentId !== studentId));
  };

  const saveFinalistsDraft = async () => {
    setSavingFinalistsDraft(true);
    setError(null);
    try {
      await updateFinalistsList(draftFinalists);
      setEditingFinalists(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save finalists");
    } finally {
      setSavingFinalistsDraft(false);
    }
  };

  const handleClearFinalPromotions = async () => {
    if (!clearFinalConfirm) { setClearFinalConfirm(true); return; }
    setClearingFinal(true);
    setError(null);
    try {
      const count = await clearFinalRoundPromotions();
      await loadAll();
      setClearFinalConfirm(false);
      alert(`Cleared ${count} final round assignment(s).`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to clear final round promotions");
    } finally {
      setClearingFinal(false);
    }
  };

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

  const handleClearFinalScores = async () => {
    if (!clearFinalScoresConfirm) { setClearFinalScoresConfirm(true); return; }
    setClearingFinalScores(true);
    setError(null);
    try {
      const count = await clearFinalRoundScores();
      await loadAll();
      setClearFinalScoresConfirm(false);
      alert(`Cleared ${count} final round score(s).`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to clear final round scores");
    } finally {
      setClearingFinalScores(false);
    }
  };

  const handleClearSpecialScores = async () => {
    if (!clearSpecialScoresConfirm) { setClearSpecialScoresConfirm(true); return; }
    setClearingSpecialScores(true);
    setError(null);
    try {
      const count = await clearAllSpecialAwardScores();
      await loadAll();
      setClearSpecialScoresConfirm(false);
      alert(`Cleared ${count} special award score(s).`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to clear special award scores");
    } finally {
      setClearingSpecialScores(false);
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

  const handleCreateBulkMockJudges = async () => {
    if (!user) return;
    setCreatingBulkMock(true);
    setError(null);
    setBulkMockResult(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/create-mock-judges-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminIdToken: idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bulk mock judges");
      setBulkMockResult({ judges: data.judges, failures: data.failures ?? [] });
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create bulk mock judges");
    } finally {
      setCreatingBulkMock(false);
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
      // Filter out deleted students before saving
      const activeIds = (specialCandidates[key] ?? []).filter((id) =>
        students.some((s) => s.id === id)
      );
      await setSpecialAwardCandidates(awardId, judgeId, activeIds);
      setSpecialCandidates((prev) => ({ ...prev, [key]: activeIds }));
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

  const handleUnassignFromCategory = async (categoryId: string, judgeId: string) => {
    const key = `${categoryId}_${judgeId}`;
    setCleaningKey(key);
    setError(null);
    try {
      await removeAllCategoryAssignmentsForJudge(judgeId, categoryId);
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to unassign judge");
    } finally {
      setCleaningKey(null);
    }
  };

  const handlePublishFinalists = async (unpublish = false) => {
    setPublishingFinalists(true);
    setError(null);
    try {
      if (unpublish) {
        await unpublishFinalists();
        setFinalistsPublished(false);
      } else {
        const finalStudentIds = new Set(
          assignments.filter((a) => a.phase === "final").map((a) => a.studentId)
        );
        const finalists = students
          .filter((s) => s.id && finalStudentIds.has(s.id))
          .map((s) => ({
            studentId: s.id!,
            studentName: `${s.firstName} ${s.lastName}`,
            projectId: s.projectId ?? "",
            projectTitle: s.projectTitle ?? "",
            categoryName: categories.find((c) => c.id === s.categoryId)?.name ?? "",
          }));
        if (finalists.length === 0) {
          setError("No finalists found. Promote students to the final round first.");
          return;
        }
        await publishFinalists(finalists);
        setFinalistsPublished(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update finalists");
    } finally {
      setPublishingFinalists(false);
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
            onClick={handleCreateBulkMockJudges}
            disabled={creatingBulkMock}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60"
          >
            {creatingBulkMock ? "Creating…" : "Create 20 mock judges"}
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
            onClick={handleClearFinalPromotions}
            disabled={clearingFinal}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
              clearFinalConfirm
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-white border border-orange-300 text-orange-700 hover:bg-orange-50"
            }`}
          >
            {clearingFinal ? "Clearing…" : clearFinalConfirm ? "Confirm — clear final promotions" : "Clear final round promotions"}
          </button>
          {clearFinalConfirm && (
            <button
              type="button"
              onClick={() => setClearFinalConfirm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel
            </button>
          )}
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
          <button
            type="button"
            onClick={handleClearFinalScores}
            disabled={clearingFinalScores}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
              clearFinalScoresConfirm
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
            }`}
          >
            {clearingFinalScores ? "Clearing…" : clearFinalScoresConfirm ? "Confirm — clear final scores" : "Clear final round scores"}
          </button>
          {clearFinalScoresConfirm && (
            <button
              type="button"
              onClick={() => setClearFinalScoresConfirm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleClearSpecialScores}
            disabled={clearingSpecialScores}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
              clearSpecialScoresConfirm
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
            }`}
          >
            {clearingSpecialScores ? "Clearing…" : clearSpecialScoresConfirm ? "Confirm — clear special award scores" : "Clear special award scores"}
          </button>
          {clearSpecialScoresConfirm && (
            <button
              type="button"
              onClick={() => setClearSpecialScoresConfirm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleClearJshsPicks}
            disabled={clearingJshsPicks}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
              clearJshsPicksConfirm
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
            }`}
          >
            {clearingJshsPicks ? "Clearing…" : clearJshsPicksConfirm ? "Confirm — clear JSHS picks" : "Clear JSHS picks"}
          </button>
          {clearJshsPicksConfirm && (
            <button
              type="button"
              onClick={() => setClearJshsPicksConfirm(false)}
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
        {bulkMockResult && (
          <div className="rounded-lg bg-violet-50 border border-violet-200 px-4 py-3 text-sm space-y-2">
            <p className="font-semibold text-violet-800">20 mock judges created — all use password: <span className="font-mono">MockJudge123!</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
              {bulkMockResult.judges.map((j) => (
                <p key={j.email} className="font-mono text-violet-900 text-xs">{j.email}</p>
              ))}
            </div>
            <p className="text-xs text-violet-700">Assign these judges to categories, then share the credentials with your class.</p>
            {bulkMockResult.failures.length > 0 && (
              <div className="mt-2 rounded bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-xs font-semibold text-red-700 mb-1">Failed ({bulkMockResult.failures.length}) — click &quot;Create 20 mock judges&quot; again to retry:</p>
                {bulkMockResult.failures.map((f) => (
                  <p key={f.email} className="font-mono text-xs text-red-800">{f.email}: {f.error}</p>
                ))}
              </div>
            )}
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
                if (catStudents.length === 0) {
                  // Check for judges with orphaned assignments (students moved out of this category)
                  const orphanedJudges = approvedJudges.filter((j) =>
                    assignments.some(
                      (a) => a.phase === "category" && a.categoryId === cat.id! && a.judgeId === j.id!
                    )
                  );
                  if (orphanedJudges.length === 0) return null;
                  return (
                    <div key={cat.id} className="bg-white rounded-xl shadow border border-orange-200 overflow-hidden">
                      <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
                        <h3 className="font-semibold text-orange-900">{cat.name}</h3>
                        <p className="text-xs text-orange-700 mt-0.5">
                          No students in this category — {orphanedJudges.length} judge(s) still have assignments here. Unassign them to free them for other categories.
                        </p>
                      </div>
                      <div className="px-4 py-3 flex flex-wrap gap-3">
                        {orphanedJudges.map((j) => (
                          <div key={j.id} className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                            <span className="text-sm text-gray-900">{j.firstName} {j.lastName}</span>
                            <button
                              type="button"
                              disabled={cleaningKey === `${cat.id!}_${j.id!}`}
                              onClick={() => handleUnassignFromCategory(cat.id!, j.id!)}
                              className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
                            >
                              {cleaningKey === `${cat.id!}_${j.id!}` ? "Removing…" : "Unassign"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
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
              {/* Create a new final round judge account */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Create a final round judge account</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Creates a new login for someone who will judge the final round. They are automatically assigned to all current finalists.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowCreateFinalJudge((v) => !v); setCreateFinalJudgeResult(null); setError(null); }}
                    className="shrink-0 text-sm text-primary-blue hover:underline"
                  >
                    {showCreateFinalJudge ? "Cancel" : "Create account"}
                  </button>
                </div>
                {showCreateFinalJudge && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                        <input
                          type="text"
                          value={createFinalJudgeForm.firstName}
                          onChange={(e) => setCreateFinalJudgeForm((f) => ({ ...f, firstName: e.target.value }))}
                          placeholder="Jane"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                        <input
                          type="text"
                          value={createFinalJudgeForm.lastName}
                          onChange={(e) => setCreateFinalJudgeForm((f) => ({ ...f, lastName: e.target.value }))}
                          placeholder="Smith"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
                      <input
                        type="email"
                        value={createFinalJudgeForm.email}
                        onChange={(e) => setCreateFinalJudgeForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="judge@example.com"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={createFinalJudgeForm.password}
                            onChange={(e) => setCreateFinalJudgeForm((f) => ({ ...f, password: e.target.value }))}
                            placeholder="Min. 6 characters"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue pr-16"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Confirm password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={createFinalJudgeForm.confirmPassword}
                          onChange={(e) => setCreateFinalJudgeForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                          placeholder="Repeat password"
                          className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue ${
                            createFinalJudgeForm.confirmPassword && createFinalJudgeForm.password !== createFinalJudgeForm.confirmPassword
                              ? "border-red-400"
                              : "border-gray-300"
                          }`}
                        />
                        {createFinalJudgeForm.confirmPassword && createFinalJudgeForm.password !== createFinalJudgeForm.confirmPassword && (
                          <p className="text-xs text-red-500 mt-0.5">Passwords do not match</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateFinalJudge}
                      disabled={creatingFinalJudge}
                      className="px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-semibold hover:bg-primary-darkBlue disabled:opacity-50"
                    >
                      {creatingFinalJudge ? "Creating account…" : "Create account & assign to finalists"}
                    </button>
                  </div>
                )}
                {createFinalJudgeResult && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm space-y-1">
                    <p className="font-semibold text-green-800">✓ Account created and assigned to all current finalists</p>
                    <p className="font-mono text-green-900">Email: {createFinalJudgeResult.email}</p>
                    <p className="font-mono text-green-900">Password: {createFinalJudgeResult.password}</p>
                    <p className="text-xs text-green-700 mt-1">Share these credentials with the judge. They can log in at njsrs.org and will see all finalists immediately.</p>
                  </div>
                )}
              </div>

              {/* JSHS Judge selector */}
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">JSHS Judge (optional — 1 person max)</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    The JSHS judge reviews all finalists and selects their personal top 5. Their picks are
                    recorded separately and <strong>do not affect official final-round scores</strong>.
                    Select one judge from the list below — this role is exclusive from all other judging roles.
                  </p>
                </div>
                {jshsJudgeId && (() => {
                  const current = judges.find((j) => j.id === jshsJudgeId);
                  return current ? (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 w-fit">
                      <span className="text-sm font-medium text-amber-900">
                        ✓ {current.firstName} {current.lastName}
                        {current.institution ? ` — ${current.institution}` : ""}
                      </span>
                      <button
                        type="button"
                        disabled={jshsBusyId === current.id}
                        onClick={() => toggleJshsJudge(current, false)}
                        className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null;
                })()}
                {!jshsJudgeId && (
                  jshsEligibleJudges.length === 0 ? (
                    <p className="text-sm text-amber-800 italic">
                      No eligible judges found. Judges must have selected &quot;In-person, full day&quot; and must not already be assigned to any other judging role.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {jshsEligibleJudges.map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          disabled={jshsBusyId === j.id}
                          onClick={() => toggleJshsJudge(j, true)}
                          className="text-sm px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-800 hover:border-amber-500 hover:text-amber-900 transition-colors disabled:opacity-40"
                        >
                          {j.firstName} {j.lastName}
                          {j.institution ? ` (${j.institution})` : ""}
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>

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
                          const activeSelected = selected.filter((id) => students.some((s) => s.id === id));
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
                                  {savingCandidatesId === key ? "Saving…" : `Save shortlist (${activeSelected.length})`}
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

      {subTab === "category" && (() => {
        const alreadyInFinal = new Set(
          assignments.filter((a) => a.phase === "final").map((a) => a.studentId)
        );

        const handleManualPromote = async () => {
          const ids = [...selectedForFinal].filter((id) => !alreadyInFinal.has(id));
          if (ids.length === 0) {
            setManualPromoteResult("All selected students are already in the final round.");
            return;
          }
          const finalJudgeIds = judges.filter((j) => j.finalRoundJudge && j.id).map((j) => j.id!);
          if (finalJudgeIds.length === 0) {
            setManualPromoteResult("No final round judges are assigned yet. Go to the Final Round tab first.");
            return;
          }
          setPromotingManual(true);
          setManualPromoteResult(null);
          try {
            await promoteStudentsToFinal(ids, finalJudgeIds);
            await autoPublishFinalists();
            await loadAll();
            setSelectedForFinal(new Set());
            setManualPromoteResult(`${ids.length} student(s) promoted and posted to the live page.`);
          } catch (e: unknown) {
            setManualPromoteResult(e instanceof Error ? e.message : "Promotion failed");
          } finally {
            setPromotingManual(false);
          }
        };

        return (
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
                        <th className="p-3 text-center">Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => {
                        const inFinal = alreadyInFinal.has(r.studentId);
                        const checked = selectedForFinal.has(r.studentId);
                        return (
                          <tr key={r.studentId} className={`border-b border-gray-100 hover:bg-gray-50 ${inFinal ? "bg-indigo-50" : ""}`}>
                            <td className="p-3 font-medium text-gray-500">
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                            </td>
                            <td className="p-3 font-medium text-gray-900">{r.studentName}</td>
                            <td className="p-3 text-gray-700 max-w-xs truncate">{r.projectTitle || "—"}</td>
                            <td className="p-3 tabular-nums">{r.avgTotalScore.toFixed(2)}</td>
                            <td className="p-3 tabular-nums">
                              {r.avgRank != null ? r.avgRank.toFixed(2) : "—"}
                            </td>
                            <td className="p-3 text-gray-600">{r.judgeCount}</td>
                            <td className="p-3 text-center">
                              {inFinal ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                  ✓ In final
                                </span>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setSelectedForFinal((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(r.studentId)) next.delete(r.studentId);
                                      else next.add(r.studentId);
                                      return next;
                                    });
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Promote selected button */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleManualPromote}
              disabled={promotingManual || selectedForFinal.size === 0}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {promotingManual
                ? "Promoting…"
                : `Promote selected to final round (${selectedForFinal.size})`}
            </button>
            {selectedForFinal.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedForFinal(new Set())}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear selection
              </button>
            )}
            {manualPromoteResult && (
              <p className="text-sm font-medium text-green-700">{manualPromoteResult}</p>
            )}
          </div>
        </div>
        );
      })()}

      {subTab === "final" && (
        <>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `njsrs_final_standings_${new Date().toISOString().slice(0, 10)}.csv`,
                  exportScoresToCsv(
                    aggregateFinalResults(students, scores, assignments).map((r) => ({
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

          {/* Lock all judge scores */}
          <div className={`rounded-xl border px-5 py-4 flex flex-wrap items-center justify-between gap-4 ${scoresLocked ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
            <div>
              <p className="font-semibold text-sm text-gray-900">Lock judge scores</p>
              <p className="text-xs text-gray-500 mt-0.5">
                When locked, judges cannot save or modify any scores.{" "}
                {scoresLocked && <span className="font-semibold text-red-700">⚠ Scores are currently locked</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleLock}
              disabled={togglingLock}
              className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${
                scoresLocked
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {togglingLock ? "Updating…" : scoresLocked ? "Unlock scores" : "Lock all scores"}
            </button>
          </div>

          {/* Publish finalists to live page */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-indigo-900 text-sm">Post finalists to njsrs.org/live</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Publishes the current final-round student list to the public live board.{" "}
                {finalistsPublished && <span className="font-medium text-green-700">✓ Currently posted</span>}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handlePublishFinalists(false)}
                disabled={publishingFinalists}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {publishingFinalists ? "Posting…" : finalistsPublished ? "Re-post finalists" : "Post finalists"}
              </button>
              {finalistsPublished && (
                <button
                  type="button"
                  onClick={() => handlePublishFinalists(true)}
                  disabled={publishingFinalists}
                  className="bg-white border border-indigo-300 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-50"
                >
                  Remove from live page
                </button>
              )}
            </div>
          </div>

          {/* Manual finalists editor */}
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-5 py-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-purple-900 text-sm">Manually edit live finalists</p>
                <p className="text-xs text-purple-700 mt-0.5">
                  Add or remove students shown on the live finalists board without changing the full final-round assignments.
                  {publishedFinalistsList.length > 0 && ` Currently showing ${publishedFinalistsList.length} finalist(s).`}
                </p>
              </div>
              {!editingFinalists && (
                <button
                  type="button"
                  onClick={openFinalistsEditor}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700"
                >
                  Edit finalists list
                </button>
              )}
            </div>

            {editingFinalists && (
              <div className="space-y-3">
                {/* Add a student */}
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={finalistsAddStudentId}
                    onChange={(e) => setFinalistsAddStudentId(e.target.value)}
                    className="flex-1 min-w-0 border border-purple-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    <option value="">— Select a student to add —</option>
                    {students
                      .filter((s) => s.id && s.status === "approved" && !draftFinalists.some((f) => f.studentId === s.id))
                      .sort((a, b) => (a.projectId ?? "").localeCompare(b.projectId ?? ""))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.projectId ? `[${s.projectId}] ` : ""}{s.firstName} {s.lastName} — {s.projectTitle || "No title"}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={addFinalistToDraft}
                    disabled={!finalistsAddStudentId}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>

                {/* Current draft list */}
                {draftFinalists.length === 0 ? (
                  <p className="text-sm text-purple-700 italic">No finalists in the list. Add some above.</p>
                ) : (
                  <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-purple-50 border-b border-purple-200 text-left text-purple-800">
                          <th className="px-3 py-2">Project ID</th>
                          <th className="px-3 py-2">Student</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Title</th>
                          <th className="px-3 py-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftFinalists.map((f) => (
                          <tr key={f.studentId} className="border-b border-purple-100 last:border-0">
                            <td className="px-3 py-2 font-mono text-xs text-indigo-700">{f.projectId || "—"}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{f.studentName}</td>
                            <td className="px-3 py-2 text-gray-600 text-xs">{f.categoryName || "—"}</td>
                            <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{f.projectTitle || "—"}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeFinalistFromDraft(f.studentId)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={saveFinalistsDraft}
                    disabled={savingFinalistsDraft}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                  >
                    {savingFinalistsDraft ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFinalists(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancel
                  </button>
                  <span className="text-xs text-purple-700">{draftFinalists.length} finalist(s)</span>
                </div>
              </div>
            )}
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
                  {aggregateFinalResults(students, scores.filter((sc) => {
                    // Exclude the JSHS judge's scores from official final results
                    if (!jshsJudgeId) return true;
                    return sc.judgeId !== jshsJudgeId;
                  }), assignments).map((r, idx) => (
                    <tr key={r.studentId} className={`border-b border-gray-100 ${r.judgeCount === 0 ? "bg-amber-50" : ""}`}>
                      <td className="p-3 font-medium text-gray-500">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                      </td>
                      <td className="p-3 font-medium text-gray-900">{r.studentName}</td>
                      <td className="p-3 text-gray-700 max-w-xs truncate">{r.projectTitle || "—"}</td>
                      <td className="p-3 tabular-nums">
                        {r.judgeCount === 0 ? <span className="text-amber-600 text-xs">Not scored yet</span> : r.avgTotalScore.toFixed(2)}
                      </td>
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

        {/* JSHS Judge picks panel */}
        {(() => {
          if (jshsPicks.length === 0 && !jshsJudgeId) return null;
          const stuMap = new Map(students.filter((s) => s.id).map((s) => [s.id!, s]));
          const currentJshsJudge = jshsJudgeId ? judges.find((j) => j.id === jshsJudgeId) : null;
          const picks = jshsPicks[0]; // Only one JSHS judge
          return (
            <div className="rounded-xl border border-amber-300 bg-amber-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm">JSHS Judge — Top 5 Picks</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    These selections are <strong>not counted</strong> in the official final-round standings.
                    {currentJshsJudge && ` Submitted by: ${currentJshsJudge.firstName} ${currentJshsJudge.lastName}`}
                  </p>
                </div>
              </div>
              {!picks ? (
                <p className="px-4 py-3 text-sm text-amber-800 italic">
                  {jshsJudgeId
                    ? "The JSHS judge has not submitted their picks yet."
                    : "No JSHS judge has been assigned yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-amber-200 text-left text-amber-800 bg-amber-50">
                        <th className="p-3 w-10">Pick</th>
                        <th className="p-3">Student</th>
                        <th className="p-3">Project</th>
                      </tr>
                    </thead>
                    <tbody>
                      {picks.studentIds.map((sid, idx) => {
                        const s = stuMap.get(sid);
                        return (
                          <tr key={sid} className="border-b border-amber-100 bg-white hover:bg-amber-50">
                            <td className="p-3 font-bold text-amber-700">#{idx + 1}</td>
                            <td className="p-3 font-medium text-gray-900">
                              {s ? `${s.firstName} ${s.lastName}` : sid}
                              {s?.projectId && (
                                <span className="ml-2 text-xs text-indigo-600 font-semibold">{s.projectId}</span>
                              )}
                            </td>
                            <td className="p-3 text-gray-700 max-w-xs truncate">{s?.projectTitle || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
        </>
      )}

      {subTab === "specialResults" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={handleClearSpecialScores}
              disabled={clearingSpecialScores}
              className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
                clearSpecialScoresConfirm
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
              }`}
            >
              {clearingSpecialScores ? "Clearing…" : clearSpecialScoresConfirm ? "Confirm — clear all special award scores" : "Clear all special award scores"}
            </button>
            {clearSpecialScoresConfirm && (
              <button
                type="button"
                onClick={() => setClearSpecialScoresConfirm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cancel
              </button>
            )}
          </div>
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
