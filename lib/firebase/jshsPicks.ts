import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { snapshotExists } from "./database";

export interface JshsPicksDoc {
  judgeId: string;
  /** Ordered list of up to 5 finalist student IDs (index 0 = top pick). */
  studentIds: string[];
  updatedAt: Timestamp;
}

function ensureDb() {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

export async function saveJshsPicks(judgeId: string, studentIds: string[]): Promise<void> {
  const dbi = ensureDb();
  await setDoc(doc(dbi, "jshsPicks", judgeId), {
    judgeId,
    studentIds,
    updatedAt: Timestamp.now(),
  });
}

export async function getJshsPicks(judgeId: string): Promise<JshsPicksDoc | null> {
  const dbi = ensureDb();
  const snap = await getDoc(doc(dbi, "jshsPicks", judgeId));
  if (!snapshotExists(snap)) return null;
  return snap.data() as JshsPicksDoc;
}

export async function getAllJshsPicks(): Promise<(JshsPicksDoc & { id: string })[]> {
  const dbi = ensureDb();
  const snap = await getDocs(collection(dbi, "jshsPicks"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as JshsPicksDoc) }));
}

export async function clearJshsPicks(): Promise<number> {
  const dbi = ensureDb();
  const snap = await getDocs(collection(dbi, "jshsPicks"));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  return snap.docs.length;
}
