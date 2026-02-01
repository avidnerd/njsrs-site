"use client";

import { useState, useEffect } from "react";
import { getAllStudents } from "@/lib/firebase/database";
import type { Student } from "@/lib/firebase/database";

export default function AdminStudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const allStudents = await getAllStudents();
      setStudents(allStudents);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.schoolName?.toLowerCase().includes(searchLower) ||
      student.projectTitle?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="text-center py-4">Loading students...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, school, project title, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
        />
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Materials
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.schoolName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {student.projectTitle || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : student.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {student.status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {student.researchReportUrl && (
                          <div className="text-green-600">✓ Research Report</div>
                        )}
                        {student.abstractUrl && (
                          <div className="text-green-600">✓ Abstract</div>
                        )}
                        {student.slideshowUrl && (
                          <div className="text-green-600">✓ Slideshow</div>
                        )}
                        {student.statementOfOutsideAssistance?.studentCompleted && (
                          <div className="text-green-600">✓ SOA Form</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-primary-blue hover:text-primary-darkBlue"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Student Details: {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-gray-900">
              {/* Basic Info */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedStudent.email}
                  </div>
                  <div>
                    <strong>School:</strong> {selectedStudent.schoolName || "N/A"}
                  </div>
                  <div>
                    <strong>Grade:</strong> {selectedStudent.grade || "N/A"}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedStudent.status || "pending"}
                  </div>
                  <div>
                    <strong>Project Title:</strong> {selectedStudent.projectTitle || "N/A"}
                  </div>
                </div>
              </div>

              {/* Project Description */}
              {selectedStudent.projectDescription && (
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Project Description</h4>
                  <p className="text-sm">{selectedStudent.projectDescription}</p>
                </div>
              )}

              {/* Materials */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">Submitted Materials</h4>
                <div className="space-y-2 text-sm">
                  {selectedStudent.researchReportUrl ? (
                    <div>
                      <strong>Research Report:</strong>{" "}
                      <a
                        href={selectedStudent.researchReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-blue hover:underline"
                      >
                        View PDF
                      </a>
                    </div>
                  ) : (
                    <div className="text-gray-500">Research Report: Not uploaded</div>
                  )}
                  {selectedStudent.abstractUrl ? (
                    <div>
                      <strong>Abstract:</strong>{" "}
                      <a
                        href={selectedStudent.abstractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-blue hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                  ) : (
                    <div className="text-gray-500">Abstract: Not uploaded</div>
                  )}
                  {selectedStudent.slideshowUrl ? (
                    <div>
                      <strong>Slideshow:</strong>{" "}
                      <a
                        href={selectedStudent.slideshowUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-blue hover:underline"
                      >
                        Download (.pptx)
                      </a>
                    </div>
                  ) : (
                    <div className="text-gray-500">Slideshow: Not uploaded</div>
                  )}
                </div>
              </div>

              {/* Statement of Outside Assistance */}
              {selectedStudent.statementOfOutsideAssistance && (
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Statement of Outside Assistance</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Student Completed:</strong>{" "}
                      {selectedStudent.statementOfOutsideAssistance.studentCompleted ? "Yes" : "No"}
                    </div>
                    {selectedStudent.statementOfOutsideAssistance.studentSignature && (
                      <div>
                        <strong>Student Signature:</strong>{" "}
                        {selectedStudent.statementOfOutsideAssistance.studentSignature}
                      </div>
                    )}
                    {selectedStudent.statementOfOutsideAssistance.teacherInviteSent && (
                      <div>
                        <strong>Teacher Invitation:</strong> Sent to{" "}
                        {selectedStudent.statementOfOutsideAssistance.teacherEmail}
                      </div>
                    )}
                    {selectedStudent.statementOfOutsideAssistance.mentorInviteSent && (
                      <div>
                        <strong>Mentor Invitation:</strong> Sent to{" "}
                        {selectedStudent.statementOfOutsideAssistance.mentorEmail}
                      </div>
                    )}
                    {selectedStudent.statementOfOutsideAssistance.parentInviteSent && (
                      <div>
                        <strong>Parent Invitation:</strong> Sent to{" "}
                        {selectedStudent.statementOfOutsideAssistance.parentEmail}
                      </div>
                    )}
                    {selectedStudent.statementOfOutsideAssistance.researchReportTitle && (
                      <div>
                        <strong>Research Report Title:</strong>{" "}
                        {selectedStudent.statementOfOutsideAssistance.researchReportTitle}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
