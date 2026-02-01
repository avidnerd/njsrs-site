"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { StatementOfOutsideAssistance } from "@/lib/firebase/database";

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
}

export default function StatementSignPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [formData, setFormData] = useState<StatementOfOutsideAssistance | null>(null);
  const [signerType, setSignerType] = useState<"teacher" | "mentor" | "parent" | null>(null);
  const [signature, setSignature] = useState("");
  const [comments, setComments] = useState("");
  const [safetyStatement, setSafetyStatement] = useState("");

  useEffect(() => {
    if (token) {
      loadFormData();
    }
  }, [token]);

  const loadFormData = async () => {
    try {
      const response = await fetch(`/api/statement-form?token=${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load form");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStudent(data.student);
      setFormData(data.formData);
      setSignerType(data.signerType);
      
      // Pre-fill signature fields if already completed
      if (data.signerType === "teacher" && data.formData.teacherSignature) {
        setSignature(data.formData.teacherSignature);
      } else if (data.signerType === "mentor" && data.formData.mentorSignature) {
        setSignature(data.formData.mentorSignature);
      } else if (data.signerType === "parent" && data.formData.parentSignature) {
        setSignature(data.formData.parentSignature);
      }

      if (data.formData.teacherMentorComments) {
        setComments(data.formData.teacherMentorComments);
      }
      if (data.formData.teacherMentorSafetyStatement) {
        setSafetyStatement(data.formData.teacherMentorSafetyStatement);
      }
    } catch (error: any) {
      setError(error.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!signature.trim()) {
      setError("Please provide your signature");
      setSaving(false);
      return;
    }

    if (!student || !formData) {
      setError("Form data not loaded");
      setSaving(false);
      return;
    }

    try {
      const updatedFormData = { ...formData };

      if (signerType === "teacher") {
        updatedFormData.teacherSignature = signature;
        updatedFormData.teacherSignatureDate = Timestamp.now();
        updatedFormData.teacherSchool = updatedFormData.teacherSchool || "";
        updatedFormData.teacherMentorComments = comments;
        updatedFormData.teacherMentorSafetyStatement = safetyStatement;
        updatedFormData.teacherCompleted = true;
      } else if (signerType === "mentor") {
        updatedFormData.mentorSignature = signature;
        updatedFormData.mentorSignatureDate = Timestamp.now();
        updatedFormData.mentorName = `${formData.mentorFirstName || ""} ${formData.mentorLastName || ""}`.trim();
        updatedFormData.mentorTitle = updatedFormData.mentorTitle || "";
        updatedFormData.mentorInstitutionSignature = updatedFormData.mentorInstitution || "";
        updatedFormData.teacherMentorComments = comments;
        updatedFormData.teacherMentorSafetyStatement = safetyStatement;
        updatedFormData.mentorCompleted = true;
      } else if (signerType === "parent") {
        updatedFormData.parentSignature = signature;
        updatedFormData.parentSignatureDate = Timestamp.now();
        updatedFormData.parentName = updatedFormData.parentName || "";
        updatedFormData.parentPhone = updatedFormData.parentPhone || "";
        updatedFormData.teacherMentorComments = comments; // Parent uses this field for their role description
        updatedFormData.parentCompleted = true;
      }

      // Check if all required signatures are complete
      const allComplete = 
        updatedFormData.studentCompleted &&
        (updatedFormData.teacherCompleted || updatedFormData.mentorCompleted || updatedFormData.parentCompleted);

      if (allComplete) {
        updatedFormData.formCompleted = true;
      }

      // Use API route to update the form (no authentication required)
      const response = await fetch("/api/statement-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          formData: updatedFormData,
          signerType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }

      setSuccess("Form submitted successfully! Thank you for completing your section.");
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error: any) {
      setError(error.message || "Failed to submit form");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading form...</div>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  const signerLabel = signerType === "teacher" ? "Teacher" : signerType === "mentor" ? "Mentor" : "Parent";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-primary-blue mb-2">
            Statement of Outside Assistance
          </h1>
          <p className="text-gray-600 mb-6">
            Student: {student?.firstName} {student?.lastName}
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Teacher/Mentor Comments Section */}
            {(signerType === "teacher" || signerType === "mentor") && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Comments on Student&apos;s Individual Contributions
                </h3>
                <p className="text-sm text-gray-600">
                  Please be specific about what the student did versus what others did.
                </p>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={6}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                  placeholder="Describe the student's individual contributions to the research..."
                />
              </div>
            )}

            {/* Safety Statement Section */}
            {(signerType === "teacher" || signerType === "mentor") && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Safety and Ethics Statement
                </h3>
                <p className="text-sm text-gray-600">
                  For projects involving human participants, vertebrates, or potentially hazardous materials, 
                  please confirm that the student conducted the research properly in accordance with all applicable standards.
                </p>
                <textarea
                  value={safetyStatement}
                  onChange={(e) => setSafetyStatement(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                  placeholder="I confirm that the student conducted the research properly..."
                />
              </div>
            )}

            {/* Additional Fields for Teacher */}
            {signerType === "teacher" && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Teacher Information</h3>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">
                    Teacher&apos;s High School *
                  </label>
                  <input
                    type="text"
                    value={formData?.teacherSchool || ""}
                    onChange={(e) => {
                      if (formData) {
                        const updated = { ...formData, teacherSchool: e.target.value };
                        setFormData(updated);
                      }
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* Additional Fields for Mentor */}
            {signerType === "mentor" && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Mentor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData?.mentorTitle || ""}
                      onChange={(e) => {
                        if (formData) {
                          const updated = { ...formData, mentorTitle: e.target.value };
                          setFormData(updated);
                        }
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">
                      Institution *
                    </label>
                    <input
                      type="text"
                      value={formData?.mentorInstitution || ""}
                      onChange={(e) => {
                        if (formData) {
                          const updated = { ...formData, mentorInstitution: e.target.value };
                          setFormData(updated);
                        }
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Fields for Parent */}
            {signerType === "parent" && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Parent Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">
                      Parent Name *
                    </label>
                    <input
                      type="text"
                      value={formData?.parentName || ""}
                      onChange={(e) => {
                        if (formData) {
                          const updated = { ...formData, parentName: e.target.value };
                          setFormData(updated);
                        }
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData?.parentPhone || ""}
                      onChange={(e) => {
                        if (formData) {
                          const updated = { ...formData, parentPhone: e.target.value };
                          setFormData(updated);
                        }
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">
                    Describe your role in the research *
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                    placeholder="Describe what role you played in the research..."
                  />
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">{signerLabel} Signature *</h3>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">
                  Type your full name to sign
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving || !signature.trim()}
                className="px-6 py-2 bg-primary-green text-white rounded-md hover:bg-primary-darkGreen disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit & Sign"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
