"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface UserProfile {
  email: string;
  role: "sra" | "student" | "judge" | "fair_director" | "website_manager";
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
      console.error("Firebase not initialized. Auth:", !!auth, "DB:", !!db);
      setLoading(false);
      return;
    }

    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed. User:", firebaseUser ? firebaseUser.uid : "null");
      setUser(firebaseUser);

      if (firebaseUser && db) {
        // Fetch user profile from Firestore
        try {
          console.log("Fetching user profile for UID:", firebaseUser.uid);
          const userDocRef = doc(db, "users", firebaseUser.uid);
          console.log("Document reference path:", userDocRef.path);
          
          const userDoc = await getDoc(userDocRef);
          console.log("Document exists:", userDoc.exists());
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("Raw user profile data:", data);
            
            // Convert Firestore Timestamp to Date if needed
            const profileData: UserProfile = {
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              verificationCodeExpiry: data.verificationCodeExpiry?.toDate ? data.verificationCodeExpiry.toDate() : data.verificationCodeExpiry,
            } as UserProfile;
            
            console.log("Processed user profile:", profileData);
            setUserProfile(profileData);
          } else {
            console.error("User profile not found in Firestore. Looking for UID:", firebaseUser.uid);
            console.error("Document path:", userDocRef.path);
            console.error("Please ensure the document ID in Firestore matches this UID exactly.");
            setUserProfile(null);
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          console.error("Error code:", error?.code);
          console.error("Error message:", error?.message);
          
          // Check if it's a permission error
          if (error?.code === "permission-denied") {
            console.error("PERMISSION DENIED: Check Firestore security rules!");
            console.error("Make sure the rule allows: allow read: if isOwner(userId);");
          }
          
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
