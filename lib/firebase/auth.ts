import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User,
  UserCredential,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export interface UserProfile {
  email: string;
  role: "sra" | "student" | "judge" | "fair_director" | "website_manager";
  createdAt: Date;
  profileComplete: boolean;
  emailVerified?: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
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

// Generate verification code
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

  // Generate verification code
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date();
  verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24); // 24 hours expiry

  // Create user profile in Firestore
  await setDoc(doc(dbInstance, "users", userCredential.user.uid), {
    email,
    role,
    createdAt: new Date(),
    profileComplete: false,
    emailVerified: false,
    verificationCode,
    verificationCodeExpiry,
  });

  // Send email verification
  try {
    await sendEmailVerification(userCredential.user);
  } catch (error) {
    console.error("Error sending email verification:", error);
  }

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
    return true;
  }

  return false;
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
