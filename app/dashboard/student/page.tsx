"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import { getStudent } from "@/lib/firebase/database";
import StudentStatus from "@/components/dashboard/StudentStatus";
import StudentMaterials from "@/components/dashboard/StudentMaterials";
import type { Student } from "@/lib/firebase/database";

export default function StudentDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile?.role === "student") {
      loadStudent();
    }
  }, [user, userProfile]);

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
                  <p className="text-sm text-gray-600">
                    {student.firstName} {student.lastName} - {student.schoolName}
                  </p>
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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg">Loading...</div>
            </div>
          ) : student ? (
            <div className="space-y-6">
              <StudentStatus student={student} onUpdate={loadStudent} />
              <StudentMaterials />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Student data not found.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
