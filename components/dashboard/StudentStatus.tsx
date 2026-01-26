"use client";

import type { Student } from "@/lib/firebase/database";

interface StudentStatusProps {
  student: Student;
}

export default function StudentStatus({ student }: StudentStatusProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
              Your registration has been approved! You can now upload your research plan and abstract.
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
  );
}
