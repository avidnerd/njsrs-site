"use client";

import { useState, useEffect } from "react";
import { getStudentsBySRA, updateStudentStatus, updateStudentPaymentStatus } from "@/lib/firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import StudentCard from "./StudentCard";
import type { Student } from "@/lib/firebase/database";

export default function SRAStudentList() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    if (!user) return;
    
    try {
      console.log("Loading students for SRA:", user.uid);
      const studentList = await getStudentsBySRA(user.uid);
      console.log("Found students:", studentList.length, studentList);
      setStudents(studentList);
    } catch (error) {
      console.error("Error loading students:", error);
      alert(`Error loading students: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string) => {
    try {
      await updateStudentStatus(studentId, "approved");
      await loadStudents();
    } catch (error) {
      console.error("Error approving student:", error);
      alert("Failed to approve student");
    }
  };

  const handleReject = async (studentId: string) => {
    if (!confirm("Are you sure you want to reject this student's registration?")) {
      return;
    }
    
    try {
      await updateStudentStatus(studentId, "rejected");
      await loadStudents();
    } catch (error) {
      console.error("Error rejecting student:", error);
      alert("Failed to reject student");
    }
  };

  const handlePaymentStatusChange = async (studentId: string, status: "not_received" | "received") => {
    try {
      await updateStudentPaymentStatus(studentId, status);
      await loadStudents();
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Failed to update payment status");
    }
  };

  const filteredStudents = students.filter((student) => {
    if (filter === "all") return true;
    return student.status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading students...</div>
      </div>
    );
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
          Pending ({students.filter((s) => s.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-md ${
            filter === "approved"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Approved ({students.filter((s) => s.status === "approved").length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-md ${
            filter === "rejected"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Rejected ({students.filter((s) => s.status === "rejected").length})
        </button>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">
            {filter === "all"
              ? "No students have registered yet."
              : `No ${filter} students.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onApprove={handleApprove}
              onReject={handleReject}
              onPaymentStatusChange={handlePaymentStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
