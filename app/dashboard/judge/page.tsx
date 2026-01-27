"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import { getJudge } from "@/lib/firebase/database";
import type { Judge } from "@/lib/firebase/database";

export default function JudgeDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [judgeData, setJudgeData] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile?.role === "judge") {
      loadJudgeData();
    }
  }, [user, userProfile]);

  const loadJudgeData = async () => {
    if (!user) return;
    
    try {
      const judge = await getJudge(user.uid);
      setJudgeData(judge);
    } catch (error) {
      console.error("Error loading judge data:", error);
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
    <ProtectedRoute allowedRoles={["judge"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary-blue">
                  Judge Dashboard
                </h1>
                {judgeData && (
                  <p className="text-sm text-gray-600">
                    {judgeData.firstName} {judgeData.lastName}
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
          ) : judgeData && !judgeData.adminApproved ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Awaiting Admin Approval
              </h2>
              <p className="text-gray-600 mb-6">
                Your judge application is pending review by the Fair Director. 
                You will receive an email notification once your application has been approved.
              </p>
              <p className="text-sm text-gray-500">
                Please check back later or contact support if you have any questions.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">
                Judge dashboard functionality will be available closer to the event date.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
