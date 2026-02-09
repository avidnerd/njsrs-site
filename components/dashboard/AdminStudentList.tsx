"use client";

import { useState, useEffect } from "react";
import { getAllStudents } from "@/lib/firebase/database";
import type { Student } from "@/lib/firebase/database";
import { Timestamp } from "firebase/firestore";


function formatDate(dateValue: Date | Timestamp | undefined | null): string {
  if (!dateValue) return "";
  
  if (dateValue instanceof Date) {
    return dateValue.toLocaleDateString();
  }
  
  
  if (typeof dateValue === "object" && "toDate" in dateValue && typeof dateValue.toDate === "function") {
    return dateValue.toDate().toLocaleDateString();
  }
  
  
  if (typeof dateValue === "object" && "seconds" in dateValue && typeof dateValue.seconds === "number") {
    return new Date(dateValue.seconds * 1000).toLocaleDateString();
  }
  
  return "";
}

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

  const exportToCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "School",
      "Grade",
      "Project Title",
      "Primary Scientific Domain 1",
      "Primary Scientific Domain 2",
      "Experimental Methodology Used",
      "Primary Real-World Focus",
      "Shirt Size",
      "Status",
    ];

    const rows = students.map((student) => {
      const domains = student.primaryScientificDomain || [];
      const methodologies = student.experimentalMethodology || [];
      const realWorldFocus = student.primaryRealWorldFocus || "";
      const otherFocus = student.primaryRealWorldFocusOther || "";
      const finalFocus = realWorldFocus === "Other" && otherFocus ? otherFocus : realWorldFocus;
      
      return [
        student.firstName || "",
        student.lastName || "",
        student.email || "",
        student.schoolName || "",
        student.grade || "",
        student.projectTitle || "",
        domains[0] || "",
        domains[1] || "",
        methodologies.join("; ") || "",
        finalFocus || "",
        student.shirtSize || "",
        student.status || "pending",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `njsrs_project_classifications_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-center py-4">Loading students...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by name, school, project title, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-md text-gray-900"
        />
        <button
          onClick={exportToCSV}
          className="ml-4 bg-primary-green text-white px-6 py-2 rounded-md hover:bg-primary-darkGreen font-semibold whitespace-nowrap"
        >
          Export Project Classifications
        </button>
      </div>

      {}
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
                        {student.photoRelease?.completed && (
                          <div className="text-green-600">✓ Photo Release</div>
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

      {}
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
              {}
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

              {}
              {selectedStudent.projectDescription && (
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Project Description</h4>
                  <p className="text-sm">{selectedStudent.projectDescription}</p>
                </div>
              )}

              {}
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

              {}
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
                        {selectedStudent.statementOfOutsideAssistance.studentSignatureDate && (
                          <span className="text-gray-500 ml-2">
                            ({formatDate(selectedStudent.statementOfOutsideAssistance.studentSignatureDate)})
                          </span>
                        )}
                      </div>
                    )}
                    {selectedStudent.statementOfOutsideAssistance.researchReportTitle && (
                      <div>
                        <strong>Research Report Title:</strong>{" "}
                        {selectedStudent.statementOfOutsideAssistance.researchReportTitle}
                      </div>
                    )}
                  </div>

                  {}
                  {(selectedStudent.statementOfOutsideAssistance.teacherCompleted ||
                    selectedStudent.statementOfOutsideAssistance.teacherSignature ||
                    selectedStudent.statementOfOutsideAssistance.teacherInviteSent) && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h5 className="font-semibold mb-2 text-blue-900">Science Research Advisor Response</h5>
                      <div className="space-y-2 text-sm">
                        {selectedStudent.statementOfOutsideAssistance.teacherInviteSent && (
                          <div>
                            <strong>Invitation Sent To:</strong>{" "}
                            {selectedStudent.statementOfOutsideAssistance.teacherEmail}
                          </div>
                        )}
                        {selectedStudent.statementOfOutsideAssistance.teacherCompleted ? (
                          <>
                            {selectedStudent.statementOfOutsideAssistance.teacherSignature && (
                              <div>
                                <strong>Signature:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.teacherSignature}
                                {selectedStudent.statementOfOutsideAssistance.teacherSignatureDate && (
                                  <span className="text-gray-500 ml-2">
                                    ({formatDate(selectedStudent.statementOfOutsideAssistance.teacherSignatureDate)})
                                  </span>
                                )}
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.teacherSchool && (
                              <div>
                                <strong>School:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.teacherSchool}
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.teacherMentorComments && (
                              <div>
                                <strong>Comments:</strong>
                                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                                  {selectedStudent.statementOfOutsideAssistance.teacherMentorComments}
                                </p>
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.teacherMentorSafetyStatement && (
                              <div>
                                <strong>Safety Statement:</strong>
                                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                                  {selectedStudent.statementOfOutsideAssistance.teacherMentorSafetyStatement}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500">Not yet completed</div>
                        )}
                      </div>
                    </div>
                  )}

                  {}
                  {(selectedStudent.statementOfOutsideAssistance.mentorCompleted ||
                    selectedStudent.statementOfOutsideAssistance.mentorSignature ||
                    selectedStudent.statementOfOutsideAssistance.mentorInviteSent) && (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                      <h5 className="font-semibold mb-2 text-purple-900">Mentor/Sponsor Response</h5>
                      <div className="space-y-2 text-sm">
                        {selectedStudent.statementOfOutsideAssistance.mentorInviteSent && (
                          <div>
                            <strong>Invitation Sent To:</strong>{" "}
                            {selectedStudent.statementOfOutsideAssistance.mentorEmail}
                          </div>
                        )}
                        {selectedStudent.statementOfOutsideAssistance.mentorCompleted ? (
                          <>
                            {selectedStudent.statementOfOutsideAssistance.mentorSignature && (
                              <div>
                                <strong>Signature:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.mentorSignature}
                                {selectedStudent.statementOfOutsideAssistance.mentorSignatureDate && (
                                  <span className="text-gray-500 ml-2">
                                    ({formatDate(selectedStudent.statementOfOutsideAssistance.mentorSignatureDate)})
                                  </span>
                                )}
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.mentorName && (
                              <div>
                                <strong>Name:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.mentorName}
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.mentorTitle && (
                              <div>
                                <strong>Title:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.mentorTitle}
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.mentorInstitutionSignature && (
                              <div>
                                <strong>Institution:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.mentorInstitutionSignature}
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.teacherMentorComments && (
                              <div>
                                <strong>Comments:</strong>
                                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                                  {selectedStudent.statementOfOutsideAssistance.teacherMentorComments}
                                </p>
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.teacherMentorSafetyStatement && (
                              <div>
                                <strong>Safety Statement:</strong>
                                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                                  {selectedStudent.statementOfOutsideAssistance.teacherMentorSafetyStatement}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500">Not yet completed</div>
                        )}
                      </div>
                    </div>
                  )}

                  {}
                  {(selectedStudent.statementOfOutsideAssistance.parentCompleted ||
                    selectedStudent.statementOfOutsideAssistance.parentSignature ||
                    selectedStudent.statementOfOutsideAssistance.parentInviteSent) && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <h5 className="font-semibold mb-2 text-green-900">Parent Response</h5>
                      <div className="space-y-2 text-sm">
                        {selectedStudent.statementOfOutsideAssistance.parentInviteSent && (
                          <div>
                            <strong>Invitation Sent To:</strong>{" "}
                            {selectedStudent.statementOfOutsideAssistance.parentEmail}
                          </div>
                        )}
                        {selectedStudent.statementOfOutsideAssistance.parentCompleted ? (
                          <>
                            {selectedStudent.statementOfOutsideAssistance.parentSignature && (
                              <div>
                                <strong>Signature:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.parentSignature}
                                {selectedStudent.statementOfOutsideAssistance.parentSignatureDate && (
                                  <span className="text-gray-500 ml-2">
                                    ({formatDate(selectedStudent.statementOfOutsideAssistance.parentSignatureDate)})
                                  </span>
                                )}
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.parentName && (
                              <div>
                                <strong>Name:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.parentName}
                              </div>
                            )}
                            {selectedStudent.statementOfOutsideAssistance.parentPhone && (
                              <div>
                                <strong>Phone:</strong>{" "}
                                {selectedStudent.statementOfOutsideAssistance.parentPhone}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500">Not yet completed</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {}
              {selectedStudent.photoRelease && (
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Photo Release Form</h4>
                  <div className="space-y-2 text-sm">
                    {selectedStudent.photoRelease.parentInviteSent && (
                      <div>
                        <strong>Invitation Sent To:</strong>{" "}
                        {selectedStudent.photoRelease.parentEmail}
                      </div>
                    )}
                    {selectedStudent.photoRelease.completed ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-green-800 font-semibold mb-2">✓ Completed</div>
                        {selectedStudent.photoRelease.parentSignature && (
                          <div>
                            <strong>Parent Signature:</strong>{" "}
                            {selectedStudent.photoRelease.parentSignature}
                            {selectedStudent.photoRelease.parentSignatureDate && (
                              <span className="text-gray-500 ml-2">
                                ({formatDate(selectedStudent.photoRelease.parentSignatureDate)})
                              </span>
                            )}
                          </div>
                        )}
                        {selectedStudent.photoRelease.parentName && (
                          <div>
                            <strong>Parent Name:</strong>{" "}
                            {selectedStudent.photoRelease.parentName}
                          </div>
                        )}
                        {selectedStudent.photoRelease.parentPhone && (
                          <div>
                            <strong>Phone:</strong>{" "}
                            {selectedStudent.photoRelease.parentPhone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">Not yet completed</div>
                    )}
                  </div>
                </div>
              )}

              {(selectedStudent.primaryScientificDomain ||
                selectedStudent.experimentalMethodology ||
                selectedStudent.primaryRealWorldFocus) && (
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Project Classification</h4>
                  <div className="space-y-3 text-sm">
                    {selectedStudent.primaryScientificDomain && selectedStudent.primaryScientificDomain.length > 0 && (
                      <div>
                        <strong>Primary Scientific Domain:</strong>
                        <ul className="list-disc list-inside mt-1 ml-2">
                          {selectedStudent.primaryScientificDomain.map((domain, idx) => (
                            <li key={idx} className="text-gray-700">{domain}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedStudent.experimentalMethodology && selectedStudent.experimentalMethodology.length > 0 && (
                      <div>
                        <strong>Experimental Methodology Used:</strong>
                        <ul className="list-disc list-inside mt-1 ml-2">
                          {selectedStudent.experimentalMethodology.map((method, idx) => (
                            <li key={idx} className="text-gray-700">{method}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(() => {
                      const realWorldFocus = selectedStudent.primaryRealWorldFocus || "";
                      const otherFocus = selectedStudent.primaryRealWorldFocusOther || "";
                      const finalFocus = realWorldFocus === "Other" && otherFocus ? otherFocus : realWorldFocus;
                      return finalFocus && (
                        <div>
                          <strong>Primary Real-World Focus:</strong>{" "}
                          <span className="text-gray-700">{finalFocus}</span>
                        </div>
                      );
                    })()}
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
