"use client";

import { useState, useEffect } from "react";
import { getAllJudges, updateJudgeApproval, getCategories, updateJudgeCategories } from "@/lib/firebase/database";
import type { Judge, Category } from "@/lib/firebase/database";
import { getAllSpecialAwardAssignments, SPECIAL_AWARDS } from "@/lib/firebase/specialAwards";
import { getAllAssignments } from "@/lib/firebase/judging";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminJudgeList() {
  const { user } = useAuth();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // judgeId → award names
  const [specialAwardMap, setSpecialAwardMap] = useState<Record<string, string[]>>({});
  // judgeId → category names they are actually assigned to in the category round
  const [assignedCatMap, setAssignedCatMap] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    Promise.all([loadJudges(), loadCategories(), loadSpecialAwards(), loadCategoryAssignments()]);
  }, []);

  const loadCategoryAssignments = async () => {
    try {
      const assignments = await getAllAssignments("category");
      const map: Record<string, Set<string>> = {};
      for (const a of assignments) {
        if (!a.judgeId || !a.categoryId) continue;
        if (!map[a.judgeId]) map[a.judgeId] = new Set();
        map[a.judgeId].add(a.categoryId);
      }
      setAssignedCatMap(map);
    } catch (e) {
      console.error("Error loading category assignments:", e);
    }
  };

  const loadSpecialAwards = async () => {
    try {
      const assignments = await getAllSpecialAwardAssignments();
      const map: Record<string, string[]> = {};
      for (const a of assignments) {
        const award = SPECIAL_AWARDS.find((aw) => aw.id === a.awardId);
        if (!award) continue;
        if (!map[a.judgeId]) map[a.judgeId] = [];
        map[a.judgeId].push(award.name);
      }
      setSpecialAwardMap(map);
    } catch (e) {
      console.error("Error loading special award assignments:", e);
    }
  };

  const loadCategories = async () => {
    try {
      const list = await getCategories();
      setCategories(list);
    } catch (e) {
      console.error("Error loading categories:", e);
    }
  };

  const loadJudges = async () => {
    try {
      const judgeList = await getAllJudges();
      setJudges(judgeList);
    } catch (error: any) {
      alert(`Error loading judges: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (judgeId: string, approved: boolean) => {
    try {
      await updateJudgeApproval(judgeId, approved);
      setJudges((prev) => prev.map((j) => j.id === judgeId ? { ...j, adminApproved: approved } : j));
      setSelectedJudge((prev) => prev?.id === judgeId ? { ...prev, adminApproved: approved } : prev);
    } catch (error) {
      console.error("Error updating judge approval:", error);
      alert("Failed to update judge approval");
    }
  };

  const handleDelete = async (judge: Judge) => {
    if (!user || !judge.id) return;
    if (!confirm(`Permanently delete judge account for ${judge.firstName} ${judge.lastName}? This cannot be undone.`)) return;
    setDeletingId(judge.id);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/delete-judge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminIdToken: idToken, uid: judge.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete judge");
      setJudges((prev) => prev.filter((j) => j.id !== judge.id));
      if (selectedJudge?.id === judge.id) setSelectedJudge(null);
    } catch (e: any) {
      alert(e.message ?? "Failed to delete judge.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredJudges = judges.filter((judge) => {
    if (filter === "all") return true;
    if (filter === "approved") return judge.adminApproved === true;
    if (filter === "pending") return judge.adminApproved !== true;
    return true;
  });

  if (loading) {
    return <div className="text-center py-12">Loading judges...</div>;
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
          All ({judges.length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-md ${
            filter === "approved"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Approved ({judges.filter((j) => j.adminApproved === true).length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-md ${
            filter === "pending"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pending ({judges.filter((j) => j.adminApproved !== true).length})
        </button>
      </div>

      {filteredJudges.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No judges found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJudges.map((judge) => (
            <div key={judge.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {judge.firstName} {judge.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{judge.email}</p>
                  {judge.institution && (
                    <p className="text-sm text-gray-600">{judge.institution}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    judge.adminApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {judge.adminApproved ? "APPROVED" : "PENDING"}
                </span>
              </div>
              {/* ── Badges ── */}
              {(() => {
                const availabilityLabel: Record<string, { label: string; color: string }> = {
                  in_person_full_day: { label: "In Person — Full Day", color: "bg-green-100 text-green-800" },
                  in_person_morning_only: { label: "In Person — AM Only", color: "bg-teal-100 text-teal-800" },
                  remote_morning_only: { label: "Remote — AM Only", color: "bg-sky-100 text-sky-800" },
                };
                const avail = judge.availabilityApril18 ? availabilityLabel[judge.availabilityApril18] : null;
                const assignedCatIds = assignedCatMap[judge.id!] ?? new Set<string>();
                const catNames = [...assignedCatIds]
                  .map((id) => categories.find((c) => c.id === id)?.name)
                  .filter(Boolean) as string[];
                const awardNames = specialAwardMap[judge.id!] ?? [];
                const isFinal = judge.finalRoundJudge === true;
                const isJshs = judge.jshsJudge === true;
                return (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {avail && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${avail.color}`}>
                        {avail.label}
                      </span>
                    )}
                    {isFinal && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Final Round
                      </span>
                    )}
                    {isJshs && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        JSHS Judge
                      </span>
                    )}
                    {catNames.length > 0 ? catNames.map((name) => (
                      <span key={name} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                        {name}
                      </span>
                    )) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Not Assigned
                      </span>
                    )}
                    {awardNames.map((name) => (
                      <span key={name} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {name}
                      </span>
                    ))}
                  </div>
                );
              })()}
              <div className="space-y-2 mb-4">
                {judge.highestDegree && (
                  <p className="text-sm text-gray-600">
                    <strong>Degree:</strong> {judge.highestDegree} in {judge.degreeDiscipline}
                  </p>
                )}
                {judge.areaOfExpertise && (
                  <p className="text-sm text-gray-600">
                    <strong>Expertise:</strong> {judge.areaOfExpertise.substring(0, 100)}...
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedJudge(judge)}
                  className="flex-1 bg-primary-blue text-white py-2 px-4 rounded-md hover:bg-primary-darkBlue text-sm font-medium"
                >
                  View Details
                </button>
                {!judge.adminApproved && (
                  <button
                    onClick={() => handleApproval(judge.id!, true)}
                    className="flex-1 bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen text-sm font-medium"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleDelete(judge)}
                  disabled={deletingId === judge.id}
                  className="px-3 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium disabled:opacity-50"
                >
                  {deletingId === judge.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {selectedJudge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-primary-blue">
                Judge Application Details
              </h2>
              <button
                onClick={() => setSelectedJudge(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 text-gray-900">
              <div>
                <h3 className="font-semibold text-gray-900">Contact Information</h3>
                <p className="text-gray-900"><strong>Name:</strong> {selectedJudge.firstName} {selectedJudge.lastName}</p>
                <p className="text-gray-900"><strong>Email:</strong> {selectedJudge.email}</p>
                {selectedJudge.cellPhone && <p className="text-gray-900"><strong>Phone:</strong> {selectedJudge.cellPhone}</p>}
                {selectedJudge.address && <p className="text-gray-900"><strong>Address:</strong> {selectedJudge.address}</p>}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Institution</h3>
                {selectedJudge.institution && <p className="text-gray-900"><strong>Institution:</strong> {selectedJudge.institution}</p>}
                {selectedJudge.department && <p className="text-gray-900"><strong>Department:</strong> {selectedJudge.department}</p>}
                {selectedJudge.currentPosition && <p className="text-gray-900"><strong>Position:</strong> {selectedJudge.currentPosition}</p>}
                {selectedJudge.institutionYears && <p className="text-gray-900"><strong>Years:</strong> {selectedJudge.institutionYears}</p>}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Education</h3>
                {selectedJudge.highestDegree && <p className="text-gray-900"><strong>Degree:</strong> {selectedJudge.highestDegree}</p>}
                {selectedJudge.degreeDate && <p className="text-gray-900"><strong>Date:</strong> {selectedJudge.degreeDate}</p>}
                {selectedJudge.degreeDiscipline && <p className="text-gray-900"><strong>Discipline:</strong> {selectedJudge.degreeDiscipline}</p>}
              </div>
              {selectedJudge.areaOfExpertise && (
                <div>
                  <h3 className="font-semibold text-gray-900">Area of Expertise</h3>
                  <p className="text-gray-900">{selectedJudge.areaOfExpertise}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">Judging Experience</h3>
                <p className="text-gray-900"><strong>Has Experience Judging Science Fairs:</strong> {selectedJudge.experienceJudgingScienceFairs === "Yes" ? "Yes" : "No"}</p>
              </div>
              {selectedJudge.knowsStudents && (
                <div>
                  <h3 className="font-semibold text-gray-900">Conflicts of Interest</h3>
                  <p className="text-gray-900"><strong>Knows Students:</strong> {selectedJudge.knowsStudents ? "Yes" : "No"}</p>
                  {selectedJudge.knownStudents && <p className="text-gray-900"><strong>Known Students:</strong> {selectedJudge.knownStudents}</p>}
                  <p className="text-gray-900"><strong>Mentoring Students:</strong> {selectedJudge.mentoringStudents ? "Yes" : "No"}</p>
                  {selectedJudge.mentoringDetails && <p className="text-gray-900"><strong>Details:</strong> {selectedJudge.mentoringDetails}</p>}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">Availability</h3>
                {selectedJudge.availabilityApril18 && (
                  <p className="text-gray-900"><strong>April 18:</strong> {selectedJudge.availabilityApril18.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</p>
                )}
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Category assignment</h3>
                <p className="text-sm text-gray-600 mb-2">Assign this judge to one or more categories. They will judge projects in these categories.</p>
                <div className="flex flex-wrap gap-3">
                  {categories.map((c) => {
                    const isChecked = (selectedJudge.categoryIds || []).includes(c.id!);
                    return (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={async () => {
                            if (!selectedJudge.id) return;
                            const next = isChecked
                              ? (selectedJudge.categoryIds || []).filter((id) => id !== c.id)
                              : [...(selectedJudge.categoryIds || []), c.id!];
                            try {
                              await updateJudgeCategories(selectedJudge.id, next);
                              setSelectedJudge({ ...selectedJudge, categoryIds: next });
                              setJudges((prev) =>
                                prev.map((j) => (j.id === selectedJudge.id ? { ...j, categoryIds: next } : j))
                              );
                            } catch (err) {
                              console.error(err);
                              alert("Failed to update categories.");
                            }
                          }}
                          className="rounded border-gray-300 text-primary-blue"
                        />
                        <span className="text-sm text-gray-900">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500">Create categories under the Categories tab first.</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              {!selectedJudge.adminApproved && (
                <button
                  onClick={() => handleApproval(selectedJudge.id!, true)}
                  className="bg-primary-green text-white px-6 py-2 rounded-md hover:bg-primary-darkGreen font-semibold"
                >
                  Approve Judge
                </button>
              )}
              <button
                onClick={() => setSelectedJudge(null)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
