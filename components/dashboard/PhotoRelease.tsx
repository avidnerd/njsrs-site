"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateStudentMaterials, getStudent } from "@/lib/firebase/database";
import type { Student, PhotoRelease } from "@/lib/firebase/database";

interface PhotoReleaseProps {
  onFormUpdate?: () => void;
}

export default function PhotoRelease({ onFormUpdate }: PhotoReleaseProps) {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PhotoRelease>({});
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      loadStudent();
    }
  }, [user]);

  const loadStudent = async () => {
    if (!user) return;
    
    try {
      const studentData = await getStudent(user.uid);
      setStudent(studentData);
      if (studentData?.photoRelease) {
        setFormData(studentData.photoRelease);
        setParentEmail(studentData.photoRelease.parentEmail || "");
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!user || !parentEmail.trim()) {
      setError("Please enter a valid email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Generate a unique token for this invitation
      const token = `${user.uid}_photorelease_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Send invitation email via API route FIRST
      const response = await fetch("/api/send-photo-release-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.uid,
          studentName: `${student?.firstName} ${student?.lastName}`,
          email: parentEmail,
          token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send invitation email");
      }

      // Only update form data AFTER email is successfully sent
      const updatedFormData: PhotoRelease = {
        ...formData,
        parentEmail,
        parentInviteSent: true,
        parentInviteToken: token,
      };

      await updateStudentMaterials(user.uid, {
        photoRelease: updatedFormData,
      });

      setFormData(updatedFormData);
      setSuccess(`Invitation sent to ${parentEmail} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
      await loadStudent(); // Reload to get updated data
      if (onFormUpdate) {
        onFormUpdate(); // Trigger parent to reload student data
      }
    } catch (error: any) {
      setError(error.message || "Failed to send invitation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-primary-blue mb-4">Photo Release Form</h2>
      <p className="text-gray-600 mb-6">
        Please request your parent or legal guardian to complete and sign the photo release form. 
        This form authorizes Millburn High School to use photographs and recordings of you during the science fair event.
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

      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900">
            Parent/Guardian Email *
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => {
                setParentEmail(e.target.value);
                if (formData.parentEmail !== e.target.value) {
                  setFormData({ ...formData, parentInviteSent: false, parentInviteToken: undefined });
                }
              }}
              placeholder="parent@email.com"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
            />
            <button
              type="button"
              onClick={sendInvitation}
              disabled={saving || !parentEmail.trim()}
              className="px-4 py-2 bg-primary-green text-white rounded-md hover:bg-primary-darkGreen disabled:opacity-50"
            >
              {saving ? "Sending..." : formData.parentInviteSent ? "Resend Invitation" : "Send Invitation"}
            </button>
          </div>
          {formData.parentInviteSent && (
            <p className="text-sm text-green-600 mt-1">✓ Invitation sent to {formData.parentEmail}</p>
          )}
        </div>
      </div>

      {formData.completed && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 font-semibold">Photo Release Form Completed</p>
          </div>
          {formData.parentSignatureDate && (
            <p className="text-sm text-green-600 mt-1">
              Signed on: {(() => {
                const date = formData.parentSignatureDate;
                if (date instanceof Date) {
                  return date.toLocaleDateString();
                } else if (date && typeof date === 'object' && 'toDate' in date && typeof (date as any).toDate === 'function') {
                  return (date as any).toDate().toLocaleDateString();
                } else if (date && typeof date === 'object' && 'seconds' in date) {
                  return new Date((date as any).seconds * 1000).toLocaleDateString();
                }
                return 'Unknown date';
              })()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
