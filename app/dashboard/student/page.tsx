"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import { getStudent, getCategories } from "@/lib/firebase/database";
import StudentStatus from "@/components/dashboard/StudentStatus";
import StudentMaterials from "@/components/dashboard/StudentMaterials";
import PhotoRelease from "@/components/dashboard/PhotoRelease";
import GuestRegistration from "@/components/dashboard/GuestRegistration";
import type { Student } from "@/lib/firebase/database";

export default function StudentDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile?.role === "student") {
      loadStudent();
    }
  }, [user, userProfile]);

  const loadStudent = async () => {
    if (!user) return;
    try {
      const [studentData, categories] = await Promise.all([
        getStudent(user.uid),
        getCategories(),
      ]);
      if (!studentData) {
        console.error("Student data not found for user:", user.uid);
      }
      setStudent(studentData);
      if (studentData?.categoryId) {
        const match = categories.find((c) => c.id === studentData.categoryId);
        setCategoryName(match?.name ?? null);
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary-blue">
                  Student Dashboard
                </h1>
                {student && (
                  <div className="text-sm text-gray-600">
                    <p>
                      {student.firstName} {student.lastName}
                      {student.isTeamProject && student.teamMemberFirstName && (
                        <span> & {student.teamMemberFirstName} {student.teamMemberLastName}</span>
                      )}
                      {" "}- {student.schoolName}
                    </p>
                    {student.isTeamProject && (
                      <p className="text-xs text-gray-500 mt-1">
                        Team Project
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-3">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Deadline Reminder:</strong> The last day to submit research reports, abstracts, and the Statement of Outside Assistance is <strong>April 10, 2026</strong>. The last day to submit presentation slides and the photo release form is <strong>April 13, 2026</strong>. No submissions will be accepted after these dates.
            </p>
          </div>
          {categoryName && (
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
              <p className="text-sm text-indigo-800">
                <strong>Your Category:</strong> {categoryName}
                {student?.projectId && (
                  <span className="ml-3">
                    <strong>Project ID:</strong>{" "}
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-200 text-indigo-900">
                      {student.projectId}
                    </span>
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg">Loading...</div>
            </div>
          ) : student ? (
            <div className="space-y-6">
              <StudentStatus student={student} onUpdate={loadStudent} />
              <StudentMaterials onFormUpdate={loadStudent} />
              <PhotoRelease onFormUpdate={loadStudent} />
              <GuestRegistration />
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-gray-600">Student data not found.</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                If you just registered, try logging out and logging back in, or click Retry below.
              </p>
              <button
                type="button"
                onClick={() => { setLoading(true); loadStudent(); }}
                className="bg-primary-blue text-white px-4 py-2 rounded-md hover:opacity-90"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
