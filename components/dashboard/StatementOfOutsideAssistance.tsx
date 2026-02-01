"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateStudentMaterials, getStudent } from "@/lib/firebase/database";
import type { Student, StatementOfOutsideAssistance } from "@/lib/firebase/database";
import { Timestamp } from "firebase/firestore";

interface StatementOfOutsideAssistanceProps {
  onFormUpdate?: () => void;
  disabled?: boolean;
}

export default function StatementOfOutsideAssistance({ onFormUpdate, disabled = false }: StatementOfOutsideAssistanceProps) {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<StatementOfOutsideAssistance>({});
  const [signature, setSignature] = useState("");
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
      if (studentData?.statementOfOutsideAssistance) {
        setFormData(studentData.statementOfOutsideAssistance);
        if (studentData.statementOfOutsideAssistance.studentSignature) {
          setSignature(studentData.statementOfOutsideAssistance.studentSignature);
        }
      } else {
        // Initialize with student info
        setFormData({
          studentFirstName: studentData?.firstName || "",
          studentLastName: studentData?.lastName || "",
          school: studentData?.schoolName || "",
        });
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveForm = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      await updateStudentMaterials(user.uid, {
        statementOfOutsideAssistance: formData,
      });
      setSuccess("Form saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      if (onFormUpdate) {
        onFormUpdate();
      }
    } catch (error) {
      setError("Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const sendInvitation = async (type: "teacher" | "mentor" | "parent", email: string) => {
    if (!user || !email.trim()) {
      setError("Please enter a valid email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Generate a unique token for this invitation
      const token = `${user.uid}_${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Send invitation email via API route FIRST
      const response = await fetch("/api/send-statement-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.uid,
          studentName: `${student?.firstName} ${student?.lastName}`,
          type,
          email,
          token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send invitation email");
      }

      // Only update form data AFTER email is successfully sent
      const updatedFormData = { ...formData };
      if (type === "teacher") {
        updatedFormData.teacherEmail = email;
        updatedFormData.teacherInviteSent = true;
        updatedFormData.teacherInviteToken = token;
      } else if (type === "mentor") {
        updatedFormData.mentorEmail = email;
        updatedFormData.mentorInviteSent = true;
        updatedFormData.mentorInviteToken = token;
      } else if (type === "parent") {
        updatedFormData.parentEmail = email;
        updatedFormData.parentInviteSent = true;
        updatedFormData.parentInviteToken = token;
      }

      await updateStudentMaterials(user.uid, {
        statementOfOutsideAssistance: updatedFormData,
      });

      setFormData(updatedFormData);
      setSuccess(`Invitation sent to ${email} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
      if (onFormUpdate) {
        onFormUpdate();
      }
    } catch (error: any) {
      setError(error.message || "Failed to send invitation");
    } finally {
      setSaving(false);
    }
  };

  const handleStudentSignature = async () => {
    if (!signature.trim()) {
      setError("Please provide your signature");
      return;
    }

    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedFormData = {
        ...formData,
        studentSignature: signature,
        studentSignatureDate: Timestamp.now(),
        studentCompleted: true,
      };

      await updateStudentMaterials(user.uid, {
        statementOfOutsideAssistance: updatedFormData,
      });

      setFormData(updatedFormData);
      setSuccess("Signature saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      if (onFormUpdate) {
        onFormUpdate();
      }
    } catch (error) {
      setError("Failed to save signature");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof StatementOfOutsideAssistance, value: any) => {
    const updated = { ...formData, [field]: value };
    
    // Clear invitation sent status if email is changed
    if (field === "teacherEmail" && value !== formData.teacherEmail) {
      updated.teacherInviteSent = false;
      updated.teacherInviteToken = undefined;
    } else if (field === "mentorEmail" && value !== formData.mentorEmail) {
      updated.mentorInviteSent = false;
      updated.mentorInviteToken = undefined;
    } else if (field === "parentEmail" && value !== formData.parentEmail) {
      updated.parentInviteSent = false;
      updated.parentInviteToken = undefined;
    }
    
    setFormData(updated);
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Statement of Outside Assistance Form
        </h3>
        <p className="text-gray-600 mb-4">
          Please complete all sections of this form. Use the active voice and 1st person pronouns ("I" and "me") when describing your work. 
          Type "N/A" in any field that does not apply to your research project.
        </p>
      </div>

      {disabled && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Editing Disabled:</strong> The deadline for editing materials was March 23, 2026. You can still view your form, but editing is no longer available.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Student Information */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-gray-900">Student Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              First Name *
            </label>
            <input
              type="text"
              value={formData.studentFirstName || ""}
              onChange={(e) => updateField("studentFirstName", e.target.value)}
              required
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.studentLastName || ""}
              onChange={(e) => updateField("studentLastName", e.target.value)}
              required
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Partner First Name (if applicable)
            </label>
            <input
              type="text"
              value={formData.partnerFirstName || ""}
              onChange={(e) => updateField("partnerFirstName", e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Partner Last Name (if applicable)
            </label>
            <input
              type="text"
              value={formData.partnerLastName || ""}
              onChange={(e) => updateField("partnerLastName", e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Title of Your 5-20 Page Research Report *
            </label>
            <input
              type="text"
              value={formData.researchReportTitle || ""}
              onChange={(e) => updateField("researchReportTitle", e.target.value)}
              required
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              School *
            </label>
            <input
              type="text"
              value={formData.school || ""}
              onChange={(e) => updateField("school", e.target.value)}
              required
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Science Research Advisor Information */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-gray-900">Science Research Advisor Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Science Research Advisor First Name *
            </label>
            <input
              type="text"
              value={formData.teacherFirstName || ""}
              onChange={(e) => updateField("teacherFirstName", e.target.value)}
              required
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Science Research Advisor Last Name *
            </label>
            <input
              type="text"
              value={formData.teacherLastName || ""}
              onChange={(e) => updateField("teacherLastName", e.target.value)}
              required
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Science Research Advisor Email (for signature invitation) *
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={formData.teacherEmail || ""}
                onChange={(e) => updateField("teacherEmail", e.target.value)}
                placeholder="advisor@school.edu"
                required
                disabled={disabled}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => sendInvitation("teacher", formData.teacherEmail || "")}
                disabled={saving || disabled}
                className="px-4 py-2 bg-primary-green text-white rounded-md hover:bg-primary-darkGreen disabled:opacity-50"
              >
                {saving ? "Sending..." : formData.teacherInviteSent ? "Resend Invitation" : "Send Invitation"}
              </button>
            </div>
            {formData.teacherInviteSent && (
              <p className="text-sm text-green-600 mt-1">✓ Invitation sent to {formData.teacherEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mentor Information */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-gray-900">Research Mentor Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Mentor First Name
            </label>
            <input
              type="text"
              value={formData.mentorFirstName || ""}
              onChange={(e) => updateField("mentorFirstName", e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Mentor Last Name
            </label>
            <input
              type="text"
              value={formData.mentorLastName || ""}
              onChange={(e) => updateField("mentorLastName", e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Mentor Institution
            </label>
            <input
              type="text"
              value={formData.mentorInstitution || ""}
              onChange={(e) => updateField("mentorInstitution", e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Mentor Email (for signature invitation)
              {!formData.mentorFirstName && (
                <span className="text-blue-600 text-xs ml-2">(or Science Research Advisor email if no mentor)</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={formData.mentorEmail || ""}
                onChange={(e) => updateField("mentorEmail", e.target.value)}
                placeholder={formData.mentorFirstName ? "mentor@institution.edu" : "advisor@school.edu or mentor@institution.edu"}
                disabled={disabled}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => sendInvitation("mentor", formData.mentorEmail || "")}
                disabled={saving || !formData.mentorEmail || disabled}
                className="px-4 py-2 bg-primary-green text-white rounded-md hover:bg-primary-darkGreen disabled:opacity-50"
              >
                {saving ? "Sending..." : formData.mentorInviteSent ? "Resend Invitation" : "Send Invitation"}
              </button>
            </div>
            {formData.mentorInviteSent && (
              <p className="text-sm text-green-600 mt-1">✓ Invitation sent to {formData.mentorEmail}</p>
            )}
          </div>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> If the student does not have a mentor, enter your Science Research Advisor&apos;s name and email address in the mentor fields above and send them the mentor form to fill out additional information about your research.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Questions */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-gray-900">Student Questions</h4>
        
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => {
          const questions = [
            "Please describe the part you played in the development of your project idea. Explain. Be specific about what YOU did versus what OTHERS did.",
            "Describe the steps that led you to create your research question (or design problem).",
            "Where did you do the work in your research project (home, school, an outside institution)? If it's an institution, please list the name of the institution. If it's a combination of places, please state that.",
            "Describe the help you received throughout your project and from whom. Consider such things as your literature search, the development of a research question (or design problem), the development of testable hypotheses, experimental design, the use of equipment and tools, the data collection, data analysis, making inferences (conclusions) from your data, and the preparation of your written report.",
            "If you conducted your research at an institution, it is likely that you worked with others at that institution while doing your research. Describe your role in the research group at the institution. Be specific about the work YOU did on your project versus the work OTHERS in the research group did on your project.",
            "Describe the origin of any data used in your research that you did not generate. Did you obtain data from the literature, a publicly available online database, or from somewhere else? Be specific about the origin of the data you used and what the data were used for in your research.",
            "Explain why you used data that you obtained from somewhere else instead of generating it yourself.",
            "Is this a continuation of prior research (from 2025 or earlier)? If so, how have you expanded on your prior research?",
            "If this is a continuation of a prior research project (from 2025 or earlier), please attach the abstract from your prior research project, if that research was presented at a fair or published in a paper last year or earlier.",
            "For the New Jersey Science Research Symposium (NJSRS), students may use artificial intelligence (AI) tools in a limited and ethical manner to support their research. AI can be used for brainstorming, limited coding help, data organization, or editing for clarity, but not to generate research ideas, fabricate data, design experiments independently, or write the research report, create the presentation slides, or create the poster. Students must maintain full ownership and understanding of all work submitted and be able to explain and justify every part of their project. Any use of AI in the project and the research submission should follow academic integrity standards and be disclosed. The use of AI is not permitted if it confers an unfair competitive advantage or misrepresents student work. All written materials that you submit and presentations that you make at NJSRS should reflect your own descriptions of your original research and experimental processes. NJSRS has a strict no generative AI policy when students are writing their reports, creating their presentations, and posters. The usage of any AI tools or assistance must be clearly stated in advance. Have you complied with the statement above? If not, please explain.",
            "Describe the methods and materials you used in your research. Be specific and detailed about what YOU did versus what OTHERS did.",
            "NJSRS requires that all work performed by students be done in a safe, legal, and ethical way that conforms to all current standards. If your work involved human participants, vertebrates, or potentially hazardous materials (such as potentially hazardous biological substances or dangerous chemicals) please explain the steps you took to adhere to existing standards of safety and ethics. Be specific.",
            "Did a professional scientist or engineer oversee your work? If so, who? Explain the role of the professional scientist or engineer in overseeing your work.",
            "Was an Institutional Review Board (IRB) created to oversee your research? If so, who was on it? What were their findings? Be specific.",
          ];

          const fieldName = `question${num}` as keyof StatementOfOutsideAssistance;
          
          return (
            <div key={num}>
              <label className="block text-sm font-medium mb-1 text-gray-900">
                Question {num} *
              </label>
              <p className="text-sm text-gray-600 mb-2">{questions[num - 1]}</p>
              <textarea
                value={(formData[fieldName] as string) || ""}
                onChange={(e) => updateField(fieldName, e.target.value)}
                rows={4}
                required
                disabled={disabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Type 'N/A' if this question does not apply to your research project."
              />
            </div>
          );
        })}
      </div>

      {/* Student Signature */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-gray-900">Student Signature *</h4>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900">
            Type your full name to sign
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Your full name"
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="button"
          onClick={handleStudentSignature}
          disabled={saving || !signature.trim() || formData.studentCompleted || disabled}
          className="px-4 py-2 bg-primary-green text-white rounded-md hover:bg-primary-darkGreen disabled:opacity-50"
        >
          {formData.studentCompleted ? "✓ Signed" : "Sign Form"}
        </button>
        {formData.studentCompleted && formData.studentSignatureDate && (
          <p className="text-sm text-gray-600">
            Signed on: {(() => {
              const date = formData.studentSignatureDate;
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

      {/* Parent Invitation (if no Science Research Advisor/mentor) */}
      {(!formData.teacherFirstName || !formData.mentorFirstName) && (
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Parent Information (Required if no Science Research Advisor or Mentor)</h4>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Parent Email (for signature invitation) *
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={formData.parentEmail || ""}
                onChange={(e) => updateField("parentEmail", e.target.value)}
                placeholder="parent@email.com"
                required
                disabled={disabled}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => sendInvitation("parent", formData.parentEmail || "")}
                disabled={saving || disabled}
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
      )}

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={saveForm}
          disabled={saving || disabled}
          className="px-6 py-2 bg-primary-blue text-white rounded-md hover:bg-primary-darkGreen disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Progress"}
        </button>
      </div>
    </div>
  );
}
