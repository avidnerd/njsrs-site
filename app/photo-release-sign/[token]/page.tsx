"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import type { PhotoRelease } from "@/lib/firebase/database";

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
}

export default function PhotoReleaseSignPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [formData, setFormData] = useState<PhotoRelease | null>(null);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [signature, setSignature] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (token) {
      loadFormData();
    }
  }, [token]);

  const loadFormData = async () => {
    try {
      const response = await fetch(`/api/photo-release-form?token=${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load form");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStudent(data.student);
      setFormData(data.formData);
      
      const isTeamMember = token.includes("_teammember_");
      
      if (data.formData.completed) {
        setIsCompleted(true);
        if (isTeamMember) {
          setParentName(data.formData.teamMemberParentName || "");
          setParentPhone(data.formData.teamMemberParentPhone || "");
          setSignature(data.formData.teamMemberParentSignature || "");
        } else {
          setParentName(data.formData.parentName || "");
          setParentPhone(data.formData.parentPhone || "");
          setSignature(data.formData.parentSignature || "");
        }
        setSuccess("Form submitted successfully! Thank you for completing the photo release form.");
      } else {
        if (isTeamMember) {
          if (data.formData.teamMemberParentName) {
            setParentName(data.formData.teamMemberParentName);
          }
          if (data.formData.teamMemberParentPhone) {
            setParentPhone(data.formData.teamMemberParentPhone);
          }
          if (data.formData.teamMemberParentSignature) {
            setSignature(data.formData.teamMemberParentSignature);
          }
        } else {
          if (data.formData.parentName) {
            setParentName(data.formData.parentName);
          }
          if (data.formData.parentPhone) {
            setParentPhone(data.formData.parentPhone);
          }
          if (data.formData.parentSignature) {
            setSignature(data.formData.parentSignature);
          }
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

    if (!signature.trim() || !parentName.trim()) {
      setError("Please provide your name and signature");
      setSaving(false);
      return;
    }

    if (!student || !formData) {
      setError("Form data not loaded");
      setSaving(false);
      return;
    }

    try {
      const isTeamMember = token.includes("_teammember_");
      const updatedFormData: PhotoRelease = {
        ...formData,
      };
      
      if (isTeamMember) {
        updatedFormData.teamMemberParentName = parentName;
        updatedFormData.teamMemberParentPhone = parentPhone;
        updatedFormData.teamMemberParentSignature = signature;
        updatedFormData.teamMemberParentSignatureDate = Timestamp.now();
      } else {
        updatedFormData.parentName = parentName;
        updatedFormData.parentPhone = parentPhone;
        updatedFormData.parentSignature = signature;
        updatedFormData.parentSignatureDate = Timestamp.now();
      }
      
      const bothParentsSigned = !!updatedFormData.parentSignature && 
        (!formData?.teamMemberParentEmail || !!updatedFormData.teamMemberParentSignature);
      updatedFormData.completed = bothParentsSigned;

      
      const response = await fetch("/api/photo-release-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          formData: updatedFormData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }

      setIsCompleted(true);
      setSuccess("Form submitted successfully! Thank you for completing the photo release form.");
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
              <p className="text-sm text-gray-600">Photo Release Form</p>
            </div>
          </div>
        </div>
      </header>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-primary-blue mb-2">
              Authorization and Release
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
                <p className="text-gray-600">Thank you for completing the Photo Release Form.</p>
                <p className="text-gray-600 mt-2">You can safely close this page.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border rounded-lg p-4 space-y-4">
                  <p className="text-gray-700">
                    I, the undersigned, am the parent or legal guardian of the student named above ("my child"). 
                    I hereby grant permission to Millburn High School and its representatives to take photographs, 
                    video recordings, and/or voice recordings of my child during the science fair event.
                  </p>
                  <p className="text-gray-700">
                    I authorize the use and reproduction of these images, recordings, and my child&apos;s name for 
                    promotional, educational, and publicity purposes without compensation to me or my child. These uses include, but are not limited to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Website content, social media posts, and digital newsletters.</li>
                    <li>Printed brochures, flyers, and reports.</li>
                    <li>Media releases and news coverage of the event.</li>
                  </ul>
                  <p className="text-gray-700">
                    I understand that these materials will become the property of Millburn High School and will not be returned. 
                    I agree to hold harmless Millburn High School from any claims or damages resulting from the publication of these images.
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Parent/Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-900">
                        Parent/Guardian Name (Please Print) *
                      </label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
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
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Signature *</h3>
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
                    disabled={saving || !signature.trim() || !parentName.trim()}
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
