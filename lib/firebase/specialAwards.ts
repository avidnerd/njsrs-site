import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

function ensureDb() {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

// ─── Award definitions ────────────────────────────────────────────────────────

export interface SpecialAwardCriterion {
  key: string;
  label: string;
  maxPoints: number;
  description: string;
}

export interface SpecialAward {
  id: string;
  name: string;
  criteria: SpecialAwardCriterion[];
}

export const SPECIAL_AWARDS: SpecialAward[] = [
  {
    id: "ai_biomedical",
    name: "AI-Biomedical Convergence Award",
    criteria: [
      {
        key: "technicalAI",
        label: "AI / Computational Technical Excellence",
        maxPoints: 25,
        description:
          "Quality, sophistication, and appropriateness of the AI or machine-learning methods used.",
      },
      {
        key: "biomedUnderstanding",
        label: "Biomedical Understanding",
        maxPoints: 25,
        description:
          "Depth of knowledge of the biological or clinical problem being addressed.",
      },
      {
        key: "integration",
        label: "Integration & Innovation",
        maxPoints: 20,
        description:
          "How effectively AI and biomedical aspects are combined to produce new insights or capabilities.",
      },
      {
        key: "healthImpact",
        label: "Clinical / Health Impact",
        maxPoints: 20,
        description:
          "Significance and potential of the work to advance health outcomes or clinical practice.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation of research findings.",
      },
    ],
  },
  {
    id: "excellence_statistics",
    name: "Award for Excellence in Statistics",
    criteria: [
      {
        key: "studyDesign",
        label: "Study Design",
        maxPoints: 20,
        description:
          "Quality and rigor of the experimental or observational design, including control of confounding variables.",
      },
      {
        key: "methodology",
        label: "Statistical Methodology",
        maxPoints: 25,
        description:
          "Appropriateness, rigor, and sophistication of the statistical methods applied.",
      },
      {
        key: "dataQuality",
        label: "Data Collection & Quality",
        maxPoints: 15,
        description: "Integrity, volume, and reliability of data collected.",
      },
      {
        key: "interpretation",
        label: "Interpretation & Reasoning",
        maxPoints: 25,
        description:
          "Validity of conclusions drawn, handling of uncertainty, and acknowledgment of statistical limitations.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 15,
        description:
          "Clarity of statistical reporting, use of visualizations, and quality of the presentation.",
      },
    ],
  },
  {
    id: "kucheruk_cancer",
    name: "August & Olga Kucheruk Cancer Research Innovation Award",
    criteria: [
      {
        key: "innovation",
        label: "Scientific Innovation",
        maxPoints: 25,
        description:
          "Novelty and originality of the approach, hypothesis, or methodology in addressing a cancer-related challenge.",
      },
      {
        key: "cancerBiology",
        label: "Cancer Biology Understanding",
        maxPoints: 20,
        description:
          "Depth of knowledge of oncology concepts, tumor biology, or relevant clinical context.",
      },
      {
        key: "rigor",
        label: "Research Rigor",
        maxPoints: 20,
        description:
          "Quality of experimental design, controls, reproducibility, and data integrity.",
      },
      {
        key: "clinicalImpact",
        label: "Potential Clinical Impact",
        maxPoints: 25,
        description:
          "Relevance and potential of the work to improve cancer outcomes, diagnostics, or treatment.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation.",
      },
    ],
  },
  {
    id: "translational_medicine",
    name: "Translational Medicine & Therapeutics Award",
    criteria: [
      {
        key: "translationalRelevance",
        label: "Translational Relevance",
        maxPoints: 25,
        description:
          "Clarity of the connection from bench discovery to potential clinical or therapeutic application.",
      },
      {
        key: "scientificRigor",
        label: "Scientific Rigor",
        maxPoints: 20,
        description: "Quality of experimental or computational work, controls, and methodology.",
      },
      {
        key: "therapeuticInnovation",
        label: "Therapeutic Innovation",
        maxPoints: 20,
        description: "Novelty and creativity of the therapeutic approach or strategy explored.",
      },
      {
        key: "diseaseUnderstanding",
        label: "Disease Mechanism Understanding",
        maxPoints: 25,
        description:
          "Depth of understanding of the pathophysiology or molecular mechanisms relevant to the work.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation.",
      },
    ],
  },
  {
    id: "intelligent_systems",
    name: "Intelligent Systems for Real-World Impact Award",
    criteria: [
      {
        key: "technicalInnovation",
        label: "Technical Innovation",
        maxPoints: 20,
        description:
          "Quality, sophistication, and originality of the AI, ML, or computational approach.",
      },
      {
        key: "realWorldApplicability",
        label: "Real-World Applicability",
        maxPoints: 25,
        description:
          "Practicality, scalability, and potential for deployment or adoption in real settings.",
      },
      {
        key: "problemSignificance",
        label: "Problem Significance",
        maxPoints: 20,
        description:
          "Importance, scope, and relevance of the real-world problem being addressed.",
      },
      {
        key: "systemPerformance",
        label: "System Performance & Results",
        maxPoints: 25,
        description:
          "Demonstrated effectiveness, measurable improvements, and strength of experimental validation.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation.",
      },
    ],
  },
  {
    id: "behavioral_insights",
    name: "Behavioral Insights & Human Decision-Making Award",
    criteria: [
      {
        key: "researchDesign",
        label: "Research Design",
        maxPoints: 25,
        description:
          "Quality and rigor of the behavioral study design, including participant selection, controls, and methodology.",
      },
      {
        key: "theoreticalGrounding",
        label: "Theoretical Grounding",
        maxPoints: 20,
        description:
          "Connection to established behavioral, cognitive, or social science theory.",
      },
      {
        key: "dataAnalysis",
        label: "Data & Analysis",
        maxPoints: 20,
        description:
          "Rigor of data collection, quality of analytical methods, and validity of findings.",
      },
      {
        key: "practicalApplication",
        label: "Practical Application",
        maxPoints: 25,
        description:
          "Actionability of insights and real-world relevance to improving decisions, outcomes, or well-being.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation.",
      },
    ],
  },
  {
    id: "cook_engineering",
    name: "Horace and Marion Cook Prize for Innovation in Engineering",
    criteria: [
      {
        key: "ingenuity",
        label: "Ingenuity & Creativity",
        maxPoints: 25,
        description:
          "Cleverness, originality, and resourcefulness of the engineering solution.",
      },
      {
        key: "functionality",
        label: "Functionality",
        maxPoints: 25,
        description:
          "Does the device or system actually work as intended? Demonstrated performance.",
      },
      {
        key: "resourceEfficiency",
        label: "Resource Efficiency",
        maxPoints: 25,
        description:
          "Effectiveness of the solution relative to the simplicity or cost of resources used — Yankee ingenuity.",
      },
      {
        key: "designProcess",
        label: "Engineering Design Process",
        maxPoints: 15,
        description:
          "Quality of iterative design, testing, and refinement demonstrated throughout the project.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation.",
      },
    ],
  },
  {
    id: "assistive_technology",
    name: "Assistive Technology Award",
    criteria: [
      {
        key: "userCenteredDesign",
        label: "User-Centered Design",
        maxPoints: 25,
        description:
          "Consideration of user needs, accessibility, usability, and human factors in the design.",
      },
      {
        key: "functionality",
        label: "Technical Functionality",
        maxPoints: 25,
        description:
          "Does the device or system perform its intended function reliably and effectively?",
      },
      {
        key: "innovation",
        label: "Innovation",
        maxPoints: 20,
        description: "Novelty and originality of the approach or solution.",
      },
      {
        key: "impact",
        label: "Impact on Independence / Quality of Life",
        maxPoints: 20,
        description:
          "Measurable benefit to users — improvements in independence, performance, or quality of life.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation.",
      },
    ],
  },
  {
    id: "molecular_cellular",
    name: "Molecular & Cellular Mechanisms Award",
    criteria: [
      {
        key: "mechanisticInsight",
        label: "Mechanistic Insight",
        maxPoints: 25,
        description:
          "Depth and clarity of understanding of molecular or cellular mechanisms involved.",
      },
      {
        key: "experimentalRigor",
        label: "Experimental Rigor",
        maxPoints: 25,
        description:
          "Quality of experimental design, controls, reproducibility, and data integrity.",
      },
      {
        key: "scientificInnovation",
        label: "Scientific Innovation",
        maxPoints: 20,
        description: "Novelty and significance of the findings or approach.",
      },
      {
        key: "biologicalConnection",
        label: "Connection to Broader Biology / Health",
        maxPoints: 20,
        description:
          "Ability to connect molecular findings to broader biological systems or health-related outcomes.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation.",
      },
    ],
  },
  {
    id: "environmental_sustainability",
    name: "Environmental Sustainability & Public Health Award",
    criteria: [
      {
        key: "environmentalRelevance",
        label: "Environmental Relevance",
        maxPoints: 20,
        description:
          "Connection to real, significant environmental challenges (pollution, climate, ecosystem health, etc.).",
      },
      {
        key: "publicHealthConnection",
        label: "Public Health Connection",
        maxPoints: 25,
        description:
          "Clarity and rigor of the link between environmental conditions and human health outcomes.",
      },
      {
        key: "researchRigor",
        label: "Research Rigor",
        maxPoints: 20,
        description:
          "Quality of data collection, analytical methodology, and validity of conclusions.",
      },
      {
        key: "solutionInnovation",
        label: "Solution Innovation",
        maxPoints: 25,
        description:
          "Evidence-based, impactful, and actionable solutions that promote sustainability and healthier communities.",
      },
      {
        key: "communication",
        label: "Communication",
        maxPoints: 10,
        description: "Clarity and quality of presentation.",
      },
    ],
  },
];

export function getSpecialAward(awardId: string): SpecialAward | undefined {
  return SPECIAL_AWARDS.find((a) => a.id === awardId);
}

export function computeSpecialAwardTotal(
  criteria: SpecialAwardCriterion[],
  rubric: Record<string, number>
): number {
  return criteria.reduce((sum, c) => sum + (Number(rubric[c.key]) || 0), 0);
}

export function emptySpecialRubric(criteria: SpecialAwardCriterion[]): Record<string, number> {
  return Object.fromEntries(criteria.map((c) => [c.key, 0]));
}

// ─── Firestore types ──────────────────────────────────────────────────────────

export interface SpecialAwardAssignment {
  awardId: string;
  judgeId: string;
  createdAt: Timestamp;
}

export interface SpecialAwardScore {
  awardId: string;
  judgeId: string;
  studentId: string;
  rubric: Record<string, number>;
  totalScore: number;
  notes: string;
  updatedAt: Timestamp;
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

function assignmentDocId(awardId: string, judgeId: string) {
  return `${awardId}_${judgeId}`;
}

function scoreDocId(awardId: string, judgeId: string, studentId: string) {
  return `${awardId}_${judgeId}_${studentId}`;
}

export async function setSpecialAwardAssignment(
  awardId: string,
  judgeId: string
): Promise<void> {
  const dbi = ensureDb();
  await setDoc(doc(dbi, "specialAwardAssignments", assignmentDocId(awardId, judgeId)), {
    awardId,
    judgeId,
    createdAt: Timestamp.now(),
  });
}

export async function removeSpecialAwardAssignment(
  awardId: string,
  judgeId: string
): Promise<void> {
  const dbi = ensureDb();
  await deleteDoc(doc(dbi, "specialAwardAssignments", assignmentDocId(awardId, judgeId)));
}

export async function getAllSpecialAwardAssignments(): Promise<
  (SpecialAwardAssignment & { id: string })[]
> {
  const dbi = ensureDb();
  const snap = await getDocs(collection(dbi, "specialAwardAssignments"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SpecialAwardAssignment) }));
}

export async function getSpecialAwardAssignmentsForJudge(
  judgeId: string
): Promise<(SpecialAwardAssignment & { id: string })[]> {
  const dbi = ensureDb();
  const q = query(
    collection(dbi, "specialAwardAssignments"),
    where("judgeId", "==", judgeId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SpecialAwardAssignment) }));
}

export async function saveSpecialAwardScore(
  awardId: string,
  judgeId: string,
  studentId: string,
  criteria: SpecialAwardCriterion[],
  rubric: Record<string, number>,
  notes: string
): Promise<void> {
  const dbi = ensureDb();
  const totalScore = computeSpecialAwardTotal(criteria, rubric);
  await setDoc(
    doc(dbi, "specialAwardScores", scoreDocId(awardId, judgeId, studentId)),
    {
      awardId,
      judgeId,
      studentId,
      rubric,
      totalScore,
      notes: notes.trim(),
      updatedAt: Timestamp.now(),
    }
  );
}

export async function getSpecialAwardScoresForJudge(
  judgeId: string,
  awardId: string
): Promise<(SpecialAwardScore & { id: string })[]> {
  const dbi = ensureDb();
  const q = query(
    collection(dbi, "specialAwardScores"),
    where("judgeId", "==", judgeId),
    where("awardId", "==", awardId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SpecialAwardScore) }));
}

export async function getAllSpecialAwardScores(): Promise<
  (SpecialAwardScore & { id: string })[]
> {
  const dbi = ensureDb();
  const snap = await getDocs(collection(dbi, "specialAwardScores"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SpecialAwardScore) }));
}

// ─── Candidate management (per judge per award) ───────────────────────────────

function candidatesDocId(awardId: string, judgeId: string) {
  return `${awardId}_${judgeId}`;
}

export async function setSpecialAwardCandidates(
  awardId: string,
  judgeId: string,
  studentIds: string[]
): Promise<void> {
  const dbi = ensureDb();
  await setDoc(doc(dbi, "specialAwardCandidates", candidatesDocId(awardId, judgeId)), {
    awardId,
    judgeId,
    studentIds,
  });
}

// Returns studentIds for a specific judge+award combo
export async function getSpecialAwardCandidates(
  awardId: string,
  judgeId: string
): Promise<string[]> {
  const dbi = ensureDb();
  const snap = await getDocs(
    query(
      collection(dbi, "specialAwardCandidates"),
      where("awardId", "==", awardId),
      where("judgeId", "==", judgeId)
    )
  );
  if (snap.empty) return [];
  return (snap.docs[0].data().studentIds as string[]) ?? [];
}

// Returns { `${awardId}_${judgeId}`: studentIds[] }
export async function getAllSpecialAwardCandidates(): Promise<Record<string, string[]>> {
  const dbi = ensureDb();
  const snap = await getDocs(collection(dbi, "specialAwardCandidates"));
  const result: Record<string, string[]> = {};
  for (const d of snap.docs) {
    const data = d.data();
    result[candidatesDocId(data.awardId as string, data.judgeId as string)] =
      (data.studentIds as string[]) ?? [];
  }
  return result;
}

export async function clearAllSpecialAwardScores(): Promise<number> {
  const dbi = ensureDb();
  const snap = await getDocs(collection(dbi, "specialAwardScores"));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  return snap.docs.length;
}
