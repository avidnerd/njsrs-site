"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";
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
  const [isCompleted, setIsCompleted] = useState(false);

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
      
      
      let alreadyCompleted = false;
      if (data.signerType === "teacher" && data.formData.teacherCompleted) {
        alreadyCompleted = true;
        setSignature(data.formData.teacherSignature || "");
      } else if (data.signerType === "mentor" && data.formData.mentorCompleted) {
        alreadyCompleted = true;
        setSignature(data.formData.mentorSignature || "");
      } else if (data.signerType === "parent" && data.formData.parentCompleted) {
        alreadyCompleted = true;
        setSignature(data.formData.parentSignature || "");
      }
      
      if (alreadyCompleted) {
        setIsCompleted(true);
        setSuccess("Form submitted successfully! Thank you for completing your section.");
      } else {
        
        if (data.formData.teacherMentorComments) {
          setComments(data.formData.teacherMentorComments);
        }
        if (data.formData.teacherMentorSafetyStatement) {
          setSafetyStatement(data.formData.teacherMentorSafetyStatement);
        }
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
        updatedFormData.teacherMentorComments = comments; 
        updatedFormData.parentCompleted = true;
      }

      
      const allComplete = 
        updatedFormData.studentCompleted &&
        (updatedFormData.teacherCompleted || updatedFormData.mentorCompleted || updatedFormData.parentCompleted);

      if (allComplete) {
        updatedFormData.formCompleted = true;
      }

      
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

      setIsCompleted(true);
      setSuccess("Form submitted successfully! Thank you for completing your section.");
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

  const signerLabel = signerType === "teacher" ? "Science Research Advisor" : signerType === "mentor" ? "Mentor" : "Parent";

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <img 
              src="/njsrs_logo.jpg" 
              alt="NJSRS Logo" 
              className="h-16 w-auto"
            />
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-primary-blue">New Jersey Science Research Symposium</h1>
              <p className="text-sm text-gray-600">Statement of Outside Assistance</p>
            </div>
          </div>
        </div>
      </header>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-primary-blue mb-2">
              {signerLabel} Signature Required
            </h2>
            <p className="text-gray-600 mb-6">
              Student: <strong>{student?.firstName} {student?.lastName}</strong>
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="font-semibold">{success}</p>
                </div>
                <p className="mt-2 text-sm">This form has been submitted and cannot be edited.</p>
              </div>
            )}

            {isCompleted ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Form Successfully Submitted</h3>
                <p className="text-gray-600">Thank you for completing your section of the Statement of Outside Assistance form.</p>
                <p className="text-gray-600 mt-2">You can safely close this page.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
            {}
            {signerType === "teacher" && (
              <>
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Did the student conduct this project on their own?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Please confirm whether the student conducted this research project independently, or describe any assistance they received.
                  </p>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                    placeholder="Please describe whether the student conducted this project independently or with assistance..."
                  />
                </div>
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Safety and Ethics Confirmation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Please confirm that the student conducted the research properly in accordance with all applicable safety and ethics standards.
                  </p>
                  <textarea
                    value={safetyStatement}
                    onChange={(e) => setSafetyStatement(e.target.value)}
                    rows={3}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                    placeholder="I confirm that the student conducted the research properly in accordance with all applicable standards..."
                  />
                </div>
              </>
            )}

            {}
            {signerType === "mentor" && (
              <>
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
              </>
            )}

            {}
            {signerType === "teacher" && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Science Research Advisor Information</h3>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">
                    Science Research Advisor&apos;s High School *
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

            {}
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

            {}
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

            {}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
