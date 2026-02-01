import { registerUser } from "./auth";
import { createSRA, createStudent, createJudge, createSchool, getSRAsBySchool } from "./database";
import type { SRA, Student, Judge, School } from "./database";

export async function registerSRA(
  email: string,
  password: string,
  sraData: Omit<SRA, "id" | "email" | "createdAt" | "approved" | "adminApproved">
): Promise<{ verificationCode: string }> {
  try {
    const { userCredential, verificationCode } = await registerUser(email, password, "sra");

    let schoolId = sraData.schoolId;
    if (!schoolId) {
      try {
        schoolId = await createSchool({
          name: sraData.schoolName,
        });
      } catch (schoolError: any) {
        console.error("Error creating school:", schoolError);
        throw new Error(`Failed to create school: ${schoolError.message || "Unknown error"}`);
      }
    }

    try {
      await createSRA(userCredential.user.uid, {
        ...sraData,
        email,
        schoolId,
      });
    } catch (sraError: any) {
      console.error("Error creating SRA:", sraError);
      throw new Error(`Failed to create SRA profile: ${sraError.message || "Unknown error"}`);
    }

    return { verificationCode };
  } catch (error: any) {
    console.error("SRA Registration Error:", error);
    throw error;
  }
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
  const { userCredential, verificationCode } = await registerUser(email, password, "judge");

  await createJudge(userCredential.user.uid, {
    ...judgeData,
    email,
  });

  return { verificationCode };
}
