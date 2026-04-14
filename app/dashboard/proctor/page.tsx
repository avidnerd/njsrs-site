"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import { getProctor, setLivePresenter, clearLivePresenter } from "@/lib/firebase/proctors";
import type { ProctorProfile } from "@/lib/firebase/proctors";
import { getAllStudents, getAllJudges, getCategories } from "@/lib/firebase/database";
import type { Student, Judge, Category } from "@/lib/firebase/database";
import { getAssignmentsByCategory, getScoresByCategory } from "@/lib/firebase/judging";
import type { JudgingAssignment, JudgeScoreDoc } from "@/lib/firebase/judging";

type ActiveTab = "presenter" | "scoring";

export default function ProctorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [proctor, setProctor] = useState<ProctorProfile | null>(null);
  const [categoryRoom, setCategoryRoom] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  // judgeId → Judge
  const [judgeMap, setJudgeMap] = useState<Map<string, Judge>>(new Map());
  // studentId → JudgingAssignment[]
  const [assignmentsByStudent, setAssignmentsByStudent] = useState<Map<string, JudgingAssignment[]>>(new Map());
  // `${judgeId}_${studentId}` → JudgeScoreDoc
  const [scoreSet, setScoreSet] = useState<Set<string>>(new Set());
  const [currentPresenterId, setCurrentPresenterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("presenter");
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [proctorData, allStudents, allJudges, allCategories] = await Promise.all([
        getProctor(user.uid),
        getAllStudents(),
        getAllJudges(),
        getCategories(),
      ]);

      setProctor(proctorData);

      const cat = allCategories.find((c) => c.id === proctorData?.categoryId);
      setCategoryRoom(cat?.room ?? "");

      const categoryStudents = proctorData?.categoryId
        ? allStudents.filter((s) => s.categoryId === proctorData.categoryId && s.status === "approved")
        : [];
      setStudents(categoryStudents);

      if (proctorData?.categoryId) {
        const [assignments, scores] = await Promise.all([
          getAssignmentsByCategory(proctorData.categoryId),
          getScoresByCategory(proctorData.categoryId),
        ]);

        // Build assignment map: studentId → assignments
        const aMap = new Map<string, JudgingAssignment[]>();
        for (const a of assignments) {
          if (!aMap.has(a.studentId)) aMap.set(a.studentId, []);
          aMap.get(a.studentId)!.push(a);
        }
        setAssignmentsByStudent(aMap);

        // Build scored set: judgeId_studentId
        const scored = new Set<string>(scores.map((sc) => `${sc.judgeId}_${sc.studentId}`));
        setScoreSet(scored);

        // Only keep judges referenced by assignments
        const relevantJudgeIds = new Set(assignments.map((a) => a.judgeId));
        const jMap = new Map<string, Judge>();
        for (const j of allJudges) {
          if (j.id && relevantJudgeIds.has(j.id)) jMap.set(j.id, j);
        }
        setJudgeMap(jMap);
      }
    } catch (e: any) {
      setMessage({ type: "err", text: e.message || "Failed to load" });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPresenter = async (student: Student) => {
    if (!proctor || !student.id) return;
    setSetting(true);
    setMessage(null);
    try {
      await setLivePresenter(
        proctor.categoryId,
        proctor.categoryName,
        categoryRoom,
        student.projectId ?? student.id,
        student.projectTitle ?? "Untitled",
        `${student.firstName} ${student.lastName}`
      );
      setCurrentPresenterId(student.id);
      setMessage({ type: "ok", text: `Now presenting: ${student.projectId ?? ""} — ${student.projectTitle}` });
    } catch (e: any) {
      setMessage({ type: "err", text: e.message || "Failed to update presenter" });
    } finally {
      setSetting(false);
    }
  };

  const handleClearPresenter = async () => {
    if (!proctor) return;
    setSetting(true);
    setMessage(null);
    try {
      await clearLivePresenter(proctor.categoryId);
      setCurrentPresenterId(null);
      setMessage({ type: "ok", text: "Presenter cleared." });
    } catch (e: any) {
      setMessage({ type: "err", text: e.message || "Failed to clear presenter" });
    } finally {
      setSetting(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  const sortedStudents = [...students].sort((a, b) => (a.projectId ?? "").localeCompare(b.projectId ?? ""));

  // Summary counts for the scoring tab header
  const totalAssignments = Array.from(assignmentsByStudent.values()).reduce((s, a) => s + a.length, 0);
  const totalScored = scoreSet.size;
  const allScored = totalAssignments > 0 && totalScored >= totalAssignments;

  return (
    <ProtectedRoute allowedRoles={["proctor"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary-blue">Proctor Dashboard</h1>
              {proctor && (
                <p className="text-sm text-gray-600">
                  {proctor.firstName} {proctor.lastName} · {proctor.categoryName}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {loading ? (
            <p className="text-center text-gray-500 py-12">Loading…</p>
          ) : (
            <>
              {message && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    message.type === "ok"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Category header */}
              <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-indigo-900">{proctor?.categoryName}</h2>
                  <p className="text-sm text-indigo-700 mt-0.5">
                    {categoryRoom && <span className="font-semibold">Room {categoryRoom} · </span>}
                    {students.length} approved student{students.length !== 1 ? "s" : ""} in this category
                  </p>
                </div>
                {currentPresenterId && activeTab === "presenter" && (
                  <button
                    onClick={handleClearPresenter}
                    disabled={setting}
                    className="px-4 py-2 rounded-lg bg-white border border-indigo-300 text-indigo-700 text-sm font-medium hover:bg-indigo-50 disabled:opacity-50 shrink-0"
                  >
                    Clear presenter
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-6">
                  <button
                    onClick={() => setActiveTab("presenter")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "presenter"
                        ? "border-primary-blue text-primary-blue"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Presenter control
                  </button>
                  <button
                    onClick={() => setActiveTab("scoring")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === "scoring"
                        ? "border-primary-blue text-primary-blue"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Scoring status
                    {totalAssignments > 0 && (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-bold ${
                          allScored ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {totalScored}/{totalAssignments}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* ── Presenter tab ── */}
              {activeTab === "presenter" && (
                students.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 bg-white rounded-xl border border-gray-200">
                    No approved students are assigned to your category yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sortedStudents.map((s) => {
                      const isPresenting = currentPresenterId === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                            isPresenting ? "border-indigo-400 ring-2 ring-indigo-300" : "border-gray-200"
                          }`}
                        >
                          <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b ${isPresenting ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}>
                            <div>
                              {isPresenting && (
                                <span className="inline-block mb-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white uppercase tracking-wide">
                                  Now presenting
                                </span>
                              )}
                              <h3 className="font-semibold text-gray-900">
                                {s.projectId && (
                                  <span className="text-indigo-700 font-bold mr-2">{s.projectId}</span>
                                )}
                                {s.firstName} {s.lastName}
                              </h3>
                              {s.projectTitle && (
                                <p className="text-sm text-gray-600 mt-0.5">{s.projectTitle}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleSetPresenter(s)}
                              disabled={setting || isPresenting}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold shrink-0 ${
                                isPresenting
                                  ? "bg-indigo-100 text-indigo-700 cursor-default"
                                  : "bg-primary-blue text-white hover:opacity-90 disabled:opacity-50"
                              }`}
                            >
                              {isPresenting ? "Currently presenting" : "Set as presenter"}
                            </button>
                          </div>

                          <div className="px-5 py-4 flex flex-wrap gap-3">
                            {s.researchReportUrl ? (
                              <a href={s.researchReportUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-blue text-white text-xs font-medium hover:opacity-90">
                                Research Report (PDF)
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No research report</span>
                            )}
                            {s.slideshowUrl && (
                              <a href={s.slideshowUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:opacity-90">
                                Slideshow
                              </a>
                            )}
                            {s.abstractUrl && (
                              <a href={s.abstractUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-600 text-white text-xs font-medium hover:opacity-90">
                                Abstract
                              </a>
                            )}
                            {s.presentationUrl && (
                              <a href={s.presentationUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-600 text-white text-xs font-medium hover:opacity-90">
                                Presentation
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* ── Scoring status tab ── */}
              {activeTab === "scoring" && (
                <div className="space-y-4">
                  {totalAssignments === 0 ? (
                    <p className="text-center text-gray-500 py-8 bg-white rounded-xl border border-gray-200">
                      No judges have been assigned to students in this category yet.
                    </p>
                  ) : (
                    <>
                      {/* Summary bar */}
                      <div className={`rounded-xl px-5 py-3 border text-sm font-medium ${
                        allScored
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}>
                        {allScored
                          ? `All ${totalAssignments} scores submitted — judging is complete for this category.`
                          : `${totalScored} of ${totalAssignments} scores submitted — ${totalAssignments - totalScored} outstanding.`}
                      </div>

                      {sortedStudents.map((s) => {
                        if (!s.id) return null;
                        const studentAssignments = assignmentsByStudent.get(s.id) ?? [];
                        if (studentAssignments.length === 0) return null;
                        const scoredCount = studentAssignments.filter((a) =>
                          scoreSet.has(`${a.judgeId}_${a.studentId}`)
                        ).length;
                        const studentDone = scoredCount === studentAssignments.length;

                        return (
                          <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className={`px-5 py-3 border-b flex items-center justify-between gap-3 ${studentDone ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  {s.projectId && (
                                    <span className="text-indigo-700 font-bold mr-2">{s.projectId}</span>
                                  )}
                                  {s.firstName} {s.lastName}
                                </h3>
                                {s.projectTitle && (
                                  <p className="text-xs text-gray-500 mt-0.5">{s.projectTitle}</p>
                                )}
                              </div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                                studentDone
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {scoredCount}/{studentAssignments.length} scored
                              </span>
                            </div>

                            <div className="px-5 py-3 flex flex-wrap gap-2">
                              {studentAssignments.map((a) => {
                                const judge = judgeMap.get(a.judgeId);
                                const hasScored = scoreSet.has(`${a.judgeId}_${a.studentId}`);
                                const name = judge
                                  ? `${judge.firstName} ${judge.lastName}`
                                  : `Judge ${a.judgeId.slice(0, 6)}`;
                                return (
                                  <span
                                    key={a.judgeId}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                      hasScored
                                        ? "bg-green-100 text-green-800 border border-green-200"
                                        : "bg-gray-100 text-gray-600 border border-gray-200"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasScored ? "bg-green-500" : "bg-gray-400"}`} />
                                    {name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
