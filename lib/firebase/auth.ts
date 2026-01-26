import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface UserProfile {
  email: string;
  role: "sra" | "student" | "judge";
  createdAt: Date;
  profileComplete: boolean;
}

function ensureAuth() {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Make sure environment variables are set.");
  }
  return auth;
}

function ensureDb() {
  if (!db) {
    throw new Error("Firebase Firestore is not initialized. Make sure environment variables are set.");
  }
  return db;
}

export async function registerUser(
  email: string,
  password: string,
  role: "sra" | "student" | "judge"
): Promise<UserCredential> {
  const authInstance = ensureAuth();
  const dbInstance = ensureDb();
  
  const userCredential = await createUserWithEmailAndPassword(
    authInstance,
    email,
    password
  );

  // Create user profile in Firestore
  await setDoc(doc(dbInstance, "users", userCredential.user.uid), {
    email,
    role,
    createdAt: new Date(),
    profileComplete: false,
  });

  return userCredential;
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserCredential> {
  const authInstance = ensureAuth();
  return signInWithEmailAndPassword(authInstance, email, password);
}

export async function logoutUser(): Promise<void> {
  const authInstance = ensureAuth();
  return signOut(authInstance);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const dbInstance = ensureDb();
  const userDoc = await getDoc(doc(dbInstance, "users", uid));
  if (!userDoc.exists()) {
    return null;
  }
  return userDoc.data() as UserProfile;
}
