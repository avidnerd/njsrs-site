"use client";

import type { Student } from "@/lib/firebase/database";

interface StudentCardProps {
  student: Student;
  onApprove: (studentId: string) => void;
  onReject: (studentId: string) => void;
  onPaymentStatusChange?: (studentId: string, status: "not_received" | "received") => void;
}

export default function StudentCard({ student, onApprove, onReject, onPaymentStatusChange }: StudentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {student.firstName} {student.lastName}
            {student.isTeamProject && student.teamMemberFirstName && (
              <span className="text-base font-normal text-gray-600">
                {" "}& {student.teamMemberFirstName} {student.teamMemberLastName}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600">{student.email}</p>
          {student.isTeamProject && student.teamMemberEmail && (
            <p className="text-sm text-gray-600">{student.teamMemberEmail}</p>
          )}
          {student.isTeamProject && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
              Team Project
            </span>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            student.status
          )}`}
        >
          {student.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <span className="text-sm font-medium text-gray-700">Grade:</span>{" "}
          <span className="text-sm text-gray-600">{student.grade}</span>
        </div>
        {student.projectTitle && (
          <div>
            <span className="text-sm font-medium text-gray-700">Project:</span>{" "}
            <span className="text-sm text-gray-600">{student.projectTitle}</span>
          </div>
        )}
        {student.researchPlanUrl && (
          <div>
            <span className="text-sm font-medium text-gray-700">Research Plan:</span>{" "}
            <a
              href={student.researchPlanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-blue hover:underline"
            >
              View
            </a>
          </div>
        )}
        {student.abstractUrl && (
          <div>
            <span className="text-sm font-medium text-gray-700">Abstract:</span>{" "}
            <a
              href={student.abstractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-blue hover:underline"
            >
              View
            </a>
          </div>
        )}
        {student.slideshowUrl && (
          <div>
            <span className="text-sm font-medium text-gray-700">Slideshow:</span>{" "}
            <a
              href={student.slideshowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-blue hover:underline"
            >
              View
            </a>
          </div>
        )}
        {student.presentationUrl && (
          <div>
            <span className="text-sm font-medium text-gray-700">Presentation:</span>{" "}
            <a
              href={student.presentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-blue hover:underline"
            >
              View
            </a>
          </div>
        )}
        {student.researchReportUrl && (
          <div>
            <span className="text-sm font-medium text-gray-700">Research Report:</span>{" "}
            <a
              href={student.researchReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-blue hover:underline"
            >
              View
            </a>
          </div>
        )}
        {student.paymentStatus && (
          <div>
            <span className="text-sm font-medium text-gray-700">Payment:</span>{" "}
            <span
              className={`text-sm ${
                student.paymentStatus === "received"
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
            >
              {student.paymentStatus === "received" ? "Received" : "Not Received"}
            </span>
          </div>
        )}
      </div>

        {student.status === "pending" && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onApprove(student.id!)}
            className="flex-1 bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen text-sm font-medium"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(student.id!)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Reject
          </button>
        </div>
      )}
      {student.status === "approved" && onPaymentStatusChange && (
        <div className="mt-4 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Status
          </label>
          <select
            value={student.paymentStatus || "not_received"}
            onChange={(e) => onPaymentStatusChange(student.id!, e.target.value as "not_received" | "received")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-green focus:border-transparent"
          >
            <option value="not_received">Not Received</option>
            <option value="received">Received</option>
          </select>
        </div>
      )}
    </div>
  );
}
