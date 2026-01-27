import { registerUser } from "./auth";
import { createSRA, createStudent, createJudge, createSchool, getSRAsBySchool } from "./database";
import type { SRA, Student, Judge, School } from "./database";

export async function registerSRA(
  email: string,
  password: string,
  sraData: Omit<SRA, "id" | "email" | "createdAt" | "approved" | "adminApproved">
): Promise<{ verificationCode: string }> {
  // Create Firebase Auth account
  const { userCredential, verificationCode } = await registerUser(email, password, "sra");

  // Check if school exists, create if not
  let schoolId = sraData.schoolId;
  if (!schoolId) {
    // Create new school
    schoolId = await createSchool({
      name: sraData.schoolName,
    });
  }

  // Create SRA document
  await createSRA(userCredential.user.uid, {
    ...sraData,
    email,
    schoolId,
  });

  return { verificationCode };
}

export async function registerStudent(
  email: string,
  password: string,
  studentData: Omit<Student, "id" | "email" | "createdAt" | "status" | "sraName">
): Promise<{ verificationCode: string }> {
  // Verify SRA exists
  const sras = await getSRAsBySchool(studentData.schoolId);
  const selectedSRA = sras.find((sra) => sra.id === studentData.sraId);
  
  if (!selectedSRA) {
    throw new Error("Selected SRA not found");
  }

  // Create Firebase Auth account
  const { userCredential, verificationCode } = await registerUser(email, password, "student");

  // Create student document
  await createStudent(userCredential.user.uid, {
    ...studentData,
    email,
    sraName: `${selectedSRA.firstName} ${selectedSRA.lastName}`,
  });

  return { verificationCode };
}

export async function registerJudge(
  email: string,
  password: string,
  judgeData: Omit<Judge, "id" | "email" | "createdAt" | "qualifications" | "affiliation" | "expertise" | "adminApproved">
): Promise<{ verificationCode: string }> {
  // Create Firebase Auth account
  const { userCredential, verificationCode } = await registerUser(email, password, "judge");

  // Create judge document with all fields
  await createJudge(userCredential.user.uid, {
    ...judgeData,
    email,
  });

  return { verificationCode };
}
