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

export interface School {
  id?: string;
  name: string;
  address?: string;
  createdAt: Date | Timestamp;
}

export interface Chaperone {
  name?: string;
  phone?: string;
  email?: string;
  inviteToken?: string;
  inviteSent?: boolean;
  confirmed?: boolean;
  confirmationDate?: Date | Timestamp;
  signature?: string;
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
  emailVerified?: boolean;
  chaperone?: Chaperone;
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
  researchReportUrl?: string;
  slideshowUrl?: string;
  srcQuestions?: SRCQuestions;
  srcApprovalRequested?: boolean;
  srcApprovalRequestedAt?: Date | Timestamp | null;
  srcApproved?: boolean;
  srcApprovedAt?: Date | Timestamp | null;
  srcApprovedBy?: string;
  srcNotes?: string;
  ethicsQuestionnaire?: EthicsQuestionnaire;
  statementOfOutsideAssistance?: StatementOfOutsideAssistance;
  photoRelease?: PhotoRelease;
}

export interface SRCQuestions {
  involvesHumanParticipants?: boolean;
  humanParticipantsDetails?: string;
  irbApprovalObtained?: boolean;
  irbApprovalDetails?: string;
  informedConsentObtained?: boolean;
  involvesVertebrateAnimals?: boolean;
  vertebrateAnimalsDetails?: string;
  animalCareProtocol?: string;
  veterinaryOversight?: boolean;
  involvesPHBA?: boolean;
  phbaDetails?: string;
  biosafetyLevel?: string;
  phbaLocation?: string;
  involvesHazardousMaterials?: boolean;
  hazardousMaterialsDetails?: string;
  safetyProtocols?: string;
  isContinuationProject?: boolean;
  continuationProjectDetails?: string;
  previousYearAbstract?: string;
}

export interface EthicsQuestionnaire {
  studentOwnership?: string;
  mentorAssistance?: string;
  labTechnicianAssistance?: string;
  externalData?: boolean;
  externalDataDetails?: string;
  properAttribution?: boolean;
  literatureReviewCompleted?: boolean;
  allProceduresReported?: boolean;
  modificationsDisclosed?: boolean;
  dataCollectionTransparent?: boolean;
  aiToolsUsed?: boolean;
  aiUsageDetails?: string;
  aiDisclosed?: boolean;
}

export interface StatementOfOutsideAssistance {
  studentFirstName?: string;
  studentLastName?: string;
  partnerFirstName?: string;
  partnerLastName?: string;
  researchReportTitle?: string;
  school?: string;
  teacherFirstName?: string;
  teacherLastName?: string;
  mentorFirstName?: string;
  mentorLastName?: string;
  mentorInstitution?: string;
  
  question1?: string;
  question2?: string;
  question3?: string;
  question4?: string;
  question5?: string;
  question6?: string;
  question7?: string;
  question8?: string;
  question9?: string;
  question10?: string;
  question11?: string;
  question12?: string;
  question13?: string;
  question14?: string;
  
  teacherMentorComments?: string;
  teacherMentorSafetyStatement?: string;
  
  studentSignature?: string;
  studentSignatureDate?: Date | Timestamp;
  teacherSignature?: string;
  teacherSignatureDate?: Date | Timestamp;
  teacherSchool?: string;
  mentorSignature?: string;
  mentorSignatureDate?: Date | Timestamp;
  mentorName?: string;
  mentorTitle?: string;
  mentorInstitutionSignature?: string;
  parentSignature?: string;
  parentSignatureDate?: Date | Timestamp;
  parentName?: string;
  parentPhone?: string;
  
  teacherEmail?: string;
  teacherInviteSent?: boolean;
  teacherInviteToken?: string;
  mentorEmail?: string;
  mentorInviteSent?: boolean;
  mentorInviteToken?: string;
  parentEmail?: string;
  parentInviteSent?: boolean;
  parentInviteToken?: string;
  
  studentCompleted?: boolean;
  teacherCompleted?: boolean;
  mentorCompleted?: boolean;
  parentCompleted?: boolean;
  formCompleted?: boolean;
}

export interface PhotoRelease {
  parentEmail?: string;
  parentInviteSent?: boolean;
  parentInviteToken?: string;
  parentName?: string;
  parentSignature?: string;
  parentSignatureDate?: Date | Timestamp;
  parentPhone?: string;
  completed?: boolean;
}

export interface Judge {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  cellPhone?: string;
  institution?: string;
  institutionYears?: string;
  department?: string;
  currentPosition?: string;
  employmentStatus?: "currently_working" | "retired";
  highestDegree?: string;
  degreeDate?: string;
  degreeDiscipline?: string;
  areaOfExpertise?: string;
  publications?: string;
  patents?: string;
  experienceJudgingScienceFairs?: string;
  canCommitToAllProjects?: boolean;
  knowsStudents?: boolean;
  knownStudents?: string;
  mentoringStudents?: boolean;
  mentoringDetails?: string;
  availabilityApril18?: "remote_morning_only" | "in_person_full_day" | "in_person_morning_only";
  qualifications?: string;
  affiliation?: string;
  expertise?: string[];
  createdAt: Date | Timestamp;
  adminApproved?: boolean;
}

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

export async function getSchoolsWithSRAs(): Promise<School[]> {
  const dbInstance = ensureDb();
  const srasRef = collection(dbInstance, "sras");
  const srasSnapshot = await getDocs(srasRef);
  
  const schoolIds = new Set<string>();
  srasSnapshot.docs.forEach((doc) => {
    const sra = doc.data() as SRA;
    if (sra.schoolId) {
      schoolIds.add(sra.schoolId);
    }
  });
  
  const schools: School[] = [];
  for (const schoolId of schoolIds) {
    const school = await getSchool(schoolId);
    if (school) {
      schools.push(school);
    }
  }
  
  return schools.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createSRA(sraId: string, sra: Omit<SRA, "id" | "createdAt" | "approved" | "adminApproved">): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(doc(dbInstance, "sras", sraId), {
    ...sra,
    createdAt: Timestamp.now(),
    approved: true,
    adminApproved: false,
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
  const students = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    console.log(`Student ${doc.id}: sraId=${data.sraId}, status=${data.status}`);
    return { id: doc.id, ...data } as Student;
  });
  console.log(`Query for sraId=${sraId} returned ${students.length} students`);
  return students;
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
  updates: Partial<Pick<Student, "projectTitle" | "projectDescription" | "researchPlanUrl" | "abstractUrl" | "presentationUrl">>,
  resetSignatures?: boolean
): Promise<void> {
  const dbInstance = ensureDb();
  const studentRef = doc(dbInstance, "students", studentId);
  
  if (resetSignatures && updates.researchPlanUrl) {
    const studentDoc = await getDoc(studentRef);
    if (studentDoc.exists()) {
      const currentData = studentDoc.data();
      const currentSOA = currentData.statementOfOutsideAssistance || {};
      
      const resetSOA = {
        ...currentSOA,
        studentCompleted: false,
        studentSignature: null,
        teacherCompleted: false,
        mentorCompleted: false,
        parentCompleted: false,
        teacherInviteSent: false,
        mentorInviteSent: false,
        parentInviteSent: false,
      };
      
      await updateDoc(studentRef, {
        ...updates,
        statementOfOutsideAssistance: resetSOA,
      });
      return;
    }
  }
  
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

export async function updateStudentMaterials(
  studentId: string,
  updates: Partial<Pick<Student, "researchReportUrl" | "abstractUrl" | "slideshowUrl" | "srcQuestions" | "ethicsQuestionnaire" | "statementOfOutsideAssistance" | "srcApprovalRequested" | "srcApprovalRequestedAt" | "photoRelease">>
): Promise<void> {
  const dbInstance = ensureDb();
  const studentRef = doc(dbInstance, "students", studentId);
  await updateDoc(studentRef, updates);
}

export async function requestSRCApproval(studentId: string): Promise<void> {
  const dbInstance = ensureDb();
  const studentRef = doc(dbInstance, "students", studentId);
  await updateDoc(studentRef, {
    srcApprovalRequested: true,
    srcApprovalRequestedAt: Timestamp.now(),
  });
}

export async function updateSRCApproval(
  studentId: string,
  approved: boolean,
  approvedBy: string,
  notes?: string
): Promise<void> {
  const dbInstance = ensureDb();
  const studentRef = doc(dbInstance, "students", studentId);
  await updateDoc(studentRef, {
    srcApproved: approved,
    srcApprovedAt: approved ? Timestamp.now() : null,
    srcApprovedBy: approved ? approvedBy : null,
    srcNotes: notes || null,
  });
}

export async function getStudentsWithSRCRequests(): Promise<Student[]> {
  const dbInstance = ensureDb();
  const studentsRef = collection(dbInstance, "students");
  const q = query(studentsRef, where("srcApprovalRequested", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student));
}

export async function getAllStudents(): Promise<Student[]> {
  const dbInstance = ensureDb();
  const studentsRef = collection(dbInstance, "students");
  const querySnapshot = await getDocs(studentsRef);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...data } as Student;
  });
}

export async function createJudge(judgeId: string, judge: Omit<Judge, "id" | "createdAt" | "adminApproved">): Promise<void> {
  const dbInstance = ensureDb();
  const judgeData = {
    ...judge,
    createdAt: Timestamp.now(),
    adminApproved: false,
  };
  console.log("Creating judge document with ID:", judgeId);
  console.log("Judge data:", judgeData);
  await setDoc(doc(dbInstance, "judges", judgeId), judgeData);
  console.log("Judge document created successfully");
}

export async function getJudge(judgeId: string): Promise<Judge | null> {
  const dbInstance = ensureDb();
  const judgeDoc = await getDoc(doc(dbInstance, "judges", judgeId));
  if (!judgeDoc.exists()) {
    return null;
  }
  return { id: judgeDoc.id, ...judgeDoc.data() } as Judge;
}

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
  const sras = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SRA));
  
  const usersRef = collection(dbInstance, "users");
  const usersSnapshot = await getDocs(usersRef);
  const usersMap = new Map<string, { emailVerified?: boolean }>();
  
  usersSnapshot.docs.forEach((doc) => {
    const userData = doc.data();
    usersMap.set(doc.id, { emailVerified: userData.emailVerified || false });
  });
  
  return sras.map((sra) => ({
    ...sra,
    emailVerified: sra.id ? usersMap.get(sra.id)?.emailVerified || false : false,
  }));
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

export async function updateSRAChaperone(sraId: string, chaperone: Chaperone): Promise<void> {
  const dbInstance = ensureDb();
  const sraRef = doc(dbInstance, "sras", sraId);
  await updateDoc(sraRef, { chaperone });
}

export async function updateJudgeApproval(judgeId: string, approved: boolean): Promise<void> {
  const dbInstance = ensureDb();
  const judgeRef = doc(dbInstance, "judges", judgeId);
  await updateDoc(judgeRef, { adminApproved: approved });
}
