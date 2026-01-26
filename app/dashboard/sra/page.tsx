"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import SRAStudentList from "@/components/dashboard/SRAStudentList";
import { getSRA } from "@/lib/firebase/database";
import { useState } from "react";
import type { SRA } from "@/lib/firebase/database";

export default function SRADashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [sraData, setSraData] = useState<SRA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile?.role === "sra") {
      loadSRAData();
    }
  }, [user, userProfile]);

  const loadSRAData = async () => {
    if (!user) return;
    
    try {
      const sra = await getSRA(user.uid);
      setSraData(sra);
    } catch (error) {
      console.error("Error loading SRA data:", error);
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
    <ProtectedRoute allowedRoles={["sra"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary-blue">
                  SRA Dashboard
                </h1>
                {sraData && (
                  <p className="text-sm text-gray-600">
                    {sraData.schoolName} - {sraData.firstName} {sraData.lastName}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg">Loading...</div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Your Students
                </h2>
                <p className="text-gray-600">
                  Review and approve student registrations from your school.
                </p>
              </div>
              <SRAStudentList />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
