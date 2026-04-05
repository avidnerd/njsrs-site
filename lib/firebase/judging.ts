import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { snapshotExists } from "./database";
import type { Student } from "./database";

export type JudgingPhase = "category" | "final";

export interface RubricCriterion {
  key: keyof JudgingRubricScores;
  label: string;
  shortLabel: string;
  maxPoints: number;
  description: string;
}

/** JSHS Oral Judging Rubric (2023–2024), 100 pts total — adapted for poster/research review. */
export const RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    key: "researchProblem",
    label: "Identification of Research Problem",
    shortLabel: "Research problem",
    maxPoints: 5,
    description: "Understanding of existing knowledge; problem stated and explained.",
  },
  {
    key: "scientificThought",
    label: "Scientific Thought",
    shortLabel: "Scientific thought",
    maxPoints: 5,
    description: "Balanced relevant information; thoughtful analysis; central purpose.",
  },
  {
    key: "creativityOriginality",
    label: "Creativity / Originality",
    shortLabel: "Creativity",
    maxPoints: 5,
    description: "Individual contributions to the project.",
  },
  {
    key: "acknowledgements",
    label: "Acknowledgements",
    shortLabel: "Acknowledgements",
    maxPoints: 5,
    description: "Credits assistance and describes how others helped.",
  },
  {
    key: "researchDesign",
    label: "Research Design",
    shortLabel: "Research design",
    maxPoints: 15,
    description: "Design/procedures, controls/variables, or engineering design and testing.",
  },
  {
    key: "methods",
    label: "Methods",
    shortLabel: "Methods",
    maxPoints: 15,
    description: "Materials, hypothesis/questions, study design, statistical methods, procedure narration.",
  },
  {
    key: "results",
    label: "Results",
    shortLabel: "Results",
    maxPoints: 15,
    description: "Summary, data trends, tables/figures.",
  },
  {
    key: "discussionConclusions",
    label: "Discussion & Conclusions",
    shortLabel: "Discussion",
    maxPoints: 15,
    description: "Logical conclusions, significance, limits, implications.",
  },
  {
    key: "references",
    label: "References",
    shortLabel: "References",
    maxPoints: 5,
    description: "Significant, published, relevant sources.",
  },
  {
    key: "communication",
    label: "Communication",
    shortLabel: "Communication",
    maxPoints: 15,
    description: "Clear communication; defines terms; appropriate responses.",
  },
];

export const RUBRIC_MAX_TOTAL = RUBRIC_CRITERIA.reduce((s, c) => s + c.maxPoints, 0);

export interface JudgingRubricScores {
  researchProblem: number;
  scientificThought: number;
  creativityOriginality: number;
  acknowledgements: number;
  researchDesign: number;
  methods: number;
  results: number;
  discussionConclusions: number;
  references: number;
  communication: number;
}

export function emptyRubricScores(): JudgingRubricScores {
  return {
    researchProblem: 0,
    scientificThought: 0,
    creativityOriginality: 0,
    acknowledgements: 0,
    researchDesign: 0,
    methods: 0,
    results: 0,
    discussionConclusions: 0,
    references: 0,
    communication: 0,
  };
}

export function computeRubricTotal(scores: JudgingRubricScores): number {
  return RUBRIC_CRITERIA.reduce((sum, c) => sum + (Number(scores[c.key]) || 0), 0);
}

export interface JudgingAssignment {
  id: string;
  judgeId: string;
  studentId: string;
  phase: JudgingPhase;
  categoryId: string | null;
  createdAt: Timestamp;
}

export interface JudgeScoreDoc {
  judgeId: string;
  studentId: string;
  phase: JudgingPhase;
  categoryId: string | null;
  rubric: JudgingRubricScores;
  totalScore: number;
  rank: number | null;
  notes: string;
  updatedAt: Timestamp;
}

function ensureDb() {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

export function assignmentDocId(phase: JudgingPhase, judgeId: string, studentId: string): string {
  return `${phase}_${judgeId}_${studentId}`;
}

export function scoreDocId(phase: JudgingPhase, judgeId: string, studentId: string): string {
  return `${phase}_${judgeId}_${studentId}`;
}

export async function setJudgingAssignment(
  judgeId: string,
  studentId: string,
  phase: JudgingPhase,
  categoryId: string | null
): Promise<void> {
  const dbi = ensureDb();
  const id = assignmentDocId(phase, judgeId, studentId);
  await setDoc(doc(dbi, "judgingAssignments", id), {
    judgeId,
    studentId,
    phase,
    categoryId: categoryId ?? null,
    createdAt: Timestamp.now(),
  });
}

export async function removeJudgingAssignment(
  phase: JudgingPhase,
  judgeId: string,
  studentId: string
): Promise<void> {
  const dbi = ensureDb();
  const id = assignmentDocId(phase, judgeId, studentId);
  await deleteDoc(doc(dbi, "judgingAssignments", id));
  const scoreId = scoreDocId(phase, judgeId, studentId);
  const scoreRef = doc(dbi, "judgeScores", scoreId);
  const snap = await getDoc(scoreRef);
  if (snapshotExists(snap)) await deleteDoc(scoreRef);
}

export async function getAssignmentsForJudge(judgeId: string, phase: JudgingPhase): Promise<JudgingAssignment[]> {
  const dbi = ensureDb();
  const q = query(
    collection(dbi, "judgingAssignments"),
    where("judgeId", "==", judgeId),
    where("phase", "==", phase)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JudgingAssignment));
}

export async function getAllAssignments(phase?: JudgingPhase): Promise<JudgingAssignment[]> {
  const dbi = ensureDb();
  if (phase) {
    const q = query(collection(dbi, "judgingAssignments"), where("phase", "==", phase));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JudgingAssignment));
  }
  const snap = await getDocs(collection(dbi, "judgingAssignments"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JudgingAssignment));
}

export async function getJudgeScore(
  phase: JudgingPhase,
  judgeId: string,
  studentId: string
): Promise<JudgeScoreDoc | null> {
  const dbi = ensureDb();
  const id = scoreDocId(phase, judgeId, studentId);
  const snap = await getDoc(doc(dbi, "judgeScores", id));
  if (!snapshotExists(snap)) return null;
  return snap.data() as JudgeScoreDoc;
}

export async function saveJudgeScore(
  phase: JudgingPhase,
  judgeId: string,
  studentId: string,
  categoryId: string | null,
  rubric: JudgingRubricScores,
  rank: number | null,
  notes: string
): Promise<void> {
  const dbi = ensureDb();
  const id = scoreDocId(phase, judgeId, studentId);
  const totalScore = computeRubricTotal(rubric);
  await setDoc(doc(dbi, "judgeScores", id), {
    judgeId,
    studentId,
    phase,
    categoryId: categoryId ?? null,
    rubric,
    totalScore,
    rank,
    notes: notes.trim(),
    updatedAt: Timestamp.now(),
  });
}

export async function getAllJudgeScores(phase?: JudgingPhase): Promise<(JudgeScoreDoc & { id: string })[]> {
  const dbi = ensureDb();
  if (phase) {
    const q = query(collection(dbi, "judgeScores"), where("phase", "==", phase));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as JudgeScoreDoc) }));
  }
  const snap = await getDocs(collection(dbi, "judgeScores"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as JudgeScoreDoc) }));
}

/** Category results: avg raw score desc, then avg rank asc (lower rank = better). */
export interface CategoryAggregateRow {
  studentId: string;
  studentName: string;
  projectTitle: string;
  avgTotalScore: number;
  avgRank: number | null;
  judgeCount: number;
  scoreBreakdown: { judgeId: string; total: number; rank: number | null }[];
}

export function aggregateCategoryResults(
  students: Student[],
  scores: (JudgeScoreDoc & { id: string })[],
  categoryId: string
): CategoryAggregateRow[] {
  const inCat = students.filter((s) => s.categoryId === categoryId);
  const sidSet = new Set(inCat.map((s) => s.id!).filter(Boolean));
  const relevant = scores.filter(
    (sc) =>
      sc.phase === "category" &&
      (sc.categoryId === categoryId || sc.categoryId == null) &&
      sidSet.has(sc.studentId)
  );

  const byStudent = new Map<string, { totals: number[]; ranks: number[]; breakdown: CategoryAggregateRow["scoreBreakdown"] }>();

  for (const sc of relevant) {
    if (!sidSet.has(sc.studentId)) continue;
    let entry = byStudent.get(sc.studentId);
    if (!entry) {
      entry = { totals: [], ranks: [], breakdown: [] };
      byStudent.set(sc.studentId, entry);
    }
    entry.totals.push(sc.totalScore);
    if (sc.rank != null) entry.ranks.push(sc.rank);
    entry.breakdown.push({
      judgeId: sc.judgeId,
      total: sc.totalScore,
      rank: sc.rank,
    });
  }

  const rows: CategoryAggregateRow[] = inCat
    .filter((s) => s.id)
    .map((s) => {
      const agg = byStudent.get(s.id!) || { totals: [], ranks: [], breakdown: [] };
      const judgeCount = agg.totals.length;
      const avgTotalScore =
        judgeCount > 0 ? agg.totals.reduce((a, b) => a + b, 0) / judgeCount : 0;
      const avgRank =
        agg.ranks.length > 0 ? agg.ranks.reduce((a, b) => a + b, 0) / agg.ranks.length : null;
      return {
        studentId: s.id!,
        studentName: `${s.firstName} ${s.lastName}`,
        projectTitle: s.projectTitle || "",
        avgTotalScore,
        avgRank,
        judgeCount,
        scoreBreakdown: agg.breakdown,
      };
    });

  rows.sort((a, b) => {
    if (b.avgTotalScore !== a.avgTotalScore) return b.avgTotalScore - a.avgTotalScore;
    const ra = a.avgRank ?? 999;
    const rb = b.avgRank ?? 999;
    if (ra !== rb) return ra - rb;
    return a.studentName.localeCompare(b.studentName);
  });

  return rows;
}

export interface FinalAggregateRow {
  studentId: string;
  studentName: string;
  projectTitle: string;
  avgTotalScore: number;
  avgRank: number | null;
  judgeCount: number;
  scoreBreakdown: { judgeId: string; total: number; rank: number | null }[];
}

export function aggregateFinalResults(
  students: Student[],
  scores: (JudgeScoreDoc & { id: string })[]
): FinalAggregateRow[] {
  const byId = new Map(students.filter((s) => s.id).map((s) => [s.id!, s]));
  const relevant = scores.filter((sc) => sc.phase === "final");
  const byStudent = new Map<
    string,
    { totals: number[]; ranks: number[]; breakdown: FinalAggregateRow["scoreBreakdown"] }
  >();

  for (const sc of relevant) {
    let entry = byStudent.get(sc.studentId);
    if (!entry) {
      entry = { totals: [], ranks: [], breakdown: [] };
      byStudent.set(sc.studentId, entry);
    }
    entry.totals.push(sc.totalScore);
    if (sc.rank != null) entry.ranks.push(sc.rank);
    entry.breakdown.push({ judgeId: sc.judgeId, total: sc.totalScore, rank: sc.rank });
  }

  const rows: FinalAggregateRow[] = Array.from(byStudent.entries()).map(([studentId, agg]) => {
    const s = byId.get(studentId);
    const judgeCount = agg.totals.length;
    const avgTotalScore =
      judgeCount > 0 ? agg.totals.reduce((a, b) => a + b, 0) / judgeCount : 0;
    const avgRank =
      agg.ranks.length > 0 ? agg.ranks.reduce((a, b) => a + b, 0) / agg.ranks.length : null;
    return {
      studentId,
      studentName: s ? `${s.firstName} ${s.lastName}` : studentId,
      projectTitle: s?.projectTitle || "",
      avgTotalScore,
      avgRank,
      judgeCount,
      scoreBreakdown: agg.breakdown,
    };
  });

  rows.sort((a, b) => {
    if (b.avgTotalScore !== a.avgTotalScore) return b.avgTotalScore - a.avgTotalScore;
    const ra = a.avgRank ?? 999;
    const rb = b.avgRank ?? 999;
    if (ra !== rb) return ra - rb;
    return a.studentName.localeCompare(b.studentName);
  });

  return rows;
}

export function exportScoresToCsv(
  rows: { studentId: string; studentName: string; projectTitle: string; avgTotalScore: number; avgRank: number | null; judgeCount: number }[],
  phaseLabel: string
): string {
  const headers = ["Student ID", "Student Name", "Project Title", "Avg Total Score", "Avg Rank", "Judge Count", "Phase"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        `"${r.studentId}"`,
        `"${String(r.studentName).replace(/"/g, '""')}"`,
        `"${String(r.projectTitle).replace(/"/g, '""')}"`,
        r.avgTotalScore.toFixed(2),
        r.avgRank != null ? r.avgRank.toFixed(2) : "",
        r.judgeCount,
        `"${phaseLabel}"`,
      ].join(",")
    ),
  ];
  return lines.join("\n");
}

/**
 * For each category, finds the student with the best aggregate ranking (rank=1 avg, then score)
 * and creates final-phase judging assignments for each of the given final round judges.
 * Existing final-phase assignments are not removed — call this once when promoting.
 */
export async function promoteFirstPlaceToFinal(
  categories: import("./database").Category[],
  students: Student[],
  scores: (JudgeScoreDoc & { id: string })[],
  finalJudgeIds: string[]
): Promise<number> {
  const firstPlaceIds: string[] = [];
  for (const cat of categories) {
    if (!cat.id) continue;
    const rows = aggregateCategoryResults(students, scores, cat.id);
    if (rows.length > 0) firstPlaceIds.push(rows[0].studentId);
  }
  if (firstPlaceIds.length === 0 || finalJudgeIds.length === 0) return 0;
  await Promise.all(
    firstPlaceIds.flatMap((studentId) =>
      finalJudgeIds.map((judgeId) =>
        setJudgingAssignment(judgeId, studentId, "final", null)
      )
    )
  );
  return firstPlaceIds.length;
}

export async function clearAllJudgeScores(): Promise<number> {
  const dbi = ensureDb();
  const snap = await getDocs(collection(dbi, "judgeScores"));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  return snap.docs.length;
}

export function exportDetailScoresToCsv(
  scores: (JudgeScoreDoc & { id: string })[],
  students: Student[],
  judges: { id?: string; firstName: string; lastName: string; email: string }[]
): string {
  const stuMap = new Map(students.filter((s) => s.id).map((s) => [s.id!, s]));
  const judgeMap = new Map(judges.filter((j) => j.id).map((j) => [j.id!, j]));
  const headers = [
    "Phase",
    "Judge ID",
    "Judge Name",
    "Student ID",
    "Student Name",
    "Project Title",
    "Total Score",
    "Rank",
    "Notes",
    ...RUBRIC_CRITERIA.map((c) => `"${c.shortLabel}"`),
  ];
  const lines = [headers.join(",")];
  for (const sc of scores) {
    const s = stuMap.get(sc.studentId);
    const j = judgeMap.get(sc.judgeId);
    const jname = j ? `${j.firstName} ${j.lastName}` : sc.judgeId;
    const row = [
      sc.phase,
      sc.judgeId,
      `"${jname.replace(/"/g, '""')}"`,
      sc.studentId,
      `"${s ? `${s.firstName} ${s.lastName}` : ""}"`,
      `"${(s?.projectTitle || "").replace(/"/g, '""')}"`,
      sc.totalScore,
      sc.rank ?? "",
      `"${(sc.notes || "").replace(/"/g, '""')}"`,
      ...RUBRIC_CRITERIA.map((c) => String(sc.rubric?.[c.key] ?? "")),
    ];
    lines.push(row.join(","));
  }
  return lines.join("\n");
}
