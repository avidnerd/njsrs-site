"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { snapshotExists } from "@/lib/firebase/database";

interface UserProfile {
  email: string;
  role: "sra" | "student" | "judge" | "fair_director" | "website_manager" | "proctor";
  createdAt: Date;
  profileComplete: boolean;
  emailVerified?: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && db) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);

          // Retry up to 3 times with backoff — the first attempt can fail
          // if Firebase is still initializing its cache (IndexedDB fallback race).
          let userDoc;
          let lastError: unknown;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              if (attempt > 0) {
                await new Promise((r) => setTimeout(r, 600 * attempt));
              }
              userDoc = await getDoc(userDocRef);
              break;
            } catch (err) {
              lastError = err;
            }
          }

          if (!userDoc) throw lastError;

          if (snapshotExists(userDoc)) {
            const data = userDoc.data();
            if (data) {
              const profileData: UserProfile = {
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                verificationCodeExpiry: data.verificationCodeExpiry?.toDate ? data.verificationCodeExpiry.toDate() : data.verificationCodeExpiry,
              } as UserProfile;

              setUserProfile(profileData);
            } else {
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
        } catch (error: any) {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
