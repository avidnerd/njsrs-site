import { registerUser } from "./auth";
import { createSRA, createStudent, createJudge, createSchool, getSRAsBySchool } from "./database";
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
  studentData: Omit<Student, "id" | "email" | "createdAt" | "status" | "sraName">
): Promise<{ verificationCode: string }> {
  const sras = await getSRAsBySchool(studentData.schoolId);
  const selectedSRA = sras.find((sra) => sra.id === studentData.sraId);
  
  if (!selectedSRA) {
    throw new Error("Selected SRA not found");
  }

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
  
  await signInWithEmailAndPassword(auth, email, password);
  console.log("Signed in user to enable Firestore writes");
  
  try {
    console.log("Creating student document with ID:", primaryStudentId);
    console.log("Student data:", {
      ...studentData,
      email,
      sraName: `${selectedSRA.firstName} ${selectedSRA.lastName}`,
      teamMemberUserId,
    });
    
    await createStudent(primaryStudentId, {
      ...studentData,
      email,
      sraName: `${selectedSRA.firstName} ${selectedSRA.lastName}`,
      teamMemberUserId,
    });
    
    console.log("Student document created successfully");
    
    const { getDoc, doc } = await import("firebase/firestore");
    const { db } = await import("./config");
    if (db) {
      const verifyDoc = await getDoc(doc(db, "students", primaryStudentId));
      if (!verifyDoc.exists()) {
        throw new Error("Student document was not created - verification failed");
      }
      console.log("Verified: Student document exists in Firestore");
    }
  } catch (error: any) {
    console.error("Error creating student document:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
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
      // Silently handle permission errors - the fallback logic will handle it when team member logs in
      if (error.code !== "permission-denied") {
        throw error;
      }
      console.log("Team member profile update will be handled on first login");
    }
  }

  return { verificationCode };
}

export async function registerJudge(
  email: string,
  password: string,
  judgeData: Omit<Judge, "id" | "email" | "createdAt" | "qualifications" | "affiliation" | "expertise" | "adminApproved">
): Promise<{ verificationCode: string }> {
  const { userCredential, verificationCode } = await registerUser(email, password, "judge");

  await createJudge(userCredential.user.uid, {
    ...judgeData,
    email,
  });

  return { verificationCode };
}
