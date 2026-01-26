"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadResearchPlan, uploadAbstract, uploadPresentation } from "@/lib/firebase/storage";
import { updateStudentProject, getStudent } from "@/lib/firebase/database";
import FileUpload from "@/components/upload/FileUpload";
import type { Student } from "@/lib/firebase/database";

export default function ProjectUpload() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStudent();
    }
  }, [user]);

  const loadStudent = async () => {
    if (!user) return;
    
    try {
      const studentData = await getStudent(user.uid);
      setStudent(studentData);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResearchPlanUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    
    const url = await uploadResearchPlan(user.uid, file);
    await updateStudentProject(user.uid, { researchPlanUrl: url });
    await loadStudent();
  };

  const handleAbstractUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    
    const url = await uploadAbstract(user.uid, file);
    await updateStudentProject(user.uid, { abstractUrl: url });
    await loadStudent();
  };

  const handlePresentationUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    
    const url = await uploadPresentation(user.uid, file);
    await updateStudentProject(user.uid, { presentationUrl: url });
    await loadStudent();
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!student || student.status !== "approved") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">
          You must be approved before you can upload files.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Project Files</h2>
      
      <FileUpload
        label="Research Plan"
        accept=".pdf,.doc,.docx"
        onUpload={handleResearchPlanUpload}
        currentFile={student.researchPlanUrl}
        maxSizeMB={10}
      />

      <FileUpload
        label="Abstract"
        accept=".pdf,.doc,.docx"
        onUpload={handleAbstractUpload}
        currentFile={student.abstractUrl}
        maxSizeMB={5}
      />

      <FileUpload
        label="Presentation Slides"
        accept=".pdf,.ppt,.pptx,.key"
        onUpload={handlePresentationUpload}
        currentFile={student.presentationUrl}
        maxSizeMB={20}
      />
    </div>
  );
}
