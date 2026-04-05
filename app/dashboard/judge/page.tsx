"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import { getJudge } from "@/lib/firebase/database";
import type { Judge } from "@/lib/firebase/database";
import { getAssignmentsForJudge } from "@/lib/firebase/judging";
import { getSpecialAwardAssignmentsForJudge, SPECIAL_AWARDS } from "@/lib/firebase/specialAwards";
import JudgeScoringPanel from "@/components/judging/JudgeScoringPanel";
import SpecialAwardScoringPanel from "@/components/judging/SpecialAwardScoringPanel";

type PhaseTab = "category" | "final" | "special";

export default function JudgeDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [judgeData, setJudgeData] = useState<Judge | null>(null);
  const [isCategoryJudge, setIsCategoryJudge] = useState(false);
  const [specialAwardNames, setSpecialAwardNames] = useState<string[]>([]);
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
      const [judge, categoryAssignments, specialAssignments] = await Promise.all([
        getJudge(user.uid),
        getAssignmentsForJudge(user.uid, "category"),
        getSpecialAwardAssignmentsForJudge(user.uid),
      ]);
      setJudgeData(judge);
      setIsCategoryJudge(categoryAssignments.length > 0);
      setSpecialAwardNames(
        specialAssignments
          .map((a) => SPECIAL_AWARDS.find((aw) => aw.id === a.awardId)?.name)
          .filter(Boolean) as string[]
      );
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
              {/* Reporting time + role summary */}
              {(() => {
                const isFinal = judgeData?.finalRoundJudge === true;
                const isSpecial = specialAwardNames.length > 0;
                const roles: string[] = [];
                if (isCategoryJudge) roles.push("Category Judge");
                if (isFinal) roles.push("Final Round Judge");
                if (isSpecial) roles.push("Special Award Judge");
                if (roles.length === 0) return null;

                // Build a plain-English schedule line
                let scheduleLine: React.ReactNode;
                if (isCategoryJudge && (isFinal || isSpecial)) {
                  const afternoon = [
                    isFinal && "final round",
                    isSpecial && "special award",
                  ].filter(Boolean).join(" and ");
                  scheduleLine = (
                    <>
                      <strong>Report at 8:00 AM</strong> for category judging, and <strong>remain available at 12:00 PM</strong> for {afternoon} judging.
                    </>
                  );
                } else {
                  const reportTime = isCategoryJudge ? "8:00 AM" : "12:00 PM";
                  scheduleLine = <><strong>Please report at {reportTime}</strong> on April 18, 2026 at Millburn High School.</>;
                }

                return (
                  <div className="rounded-xl bg-blue-50 border border-blue-300 px-5 py-4 space-y-1">
                    <p className="text-sm font-bold text-blue-900">
                      Your role{roles.length > 1 ? "s" : ""}: {roles.join(" · ")}
                    </p>
                    <p className="text-sm text-blue-800">{scheduleLine}</p>
                    {isCategoryJudge && (isFinal || isSpecial) && (
                      <p className="text-xs text-blue-700 mt-0.5">
                        All judging takes place on April 18, 2026 at Millburn High School.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Don't score early notice — not shown to final-only judges */}
              {(isCategoryJudge || specialAwardNames.length > 0) && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 px-5 py-4">
                  <p className="text-sm font-bold text-amber-900 mb-1">
                    Please do not enter scores before the day of the fair
                  </p>
                  <p className="text-sm text-amber-800">
                    You are welcome to review the research reports in advance to get an initial sense of the projects, but please hold off on submitting any scores until April 18, 2026.
                  </p>
                </div>
              )}

              {/* Final round judge notice */}
              {judgeData?.finalRoundJudge && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-300 px-5 py-4">
                  <p className="text-sm font-bold text-indigo-900 mb-1">
                    You have been selected as a Final Round Judge
                  </p>
                  <p className="text-sm text-indigo-700">
                    After category judging is complete, the first-place winner from each category will advance to the final round. You will judge these finalists and select the overall top projects. Your projects will be assigned on the morning of the fair — report at 12:00 PM.
                  </p>
                </div>
              )}

              {/* Special award judge notice */}
              {specialAwardNames.length > 0 && (
                <div className="rounded-xl bg-purple-50 border border-purple-300 px-5 py-4">
                  <p className="text-sm font-bold text-purple-900 mb-1">
                    You have been selected as a Special Award Judge
                  </p>
                  <p className="text-sm text-purple-800 mb-2">
                    You will judge the following award{specialAwardNames.length > 1 ? "s" : ""} using a custom rubric. Report at 12:00 PM on April 18, 2026.
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {specialAwardNames.map((name) => (
                      <li key={name} className="text-sm text-purple-900 font-medium">{name}</li>
                    ))}
                  </ul>
                </div>
              )}

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
                <button
                  type="button"
                  onClick={() => setPhaseTab("special")}
                  className={`flex-1 py-3 px-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    phaseTab === "special"
                      ? "bg-purple-100 text-purple-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Special awards
                </button>
              </div>
              {phaseTab === "special" ? (
                <SpecialAwardScoringPanel judgeId={user.uid} />
              ) : (
                <JudgeScoringPanel judgeId={user.uid} phase={phaseTab as "category" | "final"} />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
