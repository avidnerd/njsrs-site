"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadResearchReport, uploadSlideshow, uploadAbstract } from "@/lib/firebase/storage";
import { updateStudentMaterials, getStudent } from "@/lib/firebase/database";
import FileUpload from "@/components/upload/FileUpload";
import StatementOfOutsideAssistance from "./StatementOfOutsideAssistance";
import type { Student } from "@/lib/firebase/database";
import Link from "next/link";

interface StudentMaterialsProps {
  onFormUpdate?: () => void;
}

export default function StudentMaterials({ onFormUpdate }: StudentMaterialsProps) {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"research" | "slideshow" | "statement">("research");

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
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResearchReportUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    const url = await uploadResearchReport(user.uid, file);
    await updateStudentMaterials(user.uid, { researchReportUrl: url });
    await loadStudent();
    if (onFormUpdate) {
      onFormUpdate();
    }
  };

  const handleSlideshowUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    const url = await uploadSlideshow(user.uid, file);
    await updateStudentMaterials(user.uid, { slideshowUrl: url });
    await loadStudent();
    if (onFormUpdate) {
      onFormUpdate();
    }
  };

  const handleAbstractUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    const url = await uploadAbstract(user.uid, file);
    await updateStudentMaterials(user.uid, { abstractUrl: url });
    await loadStudent();
    if (onFormUpdate) {
      onFormUpdate();
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!student || student.status !== "approved") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">
          You must be approved by your SRA before you can submit materials.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-primary-blue mb-6">Submit Competition Materials</h2>
      
      {/* Section Navigation */}
      <div className="mb-6 flex flex-wrap gap-2 border-b pb-4">
        <button
          onClick={() => setActiveSection("research")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeSection === "research"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          1. Research Report
        </button>
        <button
          onClick={() => setActiveSection("slideshow")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeSection === "slideshow"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          2. Slideshow
        </button>
        <button
          onClick={() => setActiveSection("statement")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeSection === "statement"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          3. Statement of Outside Assistance
        </button>
      </div>

      {/* Research Report Section */}
      {activeSection === "research" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Research Report Upload</h3>
            <p className="text-gray-600 mb-4">
              Please upload your research report as a PDF. For detailed guidelines, please refer to the{" "}
              <Link href="/competition" className="text-primary-blue hover:underline">
                Competition page
              </Link>.
            </p>
            <FileUpload
              label="Research Report (PDF only)"
              accept=".pdf"
              onUpload={handleResearchReportUpload}
              currentFile={student.researchReportUrl}
              maxSizeMB={15}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Abstract Upload</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-yellow-800">
                    Important: Please double-check your abstract before uploading
                  </p>
                  <p className="mt-2 text-sm text-yellow-700">
                    The abstract you upload will be published in the official program for the fair and <strong>cannot be changed once uploaded</strong>. 
                    Please carefully review your abstract for:
                  </p>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    <li>Correct spelling and grammar</li>
                    <li>Accurate scientific terminology</li>
                    <li>Proper formatting</li>
                    <li>Complete and accurate information</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Please upload your abstract as a PDF or Word document. The abstract should be a concise summary of your research project.
            </p>
            <FileUpload
              label="Abstract (PDF or Word document), 250 word limit"
              accept=".pdf,.doc,.docx"
              onUpload={handleAbstractUpload}
              currentFile={student.abstractUrl}
              maxSizeMB={5}
            />
          </div>
        </div>
      )}

      {/* Slideshow Section */}
      {activeSection === "slideshow" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Slideshow Upload</h3>
            <p className="text-gray-600 mb-4">
              Please upload your presentation slideshow. <strong>The slideshow must be in .pptx format only. </strong>
              If you created your presentation in Google Slides, please download it as a PowerPoint (.pptx) file before uploading.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>Important:</strong> Presentations are limited to 10 minutes. Please ensure your slideshow is properly formatted and all videos are embedded.
              Refer to the Competition page for detailed presentation guidelines.
            </p>
            <FileUpload
              label="Slideshow (.pptx format only)"
              accept=".pptx"
              onUpload={handleSlideshowUpload}
              currentFile={student.slideshowUrl}
              maxSizeMB={25}
            />
          </div>
        </div>
      )}

      {/* Statement of Outside Assistance Section */}
      {activeSection === "statement" && (
        <StatementOfOutsideAssistance onFormUpdate={onFormUpdate} />
      )}
    </div>
  );
}
