"use client";

import { useState, useEffect } from "react";
import { getAllSRAs, updateSRAApproval, getStudentsBySRA } from "@/lib/firebase/database";
import type { SRA, Student } from "@/lib/firebase/database";

export default function AdminSRAList() {
  const [sras, setSRAs] = useState<SRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [selectedSRA, setSelectedSRA] = useState<SRA | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    loadSRAs();
  }, []);

  const loadSRAs = async () => {
    try {
      const sraList = await getAllSRAs();
      setSRAs(sraList);
    } catch (error) {
      alert(`Error loading SRAs: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (sraId: string, approved: boolean) => {
    try {
      await updateSRAApproval(sraId, approved);
      await loadSRAs();
      setSelectedSRA(null);
    } catch (error) {
      alert("Failed to update SRA approval");
    }
  };

  const handleViewDetails = async (sra: SRA) => {
    setSelectedSRA(sra);
    setLoadingStudents(true);
    setStudents([]);
    
    if (sra.id) {
      try {
        const studentList = await getStudentsBySRA(sra.id);
        setStudents(studentList);
      } catch (error) {
        console.error("Error loading students:", error);
        alert(`Error loading students: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setLoadingStudents(false);
      }
    }
  };

  const filteredSRAs = sras.filter((sra) => {
    if (filter === "all") return true;
    if (filter === "approved") return sra.adminApproved === true;
    if (filter === "pending") {
      
      return sra.adminApproved !== true && sra.emailVerified === true;
    }
    return true;
  });

  if (loading) {
    return <div className="text-center py-12">Loading SRAs...</div>;
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
          All ({sras.length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-md ${
            filter === "approved"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Approved ({sras.filter((s) => s.adminApproved === true).length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-md ${
            filter === "pending"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pending ({sras.filter((s) => s.adminApproved !== true && s.emailVerified === true).length})
        </button>
      </div>

      {filteredSRAs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No SRAs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSRAs.map((sra) => (
            <div key={sra.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {sra.firstName} {sra.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{sra.email}</p>
                  <p className="text-sm text-gray-600">{sra.schoolName}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    sra.adminApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {sra.adminApproved ? "APPROVED" : "PENDING"}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {sra.phone && (
                  <p className="text-sm text-gray-600">
                    <strong>Phone:</strong> {sra.phone}
                  </p>
                )}
                {sra.title && (
                  <p className="text-sm text-gray-600">
                    <strong>Title:</strong> {sra.title}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(sra)}
                  className="flex-1 bg-primary-blue text-white py-2 px-4 rounded-md hover:bg-primary-darkBlue text-sm font-medium"
                >
                  View Details
                </button>
                {!sra.adminApproved && (
                  <button
                    onClick={() => handleApproval(sra.id!, true)}
                    className="flex-1 bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen text-sm font-medium"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {selectedSRA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 text-gray-900">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-primary-blue">
                SRA Application Details
              </h2>
              <button
                onClick={() => setSelectedSRA(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 text-gray-900">
              <div>
                <h3 className="font-semibold text-gray-900">Contact Information</h3>
                <p className="text-gray-900"><strong className="text-gray-900">Name:</strong> {selectedSRA.firstName} {selectedSRA.lastName}</p>
                <p className="text-gray-900"><strong className="text-gray-900">Email:</strong> {selectedSRA.email}</p>
                {selectedSRA.phone && <p className="text-gray-900"><strong className="text-gray-900">Phone:</strong> {selectedSRA.phone}</p>}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">School Information</h3>
                <p className="text-gray-900"><strong className="text-gray-900">School:</strong> {selectedSRA.schoolName}</p>
                {selectedSRA.title && <p className="text-gray-900"><strong className="text-gray-900">Title:</strong> {selectedSRA.title}</p>}
              </div>
              
              {}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Registered Students ({students.length})
                </h3>
                {loadingStudents ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <p className="text-gray-600">No students registered under this SRA.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              student.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : student.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {student.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Grade:</strong> {student.grade}
                          </p>
                          {student.projectTitle && (
                            <p>
                              <strong>Project:</strong> {student.projectTitle}
                            </p>
                          )}
                          {student.paymentStatus && (
                            <p>
                              <strong>Payment:</strong>{" "}
                              <span
                                className={
                                  student.paymentStatus === "received"
                                    ? "text-green-600"
                                    : "text-yellow-600"
                                }
                              >
                                {student.paymentStatus === "received"
                                  ? "Received"
                                  : "Not Received"}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              {!selectedSRA.adminApproved && (
                <button
                  onClick={() => handleApproval(selectedSRA.id!, true)}
                  className="bg-primary-green text-white px-6 py-2 rounded-md hover:bg-primary-darkGreen font-semibold"
                >
                  Approve SRA
                </button>
              )}
              <button
                onClick={() => setSelectedSRA(null)}
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
