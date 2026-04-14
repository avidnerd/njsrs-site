import { registerUser } from "./auth";
import { createSRA, createJudge, createSchool, snapshotExists } from "./database";
import type { SRA, Student, Judge, School } from "./database";

export async function registerSRA(
  email: string,
  password: string,
  sraData: Omit<SRA, "id" | "email" | "createdAt" | "approved" | "adminApproved">
): Promise<{ verificationCode: string }> {
  let userCredential;
  let verificationCode;
  try {
    console.log("Step 1: Creating user account...");
    const result = await registerUser(email, password, "sra");
    userCredential = result.userCredential;
    verificationCode = result.verificationCode;
    console.log("Step 1: User account created, UID:", userCredential.user.uid);
  } catch (error: any) {
    console.error("Error in registerUser:", error);
    throw new Error(`Failed to create user account: ${error.message || "Unknown error"}`);
  }

  
  const schoolId = sraData.schoolId;
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  console.log("Step 2: Using school ID:", schoolId);

  try {
    console.log("Step 3: Creating SRA document with UID:", userCredential.user.uid);
    await createSRA(userCredential.user.uid, {
      ...sraData,
      email,
      schoolId,
    });
    console.log("Step 3: SRA document created successfully");
  } catch (sraError: any) {
    console.error("Error creating SRA document:", sraError);
    console.error("SRA Error Code:", sraError.code);
    console.error("SRA Error Details:", sraError);
    throw new Error(`Failed to create SRA profile: ${sraError.message || "Unknown error"}`);
  }

  return { verificationCode };
}

export async function registerStudent(
  email: string,
  password: string,
  studentData: Omit<Student, "id" | "email" | "createdAt" | "status" | "sraName" | "sraId"> & { sraId?: string }
): Promise<{ verificationCode: string }> {
  const { userCredential, verificationCode } = await registerUser(email, password, "student");

  let teamMemberUserId: string | undefined;
  
  if (studentData.isTeamProject && studentData.teamMemberEmail) {
    try {
      const { userCredential: teamMemberCredential } = await registerUser(
        studentData.teamMemberEmail,
        password,
        "student"
      );
      teamMemberUserId = teamMemberCredential.user.uid;
    } catch (error: any) {
      throw new Error(`Failed to create team member account: ${error.message}`);
    }
  }

  const primaryStudentId = userCredential.user.uid;
  
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const { auth } = await import("./config");
  if (!auth) {
    throw new Error("Firebase Auth not initialized");
  }
  
  const signInResult = await signInWithEmailAndPassword(auth, email, password);
  console.log("Signed in user to enable Firestore writes");

  const payload = {
    ...studentData,
    sraId: studentData.sraId ?? "",
    email,
    sraName: "",
    teamMemberUserId,
  };

  try {
    const idToken = await signInResult.user.getIdToken(true);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "";
    const res = await fetch(`${baseUrl}/api/create-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, studentData: payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server returned ${res.status}`);
    }
    console.log("Student document created successfully via API");
  } catch (error: any) {
    console.error("Error creating student document:", error);
    throw new Error(`Failed to create student document: ${error.message || "Unknown error"}`);
  }

  if (teamMemberUserId) {
    console.log("Updating team member user profile with studentDocumentId:", primaryStudentId);
    const { updateDoc, doc } = await import("firebase/firestore");
    const { db } = await import("./config");
    if (!db) {
      throw new Error("Firebase db instance is null");
    }
    
    try {
      await updateDoc(doc(db, "users", teamMemberUserId), {
        studentDocumentId: primaryStudentId,
      });
      console.log("Team member user profile updated successfully");
    } catch (error: any) {
      if (error.code !== "permission-denied") {
        throw error;
      }
    }
  }

  return { verificationCode };
}

export async function registerJudge(
  email: string,
  password: string,
  judgeData: Omit<Judge, "id" | "email" | "createdAt" | "qualifications" | "affiliation" | "expertise" | "adminApproved">
): Promise<{ verificationCode: string; uid: string }> {
  const { userCredential, verificationCode } = await registerUser(email, password, "judge");

  await createJudge(userCredential.user.uid, {
    ...judgeData,
    email,
  });

  return { verificationCode, uid: userCredential.user.uid };
}
