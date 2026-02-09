import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

export interface UserProfile {
  email: string;
  role: "sra" | "student" | "judge" | "fair_director" | "website_manager";
  createdAt: Date;
  profileComplete: boolean;
  emailVerified?: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  studentDocumentId?: string;
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

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerUser(
  email: string,
  password: string,
  role: "sra" | "student" | "judge"
): Promise<{ userCredential: UserCredential; verificationCode: string }> {
  const authInstance = ensureAuth();
  const dbInstance = ensureDb();
  
  const userCredential = await createUserWithEmailAndPassword(
    authInstance,
    email,
    password
  );

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date();
  verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24);

  await setDoc(doc(dbInstance, "users", userCredential.user.uid), {
    email,
    role,
    createdAt: Timestamp.now(),
    profileComplete: false,
    emailVerified: false,
    verificationCode,
    verificationCodeExpiry: Timestamp.fromDate(verificationCodeExpiry),
  });

  return { userCredential, verificationCode };
}

export async function verifyEmailCode(
  userId: string,
  code: string
): Promise<boolean> {
  const dbInstance = ensureDb();
  const userDoc = await getDoc(doc(dbInstance, "users", userId));
  
  if (!userDoc.exists()) {
    return false;
  }

  const userData = userDoc.data();
  const now = new Date();
  const expiry = userData.verificationCodeExpiry?.toDate();

  if (
    userData.verificationCode === code &&
    expiry &&
    expiry > now
  ) {
    await updateDoc(doc(dbInstance, "users", userId), {
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    });
    
    if (userData.role === "student") {
      const { getStudent } = await import("./database");
      const student = await getStudent(userId);
      if (student?.isTeamProject && student.teamMemberUserId) {
        const teamMemberUserDoc = await getDoc(doc(dbInstance, "users", student.teamMemberUserId));
        if (teamMemberUserDoc.exists()) {
          await updateDoc(doc(dbInstance, "users", student.teamMemberUserId), {
            emailVerified: true,
            verificationCode: null,
            verificationCodeExpiry: null,
          });
        }
      }
    }
    
    return true;
  }

  return false;
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserCredential> {
  const authInstance = ensureAuth();
  const result = await signInWithEmailAndPassword(authInstance, email, password);
  console.log("Login successful, User UID:", result.user.uid);
  return result;
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

export async function resendVerificationCode(userId: string): Promise<string> {
  const dbInstance = ensureDb();
  const userDoc = await getDoc(doc(dbInstance, "users", userId));
  
  if (!userDoc.exists()) {
    throw new Error("User not found");
  }

  const userData = userDoc.data();
  
  if (userData.emailVerified) {
    throw new Error("Email already verified");
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date();
  verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24);

  await updateDoc(doc(dbInstance, "users", userId), {
    verificationCode,
    verificationCodeExpiry: Timestamp.fromDate(verificationCodeExpiry),
  });

  return verificationCode;
}
