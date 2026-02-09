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

  await createStudent(userCredential.user.uid, {
    ...studentData,
    email,
    sraName: `${selectedSRA.firstName} ${selectedSRA.lastName}`,
    teamMemberUserId,
  });

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
