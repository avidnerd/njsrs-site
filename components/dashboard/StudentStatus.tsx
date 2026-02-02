"use client";

import { useState } from "react";
import type { Student } from "@/lib/firebase/database";
import { updateStudentProject } from "@/lib/firebase/database";
import { useAuth } from "@/contexts/AuthContext";

interface StudentStatusProps {
  student: Student;
  onUpdate?: () => void;
}

export default function StudentStatus({ student, onUpdate }: StudentStatusProps) {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingResearchPlan, setPendingResearchPlan] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const hasSignatures = 
    student.statementOfOutsideAssistance?.studentCompleted ||
    student.statementOfOutsideAssistance?.teacherCompleted ||
    student.statementOfOutsideAssistance?.mentorCompleted ||
    student.statementOfOutsideAssistance?.parentCompleted;

  const handleResearchPlanChange = async (newUrl: string) => {
    if (hasSignatures && student.researchPlanUrl !== newUrl) {
      setPendingResearchPlan(newUrl);
      setShowWarning(true);
    } else {
      await updateResearchPlan(newUrl);
    }
  };

  const updateResearchPlan = async (url: string) => {
    if (!user) return;
    
    try {
      
      await updateStudentProject(user.uid, { researchPlanUrl: url }, hasSignatures);

      if (onUpdate) {
        onUpdate();
      }
      setShowWarning(false);
      setPendingResearchPlan(null);
    } catch (error) {
      console.error("Error updating research plan:", error);
    }
  };

  const confirmResearchPlanChange = async () => {
    if (pendingResearchPlan) {
      await updateResearchPlan(pendingResearchPlan);
    }
  };

  const cancelResearchPlanChange = () => {
    setShowWarning(false);
    setPendingResearchPlan(null);
  };

  const checklistItems = [
    {
      label: "Research Report Uploaded",
      completed: !!student.researchReportUrl,
    },
    {
      label: "Abstract Uploaded",
      completed: !!student.abstractUrl,
    },
    {
      label: "Slideshow Uploaded",
      completed: !!student.slideshowUrl,
    },
    {
      label: "Student Signature (SOA)",
      completed: !!student.statementOfOutsideAssistance?.studentCompleted,
    },
    {
      label: "Teacher/Sponsor Signature (SOA)",
      completed: !!student.statementOfOutsideAssistance?.teacherCompleted,
    },
    {
      label: "Mentor Signature (SOA)",
      completed: !!student.statementOfOutsideAssistance?.mentorCompleted,
    }
  ];

  const allMaterialsComplete = checklistItems.slice(0, 3).every(item => item.completed);
  const allSignaturesComplete = checklistItems.slice(3, 7).every(item => item.completed);
  const photoReleaseComplete = checklistItems[7]?.completed || false;

  return (
    <div className="space-y-6">
      {}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                student.status
              )}`}
            >
              {student.status.toUpperCase()}
            </span>
          </div>
          {student.status === "pending" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                Your registration is pending approval from your Science Research Advisor. 
                You will receive an email once your registration has been reviewed.
              </p>
            </div>
          )}
          {student.status === "approved" && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                Your registration has been approved! You can now upload your materials and complete required forms.
              </p>
            </div>
          )}
          {student.status === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">
                Your registration has been rejected. Please contact your Science Research Advisor for more information.
              </p>
            </div>
          )}
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>School:</strong> {student.schoolName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>SRA:</strong> {student.sraName}
            </p>
          </div>
        </div>
      </div>

      {}
      {student.status === "approved" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Submission Checklist</h2>
          
          {}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Materials</h3>
            <div className="space-y-2">
              {checklistItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center">
                  {item.completed ? (
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={item.completed ? "text-gray-900" : "text-gray-500"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            {allMaterialsComplete && (
              <p className="text-sm text-green-600 mt-2">✓ All materials uploaded</p>
            )}
          </div>

          {}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Statement of Outside Assistance Signatures</h3>
            <div className="space-y-2">
              {checklistItems.slice(3).map((item, index) => (
                <div key={index} className="flex items-center">
                  {item.completed ? (
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={item.completed ? "text-gray-900" : "text-gray-500"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            {allSignaturesComplete && (
              <p className="text-sm text-green-600 mt-2">✓ All signatures received</p>
            )}
          </div>

          {}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Photo Release Form</h3>
            <div className="space-y-2">
              {checklistItems.slice(7).map((item, index) => (
                <div key={index} className="flex items-center">
                  {item.completed ? (
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={item.completed ? "text-gray-900" : "text-gray-500"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            {photoReleaseComplete && (
              <p className="text-sm text-green-600 mt-2">✓ Photo release form completed</p>
            )}
          </div>
        </div>
      )}

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
