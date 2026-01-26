import { ref, uploadBytes, getDownloadURL, UploadResult } from "firebase/storage";
import { storage } from "./config";

function ensureStorage() {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized. Make sure environment variables are set.");
  }
  return storage;
}

export async function uploadFile(
  userId: string,
  file: File,
  path: string
): Promise<string> {
  const storageInstance = ensureStorage();
  const storageRef = ref(storageInstance, `students/${userId}/${path}`);
  const snapshot: UploadResult = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

export async function uploadResearchPlan(
  userId: string,
  file: File
): Promise<string> {
  // Validate file type
  if (!file.type.includes("pdf") && !file.type.includes("doc") && !file.type.includes("docx")) {
    throw new Error("Research plan must be a PDF or Word document");
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File size must be less than 10MB");
  }

  return uploadFile(userId, file, "research-plan.pdf");
}

export async function uploadAbstract(
  userId: string,
  file: File
): Promise<string> {
  // Validate file type
  if (!file.type.includes("pdf") && !file.type.includes("doc") && !file.type.includes("docx")) {
    throw new Error("Abstract must be a PDF or Word document");
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }

  return uploadFile(userId, file, "abstract.pdf");
}

export async function uploadPresentation(
  userId: string,
  file: File
): Promise<string> {
  // Validate file type
  const validTypes = ["pdf", "ppt", "pptx", "key"];
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  
  if (!fileExtension || !validTypes.includes(fileExtension)) {
    throw new Error("Presentation must be a PDF, PowerPoint, or Keynote file");
  }

  // Validate file size (20MB max)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("File size must be less than 20MB");
  }

  return uploadFile(userId, file, `presentation.${fileExtension}`);
}
