"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import { getJudge } from "@/lib/firebase/database";
import type { Judge } from "@/lib/firebase/database";
import JudgeScoringPanel from "@/components/judging/JudgeScoringPanel";

type PhaseTab = "category" | "final";

export default function JudgeDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [judgeData, setJudgeData] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);
  const [phaseTab, setPhaseTab] = useState<PhaseTab>("category");

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
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary-blue">
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
                className="shrink-0 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm min-h-[44px]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">Loading…</div>
            </div>
          ) : judgeData && !judgeData.adminApproved ? (
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Awaiting admin approval
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Your judge application is pending review. You will receive an email when you are
                approved.
              </p>
            </div>
          ) : user ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                View your assigned projects, open each student&apos;s research paper, enter rubric
                scores, private notes, and ranks. Tap a student to expand the scoring form.
              </p>
              <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setPhaseTab("category")}
                  className={`flex-1 py-3 px-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    phaseTab === "category"
                      ? "bg-amber-100 text-amber-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Category judging
                </button>
                <button
                  type="button"
                  onClick={() => setPhaseTab("final")}
                  className={`flex-1 py-3 px-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    phaseTab === "final"
                      ? "bg-indigo-100 text-indigo-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Final round
                </button>
              </div>
              <JudgeScoringPanel judgeId={user.uid} phase={phaseTab} />
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
