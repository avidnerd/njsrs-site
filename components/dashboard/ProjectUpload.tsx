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
  const [showWarning, setShowWarning] = useState(false);
  const [pendingResearchPlan, setPendingResearchPlan] = useState<string | null>(null);

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

  const hasSignatures = 
    student?.statementOfOutsideAssistance?.studentCompleted ||
    student?.statementOfOutsideAssistance?.teacherCompleted ||
    student?.statementOfOutsideAssistance?.mentorCompleted ||
    student?.statementOfOutsideAssistance?.parentCompleted;

  const handleResearchPlanUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    
    const url = await uploadResearchPlan(user.uid, file);
    
    
    if (hasSignatures && student?.researchPlanUrl && student.researchPlanUrl !== url) {
      setPendingResearchPlan(url);
      setShowWarning(true);
    } else {
      await updateStudentProject(user.uid, { researchPlanUrl: url }, hasSignatures);
      await loadStudent();
    }
  };

  const confirmResearchPlanChange = async () => {
    if (!user || !pendingResearchPlan) return;
    
    await updateStudentProject(user.uid, { researchPlanUrl: pendingResearchPlan }, true);
    await loadStudent();
    setShowWarning(false);
    setPendingResearchPlan(null);
  };

  const cancelResearchPlanChange = () => {
    setShowWarning(false);
    setPendingResearchPlan(null);
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

      {}
      {showWarning && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Warning: Changing Research Plan Will Reset All Signatures
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You have already submitted signatures for your Statement of Outside Assistance form. 
                        Changing your research plan will reset all signatures (student, teacher, mentor, and parent).
                      </p>
                      <p className="mt-2 font-semibold">
                        You will need to get all signatures again after making this change.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-end mt-4">
                <button
                  onClick={cancelResearchPlanChange}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResearchPlanChange}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Continue & Reset Signatures
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
