"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadResearchReport, uploadSlideshow } from "@/lib/firebase/storage";
import { updateStudentMaterials, requestSRCApproval, getStudent } from "@/lib/firebase/database";
import FileUpload from "@/components/upload/FileUpload";
import type { Student, SRCQuestions, EthicsQuestionnaire } from "@/lib/firebase/database";
import Link from "next/link";

export default function StudentMaterials() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"research" | "src" | "ethics" | "slideshow">("research");
  
  // Form state
  const [srcQuestions, setSRCQuestions] = useState<SRCQuestions>({});
  const [ethicsQuestionnaire, setEthicsQuestionnaire] = useState<EthicsQuestionnaire>({});

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
      if (studentData?.srcQuestions) {
        setSRCQuestions(studentData.srcQuestions);
      }
      if (studentData?.ethicsQuestionnaire) {
        setEthicsQuestionnaire(studentData.ethicsQuestionnaire);
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSRCQuestions = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateStudentMaterials(user.uid, { srcQuestions });
      alert("SRC questions saved successfully!");
    } catch (error) {
      alert("Failed to save SRC questions");
    } finally {
      setSaving(false);
    }
  };

  const saveEthicsQuestionnaire = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateStudentMaterials(user.uid, { ethicsQuestionnaire });
      alert("Ethics questionnaire saved successfully!");
    } catch (error) {
      alert("Failed to save ethics questionnaire");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestSRCApproval = async () => {
    if (!user) return;
    if (!confirm("Once you request SRC approval, you will not be able to make changes to your SRC questions. Are you sure you want to proceed?")) {
      return;
    }
    setSaving(true);
    try {
      await requestSRCApproval(user.uid);
      await loadStudent();
      alert("SRC approval request submitted successfully!");
    } catch (error) {
      alert("Failed to submit SRC approval request");
    } finally {
      setSaving(false);
    }
  };

  const handleResearchReportUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    const url = await uploadResearchReport(user.uid, file);
    await updateStudentMaterials(user.uid, { researchReportUrl: url });
    await loadStudent();
  };

  const handleSlideshowUpload = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    const url = await uploadSlideshow(user.uid, file);
    await updateStudentMaterials(user.uid, { slideshowUrl: url });
    await loadStudent();
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

  const canEditSRC = !student.srcApprovalRequested;

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
          onClick={() => setActiveSection("src")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeSection === "src"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          2. SRC Questions
        </button>
        <button
          onClick={() => setActiveSection("ethics")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeSection === "ethics"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          3. Ethics Questionnaire
        </button>
        <button
          onClick={() => setActiveSection("slideshow")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeSection === "slideshow"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          4. Slideshow
        </button>
      </div>

      {/* Research Report Section */}
      {activeSection === "research" && (
        <div className="space-y-4">
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
        </div>
      )}

      {/* SRC Questions Section */}
      {activeSection === "src" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Scientific Review Committee (SRC) Questions</h3>
            <p className="text-gray-600 mb-4">
              Please answer the following questions about your project. These questions help ensure compliance with safety and ethical guidelines.
            </p>
            {student.srcApprovalRequested && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-yellow-800 font-semibold">SRC Approval Requested</p>
                <p className="text-yellow-700 text-sm mt-1">
                  You have already requested SRC approval. You cannot make changes to these questions.
                  {student.srcApproved !== undefined && (
                    <span className="block mt-2">
                      Status: {student.srcApproved ? (
                        <span className="text-green-700 font-semibold">Approved</span>
                      ) : (
                        <span className="text-red-700 font-semibold">Pending Review</span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Human Participants */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Human Participants</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={srcQuestions.involvesHumanParticipants || false}
                    onChange={(e) => setSRCQuestions({ ...srcQuestions, involvesHumanParticipants: e.target.checked })}
                    disabled={!canEditSRC}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Does your project involve human participants?</span>
                </label>
                {srcQuestions.involvesHumanParticipants && (
                  <div className="ml-6 space-y-2">
                    <textarea
                      value={srcQuestions.humanParticipantsDetails || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, humanParticipantsDetails: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Please describe how human participants are involved in your research..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={srcQuestions.irbApprovalObtained || false}
                        onChange={(e) => setSRCQuestions({ ...srcQuestions, irbApprovalObtained: e.target.checked })}
                        disabled={!canEditSRC}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Have you obtained IRB approval?</span>
                    </label>
                    {srcQuestions.irbApprovalObtained && (
                      <textarea
                        value={srcQuestions.irbApprovalDetails || ""}
                        onChange={(e) => setSRCQuestions({ ...srcQuestions, irbApprovalDetails: e.target.value })}
                        disabled={!canEditSRC}
                        placeholder="Please provide IRB approval details..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    )}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={srcQuestions.informedConsentObtained || false}
                        onChange={(e) => setSRCQuestions({ ...srcQuestions, informedConsentObtained: e.target.checked })}
                        disabled={!canEditSRC}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Have you obtained informed consent from all participants?</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Vertebrate Animals */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Vertebrate Animals</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={srcQuestions.involvesVertebrateAnimals || false}
                    onChange={(e) => setSRCQuestions({ ...srcQuestions, involvesVertebrateAnimals: e.target.checked })}
                    disabled={!canEditSRC}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Does your project involve vertebrate animals?</span>
                </label>
                {srcQuestions.involvesVertebrateAnimals && (
                  <div className="ml-6 space-y-2">
                    <textarea
                      value={srcQuestions.vertebrateAnimalsDetails || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, vertebrateAnimalsDetails: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Please describe the vertebrate animals involved..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <textarea
                      value={srcQuestions.animalCareProtocol || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, animalCareProtocol: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Describe the animal care protocol..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={srcQuestions.veterinaryOversight || false}
                        onChange={(e) => setSRCQuestions({ ...srcQuestions, veterinaryOversight: e.target.checked })}
                        disabled={!canEditSRC}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Is there appropriate veterinary oversight?</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* PHBA */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Potentially Hazardous Biological Agents (PHBA)</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={srcQuestions.involvesPHBA || false}
                    onChange={(e) => setSRCQuestions({ ...srcQuestions, involvesPHBA: e.target.checked })}
                    disabled={!canEditSRC}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Does your project involve potentially hazardous biological agents?</span>
                </label>
                {srcQuestions.involvesPHBA && (
                  <div className="ml-6 space-y-2">
                    <textarea
                      value={srcQuestions.phbaDetails || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, phbaDetails: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Please describe the PHBA involved..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <input
                      type="text"
                      value={srcQuestions.biosafetyLevel || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, biosafetyLevel: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Biosafety Level (BSL-1, BSL-2, etc.)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <input
                      type="text"
                      value={srcQuestions.phbaLocation || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, phbaLocation: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Location where PHBA work is conducted"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Hazardous Materials */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Hazardous Chemicals, Activities, or Devices</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={srcQuestions.involvesHazardousMaterials || false}
                    onChange={(e) => setSRCQuestions({ ...srcQuestions, involvesHazardousMaterials: e.target.checked })}
                    disabled={!canEditSRC}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Does your project involve hazardous chemicals, activities, or devices?</span>
                </label>
                {srcQuestions.involvesHazardousMaterials && (
                  <div className="ml-6 space-y-2">
                    <textarea
                      value={srcQuestions.hazardousMaterialsDetails || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, hazardousMaterialsDetails: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Please describe the hazardous materials involved..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <textarea
                      value={srcQuestions.safetyProtocols || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, safetyProtocols: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Describe the safety protocols in place..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Continuation Project */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Continuation Project</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={srcQuestions.isContinuationProject || false}
                    onChange={(e) => setSRCQuestions({ ...srcQuestions, isContinuationProject: e.target.checked })}
                    disabled={!canEditSRC}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Is this a continuation of a previous project?</span>
                </label>
                {srcQuestions.isContinuationProject && (
                  <div className="ml-6 space-y-2">
                    <textarea
                      value={srcQuestions.continuationProjectDetails || ""}
                      onChange={(e) => setSRCQuestions({ ...srcQuestions, continuationProjectDetails: e.target.value })}
                      disabled={!canEditSRC}
                      placeholder="Please describe how this project differs from the previous year..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              {canEditSRC && (
                <>
                  <button
                    onClick={saveSRCQuestions}
                    disabled={saving}
                    className="bg-primary-green text-white px-6 py-2 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 font-semibold"
                  >
                    {saving ? "Saving..." : "Save SRC Questions"}
                  </button>
                  <button
                    onClick={handleRequestSRCApproval}
                    disabled={saving}
                    className="bg-primary-blue text-white px-6 py-2 rounded-md hover:bg-primary-darkBlue disabled:opacity-50 font-semibold"
                  >
                    Request SRC Approval
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ethics Questionnaire Section */}
      {activeSection === "ethics" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ethics Questionnaire</h3>
            <p className="text-gray-600 mb-4">
              Please answer the following questions about your research process and the work you performed.
            </p>

            {/* Research Ownership */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Research Ownership</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Describe the work you performed yourself:
                  </label>
                  <textarea
                    value={ethicsQuestionnaire.studentOwnership || ""}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, studentOwnership: e.target.value })}
                    placeholder="Please describe in detail the work you performed independently..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Describe any assistance provided by your mentor:
                  </label>
                  <textarea
                    value={ethicsQuestionnaire.mentorAssistance || ""}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, mentorAssistance: e.target.value })}
                    placeholder="Please describe any guidance, assistance, or support provided by your mentor..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Describe any assistance provided by lab technicians or other personnel:
                  </label>
                  <textarea
                    value={ethicsQuestionnaire.labTechnicianAssistance || ""}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, labTechnicianAssistance: e.target.value })}
                    placeholder="Please describe any assistance from lab technicians or other personnel..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* External Data */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">External Data and Resources</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ethicsQuestionnaire.externalData || false}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, externalData: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Did you use any external data or datasets in your research?</span>
                </label>
                {ethicsQuestionnaire.externalData && (
                  <textarea
                    value={ethicsQuestionnaire.externalDataDetails || ""}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, externalDataDetails: e.target.value })}
                    placeholder="Please describe the external data used and provide proper attribution..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                )}
              </div>
            </div>

            {/* Attribution */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Attribution and Literature Review</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ethicsQuestionnaire.properAttribution || false}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, properAttribution: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Have you provided proper attribution for all external work, ideas, and resources?</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ethicsQuestionnaire.literatureReviewCompleted || false}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, literatureReviewCompleted: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Have you completed an adequate literature review?</span>
                </label>
              </div>
            </div>

            {/* Research Integrity */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Research Integrity</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ethicsQuestionnaire.allProceduresReported || false}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, allProceduresReported: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Have you accurately reported all procedures and methods used?</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ethicsQuestionnaire.modificationsDisclosed || false}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, modificationsDisclosed: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Have you disclosed any modifications made to standard procedures?</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ethicsQuestionnaire.dataCollectionTransparent || false}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, dataCollectionTransparent: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Is your data collection process transparent and well-documented?</span>
                </label>
              </div>
            </div>

            {/* AI Usage */}
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">AI Tool Usage</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ethicsQuestionnaire.aiToolsUsed || false}
                    onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, aiToolsUsed: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Did you use any AI tools in your research process?</span>
                </label>
                {ethicsQuestionnaire.aiToolsUsed && (
                  <div className="ml-6 space-y-2">
                    <textarea
                      value={ethicsQuestionnaire.aiUsageDetails || ""}
                      onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, aiUsageDetails: e.target.value })}
                      placeholder="Please describe how you used AI tools (e.g., brainstorming, coding help, data organization, editing). Note: AI cannot be used to generate research ideas, fabricate data, design experiments independently, or write conclusions..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ethicsQuestionnaire.aiDisclosed || false}
                        onChange={(e) => setEthicsQuestionnaire({ ...ethicsQuestionnaire, aiDisclosed: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Have you disclosed your AI usage in your research submission?</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={saveEthicsQuestionnaire}
              disabled={saving}
              className="bg-primary-green text-white px-6 py-2 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 font-semibold"
            >
              {saving ? "Saving..." : "Save Ethics Questionnaire"}
            </button>
          </div>
        </div>
      )}

      {/* Slideshow Section */}
      {activeSection === "slideshow" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Slideshow Upload</h3>
            <p className="text-gray-600 mb-4">
              Please upload your presentation slideshow. <strong>The slideshow must be in .pptx format only.</strong>
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
    </div>
  );
}
