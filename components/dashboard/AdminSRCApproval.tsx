"use client";

import { useState, useEffect } from "react";
import { getStudentsWithSRCRequests, updateSRCApproval, getStudent } from "@/lib/firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import type { Student } from "@/lib/firebase/database";

export default function AdminSRCApproval() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const studentList = await getStudentsWithSRCRequests();
      setStudents(studentList);
    } catch (error) {
      alert(`Error loading SRC requests: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (studentId: string, approved: boolean) => {
    if (!user) return;
    
    try {
      await updateSRCApproval(studentId, approved, user.uid, approvalNotes || undefined);
      await loadStudents();
      setSelectedStudent(null);
      setApprovalNotes("");
      alert(`SRC request ${approved ? "approved" : "rejected"} successfully`);
    } catch (error) {
      alert("Failed to update SRC approval");
    }
  };

  const filteredStudents = students.filter((student) => {
    if (filter === "all") return true;
    if (filter === "pending") return student.srcApprovalRequested && student.srcApproved === undefined;
    if (filter === "approved") return student.srcApproved === true;
    if (filter === "rejected") return student.srcApproved === false;
    return true;
  });

  if (loading) {
    return <div className="text-center py-12">Loading SRC requests...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-md ${
            filter === "all"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          All ({students.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-md ${
            filter === "pending"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pending ({students.filter((s) => s.srcApprovalRequested && s.srcApproved === undefined).length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-md ${
            filter === "approved"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Approved ({students.filter((s) => s.srcApproved === true).length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-md ${
            filter === "rejected"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Rejected ({students.filter((s) => s.srcApproved === false).length})
        </button>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No SRC approval requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{student.email}</p>
                  <p className="text-sm text-gray-600">{student.schoolName}</p>
                  {student.projectTitle && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Project:</strong> {student.projectTitle}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    student.srcApproved === true
                      ? "bg-green-100 text-green-800"
                      : student.srcApproved === false
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {student.srcApproved === true
                    ? "APPROVED"
                    : student.srcApproved === false
                    ? "REJECTED"
                    : "PENDING"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="flex-1 bg-primary-blue text-white py-2 px-4 rounded-md hover:bg-primary-darkBlue text-sm font-medium"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 text-gray-900">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-primary-blue">
                SRC Review - {selectedStudent.firstName} {selectedStudent.lastName}
              </h2>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setApprovalNotes("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Student Information</h3>
                <p className="text-gray-900"><strong>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-gray-900"><strong>Email:</strong> {selectedStudent.email}</p>
                <p className="text-gray-900"><strong>School:</strong> {selectedStudent.schoolName}</p>
                {selectedStudent.projectTitle && (
                  <p className="text-gray-900"><strong>Project Title:</strong> {selectedStudent.projectTitle}</p>
                )}
              </div>

              {selectedStudent.srcQuestions && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">SRC Questions</h3>
                  
                  {selectedStudent.srcQuestions.involvesHumanParticipants && (
                    <div className="mb-3 p-3 bg-blue-50 rounded">
                      <p className="font-semibold text-gray-900">Human Participants: Yes</p>
                      {selectedStudent.srcQuestions.humanParticipantsDetails && (
                        <p className="text-gray-900 text-sm mt-1">{selectedStudent.srcQuestions.humanParticipantsDetails}</p>
                      )}
                      {selectedStudent.srcQuestions.irbApprovalObtained && (
                        <p className="text-gray-900 text-sm mt-1"><strong>IRB Approval:</strong> Yes</p>
                      )}
                      {selectedStudent.srcQuestions.irbApprovalDetails && (
                        <p className="text-gray-900 text-sm mt-1">{selectedStudent.srcQuestions.irbApprovalDetails}</p>
                      )}
                      {selectedStudent.srcQuestions.informedConsentObtained && (
                        <p className="text-gray-900 text-sm mt-1"><strong>Informed Consent:</strong> Yes</p>
                      )}
                    </div>
                  )}

                  {selectedStudent.srcQuestions.involvesVertebrateAnimals && (
                    <div className="mb-3 p-3 bg-blue-50 rounded">
                      <p className="font-semibold text-gray-900">Vertebrate Animals: Yes</p>
                      {selectedStudent.srcQuestions.vertebrateAnimalsDetails && (
                        <p className="text-gray-900 text-sm mt-1">{selectedStudent.srcQuestions.vertebrateAnimalsDetails}</p>
                      )}
                      {selectedStudent.srcQuestions.animalCareProtocol && (
                        <p className="text-gray-900 text-sm mt-1"><strong>Care Protocol:</strong> {selectedStudent.srcQuestions.animalCareProtocol}</p>
                      )}
                      {selectedStudent.srcQuestions.veterinaryOversight && (
                        <p className="text-gray-900 text-sm mt-1"><strong>Veterinary Oversight:</strong> Yes</p>
                      )}
                    </div>
                  )}

                  {selectedStudent.srcQuestions.involvesPHBA && (
                    <div className="mb-3 p-3 bg-blue-50 rounded">
                      <p className="font-semibold text-gray-900">PHBA: Yes</p>
                      {selectedStudent.srcQuestions.phbaDetails && (
                        <p className="text-gray-900 text-sm mt-1">{selectedStudent.srcQuestions.phbaDetails}</p>
                      )}
                      {selectedStudent.srcQuestions.biosafetyLevel && (
                        <p className="text-gray-900 text-sm mt-1"><strong>Biosafety Level:</strong> {selectedStudent.srcQuestions.biosafetyLevel}</p>
                      )}
                      {selectedStudent.srcQuestions.phbaLocation && (
                        <p className="text-gray-900 text-sm mt-1"><strong>Location:</strong> {selectedStudent.srcQuestions.phbaLocation}</p>
                      )}
                    </div>
                  )}

                  {selectedStudent.srcQuestions.involvesHazardousMaterials && (
                    <div className="mb-3 p-3 bg-blue-50 rounded">
                      <p className="font-semibold text-gray-900">Hazardous Materials: Yes</p>
                      {selectedStudent.srcQuestions.hazardousMaterialsDetails && (
                        <p className="text-gray-900 text-sm mt-1">{selectedStudent.srcQuestions.hazardousMaterialsDetails}</p>
                      )}
                      {selectedStudent.srcQuestions.safetyProtocols && (
                        <p className="text-gray-900 text-sm mt-1"><strong>Safety Protocols:</strong> {selectedStudent.srcQuestions.safetyProtocols}</p>
                      )}
                    </div>
                  )}

                  {selectedStudent.srcQuestions.isContinuationProject && (
                    <div className="mb-3 p-3 bg-blue-50 rounded">
                      <p className="font-semibold text-gray-900">Continuation Project: Yes</p>
                      {selectedStudent.srcQuestions.continuationProjectDetails && (
                        <p className="text-gray-900 text-sm mt-1">{selectedStudent.srcQuestions.continuationProjectDetails}</p>
                      )}
                    </div>
                  )}

                  {!selectedStudent.srcQuestions.involvesHumanParticipants &&
                   !selectedStudent.srcQuestions.involvesVertebrateAnimals &&
                   !selectedStudent.srcQuestions.involvesPHBA &&
                   !selectedStudent.srcQuestions.involvesHazardousMaterials &&
                   !selectedStudent.srcQuestions.isContinuationProject && (
                    <p className="text-gray-600">No special SRC requirements indicated.</p>
                  )}
                </div>
              )}

              {selectedStudent.srcNotes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Previous Notes</h3>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedStudent.srcNotes}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Approval Notes (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes or comments about your decision..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div className="flex gap-4">
              {selectedStudent.srcApproved !== true && (
                <button
                  onClick={() => handleApproval(selectedStudent.id!, true)}
                  className="bg-primary-green text-white px-6 py-2 rounded-md hover:bg-primary-darkGreen font-semibold"
                >
                  Approve SRC Request
                </button>
              )}
              {selectedStudent.srcApproved !== false && (
                <button
                  onClick={() => handleApproval(selectedStudent.id!, false)}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-semibold"
                >
                  Reject SRC Request
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setApprovalNotes("");
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
