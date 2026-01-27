"use client";

import { useState, useEffect } from "react";
import { getAllJudges, updateJudgeApproval } from "@/lib/firebase/database";
import type { Judge } from "@/lib/firebase/database";

export default function AdminJudgeList() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);

  useEffect(() => {
    loadJudges();
  }, []);

  const loadJudges = async () => {
    try {
      const judgeList = await getAllJudges();
      setJudges(judgeList);
    } catch (error) {
      console.error("Error loading judges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (judgeId: string, approved: boolean) => {
    try {
      await updateJudgeApproval(judgeId, approved);
      await loadJudges();
      setSelectedJudge(null);
    } catch (error) {
      console.error("Error updating judge approval:", error);
      alert("Failed to update judge approval");
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Judge Detail Modal */}
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
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Contact Information</h3>
                <p><strong>Name:</strong> {selectedJudge.firstName} {selectedJudge.lastName}</p>
                <p><strong>Email:</strong> {selectedJudge.email}</p>
                {selectedJudge.cellPhone && <p><strong>Phone:</strong> {selectedJudge.cellPhone}</p>}
                {selectedJudge.address && <p><strong>Address:</strong> {selectedJudge.address}</p>}
              </div>
              <div>
                <h3 className="font-semibold">Institution</h3>
                {selectedJudge.institution && <p><strong>Institution:</strong> {selectedJudge.institution}</p>}
                {selectedJudge.department && <p><strong>Department:</strong> {selectedJudge.department}</p>}
                {selectedJudge.currentPosition && <p><strong>Position:</strong> {selectedJudge.currentPosition}</p>}
                {selectedJudge.institutionYears && <p><strong>Years:</strong> {selectedJudge.institutionYears}</p>}
              </div>
              <div>
                <h3 className="font-semibold">Education</h3>
                {selectedJudge.highestDegree && <p><strong>Degree:</strong> {selectedJudge.highestDegree}</p>}
                {selectedJudge.degreeDate && <p><strong>Date:</strong> {selectedJudge.degreeDate}</p>}
                {selectedJudge.degreeDiscipline && <p><strong>Discipline:</strong> {selectedJudge.degreeDiscipline}</p>}
              </div>
              {selectedJudge.areaOfExpertise && (
                <div>
                  <h3 className="font-semibold">Area of Expertise</h3>
                  <p>{selectedJudge.areaOfExpertise}</p>
                </div>
              )}
              {selectedJudge.experienceJudgingScienceFairs && (
                <div>
                  <h3 className="font-semibold">Judging Experience</h3>
                  <p>{selectedJudge.experienceJudgingScienceFairs}</p>
                </div>
              )}
              {selectedJudge.interviewApproach && (
                <div>
                  <h3 className="font-semibold">Interview Approach</h3>
                  <p>{selectedJudge.interviewApproach}</p>
                </div>
              )}
              {selectedJudge.handleMistakesApproach && (
                <div>
                  <h3 className="font-semibold">Handling Mistakes</h3>
                  <p>{selectedJudge.handleMistakesApproach}</p>
                </div>
              )}
              {selectedJudge.knowsStudents && (
                <div>
                  <h3 className="font-semibold">Conflicts of Interest</h3>
                  <p><strong>Knows Students:</strong> {selectedJudge.knowsStudents ? "Yes" : "No"}</p>
                  {selectedJudge.knownStudents && <p><strong>Known Students:</strong> {selectedJudge.knownStudents}</p>}
                  <p><strong>Mentoring Students:</strong> {selectedJudge.mentoringStudents ? "Yes" : "No"}</p>
                  {selectedJudge.mentoringDetails && <p><strong>Details:</strong> {selectedJudge.mentoringDetails}</p>}
                </div>
              )}
              <div>
                <h3 className="font-semibold">Availability</h3>
                {selectedJudge.availabilityApril18 && (
                  <p><strong>April 18:</strong> {selectedJudge.availabilityApril18.replace(/_/g, " ").toUpperCase()}</p>
                )}
                <p><strong>March Availability:</strong> {selectedJudge.availabilityMarch ? "Yes" : "No"}</p>
              </div>
              {selectedJudge.references && (
                <div>
                  <h3 className="font-semibold">References</h3>
                  <p className="whitespace-pre-wrap">{selectedJudge.references}</p>
                </div>
              )}
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
