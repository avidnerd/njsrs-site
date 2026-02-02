import { ref, uploadBytes, getDownloadURL, UploadResult } from "firebase/storage";
import { storage, auth } from "./config";

function ensureStorage() {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized. Make sure environment variables are set.");
  }
  return storage;
}

function ensureAuthenticated(userId: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Make sure environment variables are set.");
  }
  
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not authenticated. Please log in and try again.");
  }
  
  
  if (currentUser.uid !== userId) {
    throw new Error("User ID mismatch. You can only upload files to your own folder.");
  }
  
  return currentUser;
}

export async function uploadFile(
  userId: string,
  file: File,
  path: string
): Promise<string> {
  
  ensureAuthenticated(userId);
  
  const storageInstance = ensureStorage();
  const storageRef = ref(storageInstance, `students/${userId}/${path}`);
  
  try {
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    
    if (error.code === 'storage/unauthorized') {
      throw new Error("You don't have permission to upload files. Please check that you're logged in and your account is approved.");
    } else if (error.code === 'storage/canceled') {
      throw new Error("Upload was canceled.");
    } else if (error.code === 'storage/unknown') {
      throw new Error("An unknown error occurred during upload. Please check your internet connection and try again.");
    } else if (error.message?.includes('CORS') || error.message?.includes('preflight')) {
      throw new Error("Upload failed due to authentication or permissions issue. Please try logging out and logging back in, or contact support if the problem persists.");
    }
    throw error;
  }
}

export async function uploadResearchPlan(
  userId: string,
  file: File
): Promise<string> {
  if (!file.type.includes("pdf") && !file.type.includes("doc") && !file.type.includes("docx")) {
    throw new Error("Research plan must be a PDF or Word document");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File size must be less than 10MB");
  }

  return uploadFile(userId, file, "research-plan.pdf");
}

export async function uploadAbstract(
  userId: string,
  file: File
): Promise<string> {
  if (!file.type.includes("pdf") && !file.type.includes("doc") && !file.type.includes("docx")) {
    throw new Error("Abstract must be a PDF or Word document");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }

  return uploadFile(userId, file, "abstract.pdf");
}

export async function uploadPresentation(
  userId: string,
  file: File
): Promise<string> {
  const validTypes = ["pdf", "ppt", "pptx", "key"];
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  
  if (!fileExtension || !validTypes.includes(fileExtension)) {
    throw new Error("Presentation must be a PDF, PowerPoint, or Keynote file");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error("File size must be less than 20MB");
  }

  return uploadFile(userId, file, `presentation.${fileExtension}`);
}

export async function uploadResearchReport(
  userId: string,
  file: File
): Promise<string> {
  if (!file.type.includes("pdf")) {
    throw new Error("Research report must be a PDF file");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File size must be less than 15MB");
  }

  return uploadFile(userId, file, "research-report.pdf");
}

export async function uploadSlideshow(
  userId: string,
  file: File
): Promise<string> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  
  if (fileExtension !== "pptx") {
    throw new Error("Slideshow must be in .pptx format only");
  }

  if (file.size > 25 * 1024 * 1024) {
    throw new Error("File size must be less than 25MB");
  }

  return uploadFile(userId, file, "slideshow.pptx");
}
