import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

export interface PublishedFinalist {
  studentId: string;
  studentName: string;
  projectId?: string;
  projectTitle?: string;
  categoryName?: string;
}

export interface FinalistsDoc {
  published: boolean;
  publishedAt: Timestamp;
  students: PublishedFinalist[];
}
import { db } from "./config";

function ensureDb() {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

export interface ProctorProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  categoryId: string;
  categoryName: string;
  room?: string;
  createdAt: Date | Timestamp;
}

export interface LivePresenter {
  categoryId: string;
  categoryName: string;
  room: string;
  projectId: string;
  projectTitle: string;
  studentName: string;
  updatedAt: Date | Timestamp;
  // Next presenter (optional)
  nextProjectId?: string;
  nextProjectTitle?: string;
  nextStudentName?: string;
}

// ── Proctor profiles ─────────────────────────────────────────────────────────

export async function getAllProctors(): Promise<ProctorProfile[]> {
  const dbInstance = ensureDb();
  const snap = await getDocs(collection(dbInstance, "proctors"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProctorProfile));
}

export async function getProctor(uid: string): Promise<ProctorProfile | null> {
  const dbInstance = ensureDb();
  const snap = await getDoc(doc(dbInstance, "proctors", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ProctorProfile;
}

export async function deleteProctor(uid: string): Promise<void> {
  const dbInstance = ensureDb();
  await deleteDoc(doc(dbInstance, "proctors", uid));
}

export async function updateProctorRoom(uid: string, room: string): Promise<void> {
  const dbInstance = ensureDb();
  await updateDoc(doc(dbInstance, "proctors", uid), { room });
}

export async function updateProctorCategory(
  uid: string,
  categoryId: string,
  categoryName: string
): Promise<void> {
  const dbInstance = ensureDb();
  await updateDoc(doc(dbInstance, "proctors", uid), { categoryId, categoryName });
}

// ── Live presenter status ─────────────────────────────────────────────────────

export async function setLivePresenter(
  categoryId: string,
  categoryName: string,
  room: string,
  projectId: string,
  projectTitle: string,
  studentName: string
): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(doc(dbInstance, "liveStatus", categoryId), {
    categoryId,
    categoryName,
    room,
    projectId,
    projectTitle,
    studentName,
    updatedAt: Timestamp.now(),
  });
}

export async function clearLivePresenter(categoryId: string): Promise<void> {
  const dbInstance = ensureDb();
  await deleteDoc(doc(dbInstance, "liveStatus", categoryId));
}

export async function setNextPresenter(
  categoryId: string,
  projectId: string,
  projectTitle: string,
  studentName: string
): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(
    doc(dbInstance, "liveStatus", categoryId),
    { nextProjectId: projectId, nextProjectTitle: projectTitle, nextStudentName: studentName },
    { merge: true }
  );
}

export async function clearNextPresenter(categoryId: string): Promise<void> {
  const dbInstance = ensureDb();
  await updateDoc(doc(dbInstance, "liveStatus", categoryId), {
    nextProjectId: deleteField(),
    nextProjectTitle: deleteField(),
    nextStudentName: deleteField(),
  });
}

export async function getAllLiveStatuses(): Promise<LivePresenter[]> {
  const dbInstance = ensureDb();
  const snap = await getDocs(collection(dbInstance, "liveStatus"));
  return snap.docs.map((d) => d.data() as LivePresenter);
}

/** Subscribe to real-time updates of all live presenter statuses. */
export function subscribeLiveStatuses(
  callback: (statuses: LivePresenter[]) => void
): Unsubscribe {
  const dbInstance = ensureDb();
  return onSnapshot(collection(dbInstance, "liveStatus"), (snap) => {
    callback(snap.docs.map((d) => d.data() as LivePresenter));
  });
}

// ── Finalists board ───────────────────────────────────────────────────────────

const FINALISTS_DOC = "siteConfig/finalists";

export async function publishFinalists(students: PublishedFinalist[]): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(doc(dbInstance, "siteConfig", "finalists"), {
    published: true,
    publishedAt: Timestamp.now(),
    students,
  });
}

export async function unpublishFinalists(): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(doc(dbInstance, "siteConfig", "finalists"), {
    published: false,
    publishedAt: Timestamp.now(),
    students: [],
  });
}

/** Update the finalists list without changing published/unpublished state. */
export async function updateFinalistsList(students: PublishedFinalist[]): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(
    doc(dbInstance, "siteConfig", "finalists"),
    { students, publishedAt: Timestamp.now() },
    { merge: true }
  );
}

export function subscribeFinalists(
  callback: (data: FinalistsDoc | null) => void
): Unsubscribe {
  const dbInstance = ensureDb();
  return onSnapshot(doc(dbInstance, "siteConfig", "finalists"), (snap) => {
    callback(snap.exists() ? (snap.data() as FinalistsDoc) : null);
  });
}

// ── Scoring lock ──────────────────────────────────────────────────────────────

export interface ScoringConfigDoc {
  scoresLocked: boolean;
  lockedAt?: Timestamp;
}

export async function getScoringLock(): Promise<boolean> {
  const dbInstance = ensureDb();
  const snap = await getDoc(doc(dbInstance, "siteConfig", "scoringConfig"));
  if (!snap.exists()) return false;
  return (snap.data() as ScoringConfigDoc).scoresLocked ?? false;
}

export async function setScoringLock(locked: boolean): Promise<void> {
  const dbInstance = ensureDb();
  await setDoc(doc(dbInstance, "siteConfig", "scoringConfig"), {
    scoresLocked: locked,
    lockedAt: Timestamp.now(),
  });
}

export function subscribeScoringLock(
  callback: (locked: boolean) => void
): Unsubscribe {
  const dbInstance = ensureDb();
  return onSnapshot(doc(dbInstance, "siteConfig", "scoringConfig"), (snap) => {
    callback(snap.exists() ? ((snap.data() as ScoringConfigDoc).scoresLocked ?? false) : false);
  });
}
