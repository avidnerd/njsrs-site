import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

function ensureDb() {
  if (!db) {
    throw new Error("Firebase Firestore is not initialized. Make sure environment variables are set.");
  }
  return db;
}

// Type definitions
export interface School {
  id?: string;
  name: string;
  address?: string;
  createdAt: Date | Timestamp;
}

export interface SRA {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  schoolId: string;
  schoolName: string;
  phone?: string;
  title?: string;
  createdAt: Date | Timestamp;
  approved: boolean;
  adminApproved?: boolean;
}

export interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  schoolId: string;
  schoolName: string;
  sraId: string;
  sraName: string;
  grade: string;
  projectTitle?: string;
  projectDescription?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date | Timestamp;
  approvedAt?: Date | Timestamp | null;
  researchPlanUrl?: string;
  abstractUrl?: string;
  presentationUrl?: string;
  paymentStatus?: "not_received" | "received";
}

export interface Judge {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  // Contact Info
  address?: string;
  cellPhone?: string;
  // Institution
  institution?: string;
  institutionYears?: string;
  department?: string;
  currentPosition?: string;
  // Employment Status
  employmentStatus?: "currently_working" | "retired";
  // Education
  highestDegree?: string;
  degreeDate?: string;
  degreeDiscipline?: string;
  // Expertise
  areaOfExpertise?: string;
  // Publications & Patents
  publications?: string;
  patents?: string;
  // Experience
  experienceJudgingScienceFairs?: string;
  canCommitToAllProjects?: boolean;
  // Interview Approach
  interviewApproach?: string;
  // Handling Mistakes
  handleMistakesApproach?: string;
  // Conflicts of Interest
  knowsStudents?: boolean;
  knownStudents?: string;
  mentoringStudents?: boolean;
  mentoringDetails?: string;
  // References
  references?: string;
  // Availability
  availabilityApril18?: "in_person" | "remote_only" | "morning_only" | "full_day";
  availabilityMarch?: boolean;
  // Legacy fields
  qualifications?: string;
  affiliation?: string;
  expertise?: string[];
  createdAt: Date | Timestamp;
  adminApproved?: boolean;
}

// School functions
export async function createSchool(school: Omit<School, "id" | "createdAt">): Promise<string> {
  const dbInstance = ensureDb();
  const schoolRef = doc(collection(dbInstance, "schools"));
  await setDoc(schoolRef, {
    ...school,
    createdAt: Timestamp.now(),
  });
  return schoolRef.id;
}

export async function getSchool(schoolId: string): Promise<School | null> {
  const dbInstance = ensureDb();
  const schoolDoc = await getDoc(doc(dbInstance, "schools", schoolId));
  if (!schoolDoc.exists()) {
    return null;
  }
  return { id: schoolDoc.id, ...schoolDoc.data() } as School;
}

export async function searchSchools(searchTerm: string): Promise<School[]> {
  const dbInstance = ensureDb();
  const schoolsRef = collection(dbInstance, "schools");
  const q = query(schoolsRef, where("name", ">=", searchTerm), where("name", "<=", searchTerm + "\uf8ff"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as School));
}

export async function getAllSchools(): Promise<School[]> {
  const dbInstance = ensureDb();
  const schoolsRef = collection(dbInstance, "schools");
  const querySnapshot = await getDocs(schoolsRef);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as School));
}

// SRA functions
export async function createSRA(sraId: string, sra: Omit<SRA, "id" | "createdAt" | "approved" | "adminApproved">): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(doc(dbInstance, "sras", sraId), {
    ...sra,
    createdAt: Timestamp.now(),
    approved: true, // SRAs are auto-approved by system
    adminApproved: false, // Requires admin approval
  });
}

export async function getSRA(sraId: string): Promise<SRA | null> {
  const dbInstance = ensureDb();
  const sraDoc = await getDoc(doc(dbInstance, "sras", sraId));
  if (!sraDoc.exists()) {
    return null;
  }
  return { id: sraDoc.id, ...sraDoc.data() } as SRA;
}

export async function getSRAsBySchool(schoolId: string): Promise<SRA[]> {
  const dbInstance = ensureDb();
  const srasRef = collection(dbInstance, "sras");
  const q = query(srasRef, where("schoolId", "==", schoolId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SRA));
}

// Student functions
export async function createStudent(
  studentId: string,
  student: Omit<Student, "id" | "createdAt" | "status">
): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(doc(dbInstance, "students", studentId), {
    ...student,
    status: "pending",
    createdAt: Timestamp.now(),
    paymentStatus: "not_received",
  });
}

export async function getStudent(studentId: string): Promise<Student | null> {
  const dbInstance = ensureDb();
  const studentDoc = await getDoc(doc(dbInstance, "students", studentId));
  if (!studentDoc.exists()) {
    return null;
  }
  return { id: studentDoc.id, ...studentDoc.data() } as Student;
}

export async function getStudentsBySRA(sraId: string): Promise<Student[]> {
  const dbInstance = ensureDb();
  const studentsRef = collection(dbInstance, "students");
  const q = query(studentsRef, where("sraId", "==", sraId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student));
}

export async function updateStudentStatus(
  studentId: string,
  status: "approved" | "rejected"
): Promise<void> {
  const dbInstance = ensureDb();
  const studentRef = doc(dbInstance, "students", studentId);
  await updateDoc(studentRef, {
    status,
    approvedAt: status === "approved" ? Timestamp.now() : null,
  });
}

export async function updateStudentProject(
  studentId: string,
  updates: Partial<Pick<Student, "projectTitle" | "projectDescription" | "researchPlanUrl" | "abstractUrl" | "presentationUrl">>
): Promise<void> {
  const dbInstance = ensureDb();
  const studentRef = doc(dbInstance, "students", studentId);
  await updateDoc(studentRef, updates);
}

export async function updateStudentPaymentStatus(
  studentId: string,
  paymentStatus: "not_received" | "received"
): Promise<void> {
  const dbInstance = ensureDb();
  const studentRef = doc(dbInstance, "students", studentId);
  await updateDoc(studentRef, { paymentStatus });
}

// Judge functions
export async function createJudge(judgeId: string, judge: Omit<Judge, "id" | "createdAt" | "adminApproved">): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(doc(dbInstance, "judges", judgeId), {
    ...judge,
    createdAt: Timestamp.now(),
    adminApproved: false, // Requires admin approval
  });
}

export async function getJudge(judgeId: string): Promise<Judge | null> {
  const dbInstance = ensureDb();
  const judgeDoc = await getDoc(doc(dbInstance, "judges", judgeId));
  if (!judgeDoc.exists()) {
    return null;
  }
  return { id: judgeDoc.id, ...judgeDoc.data() } as Judge;
}

// Admin functions
export interface Admin {
  id?: string;
  email: string;
  role: "fair_director" | "website_manager";
  firstName?: string;
  lastName?: string;
  createdAt: Date | Timestamp;
}

export async function getAllSRAs(): Promise<SRA[]> {
  const dbInstance = ensureDb();
  const srasRef = collection(dbInstance, "sras");
  const querySnapshot = await getDocs(srasRef);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SRA));
}

export async function getAllJudges(): Promise<Judge[]> {
  const dbInstance = ensureDb();
  const judgesRef = collection(dbInstance, "judges");
  const querySnapshot = await getDocs(judgesRef);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Judge));
}

export async function updateSRAApproval(sraId: string, approved: boolean): Promise<void> {
  const dbInstance = ensureDb();
  const sraRef = doc(dbInstance, "sras", sraId);
  await updateDoc(sraRef, { adminApproved: approved });
}

export async function updateJudgeApproval(judgeId: string, approved: boolean): Promise<void> {
  const dbInstance = ensureDb();
  const judgeRef = doc(dbInstance, "judges", judgeId);
  await updateDoc(judgeRef, { adminApproved: approved });
}
