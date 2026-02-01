"use client";

import { useState } from "react";
import { registerJudge } from "@/lib/firebase/registration";
import { useRouter } from "next/navigation";

export default function JudgeRegistrationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    cellPhone: "",
    institution: "",
    institutionYears: "",
    department: "",
    currentPosition: "",
    employmentStatus: "" as "currently_working" | "retired" | "",
    highestDegree: "",
    degreeDate: "",
    degreeDiscipline: "",
    areaOfExpertise: "",
    publications: "",
    patents: "",
    experienceJudgingScienceFairs: false,
    canCommitToAllProjects: false,
    knowsStudents: false,
    knownStudents: "",
    mentoringStudents: false,
    mentoringDetails: "",
    availabilityApril18: "" as "remote_morning_only" | "in_person_full_day" | "in_person_morning_only" | "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalSteps = 10;

  const validateStep = (step: number): boolean => {
    setError("");
    
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          setError("First name is required");
          return false;
        }
        if (!formData.lastName.trim()) {
          setError("Last name is required");
          return false;
        }
        if (!formData.email.trim()) {
          setError("Email is required");
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError("Please enter a valid email address");
          return false;
        }
        if (!formData.password) {
          setError("Password is required");
          return false;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        return true;
      case 2:
        if (!formData.address.trim()) {
          setError("Address is required");
          return false;
        }
        if (!formData.cellPhone.trim()) {
          setError("Cell phone number is required");
          return false;
        }
        return true;
      case 3:
        if (!formData.institution.trim()) {
          setError("Institution is required");
          return false;
        }
        if (!formData.department.trim()) {
          setError("Department is required");
          return false;
        }
        if (!formData.currentPosition.trim()) {
          setError("Current position is required");
          return false;
        }
        if (!formData.employmentStatus) {
          setError("Employment status is required");
          return false;
        }
        return true;
      case 4:
        if (!formData.highestDegree.trim()) {
          setError("Highest degree is required");
          return false;
        }
        if (!formData.degreeDate.trim()) {
          setError("Degree date is required");
          return false;
        }
        if (!formData.degreeDiscipline.trim()) {
          setError("Degree discipline is required");
          return false;
        }
        return true;
      case 5:
        if (!formData.areaOfExpertise.trim()) {
          setError("Area of expertise is required");
          return false;
        }
        return true;
      case 6:
        return true; // Publications and patents are optional
      case 7:
        return true; // Experience is a checkbox
      case 8:
        if (!formData.canCommitToAllProjects) {
          setError("You must commit to viewing all 10 projects");
          return false;
        }
        return true;
      case 9:
        return true; // Conflicts of interest
      case 10:
        if (!formData.availabilityApril18) {
          setError("Please select your availability for April 18th");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError("");

    try {
      const { verificationCode } = await registerJudge(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        cellPhone: formData.cellPhone,
        institution: formData.institution,
        institutionYears: formData.institutionYears,
        department: formData.department,
        currentPosition: formData.currentPosition,
        employmentStatus: formData.employmentStatus || undefined,
        highestDegree: formData.highestDegree,
        degreeDate: formData.degreeDate,
        degreeDiscipline: formData.degreeDiscipline,
        areaOfExpertise: formData.areaOfExpertise,
        publications: formData.publications,
        patents: formData.patents,
        experienceJudgingScienceFairs: formData.experienceJudgingScienceFairs ? "Yes" : "No",
        canCommitToAllProjects: formData.canCommitToAllProjects,
        knowsStudents: formData.knowsStudents,
        knownStudents: formData.knownStudents,
        mentoringStudents: formData.mentoringStudents,
        mentoringDetails: formData.mentoringDetails,
        availabilityApril18: formData.availabilityApril18 || undefined,
      });

      // Store verification code in sessionStorage temporarily
      sessionStorage.setItem("verificationCode", verificationCode);
      router.push("/verify");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1 text-gray-900">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1 text-gray-900">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-900">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-900">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-900">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Contact Information</h2>
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1 text-gray-900">
                Address *
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="cellPhone" className="block text-sm font-medium mb-1 text-gray-900">
                Cell Phone Number *
              </label>
              <input
                id="cellPhone"
                type="tel"
                value={formData.cellPhone}
                onChange={(e) => setFormData({ ...formData, cellPhone: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Institution</h2>
            <div>
              <label htmlFor="institution" className="block text-sm font-medium mb-1 text-gray-900">
                Institution *
              </label>
              <input
                id="institution"
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="institutionYears" className="block text-sm font-medium mb-1 text-gray-900">
                Years at Institution
              </label>
              <input
                id="institutionYears"
                type="text"
                value={formData.institutionYears}
                onChange={(e) => setFormData({ ...formData, institutionYears: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium mb-1 text-gray-900">
                Department *
              </label>
              <input
                id="department"
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="currentPosition" className="block text-sm font-medium mb-1 text-gray-900">
                Current Position *
              </label>
              <input
                id="currentPosition"
                type="text"
                value={formData.currentPosition}
                onChange={(e) => setFormData({ ...formData, currentPosition: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Employment Status</h2>
            <div>
              <label className="block text-sm font-medium mb-3">Are you currently working or retired? *</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="employmentStatus"
                    value="currently_working"
                    checked={formData.employmentStatus === "currently_working"}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as "currently_working" | "retired" })}
                    className="mr-2"
                  />
                  Currently Working
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="employmentStatus"
                    value="retired"
                    checked={formData.employmentStatus === "retired"}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as "currently_working" | "retired" })}
                    className="mr-2"
                  />
                  Retired
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Education</h2>
            <div>
              <label htmlFor="highestDegree" className="block text-sm font-medium mb-1 text-gray-900">
                Highest Degree *
              </label>
              <input
                id="highestDegree"
                type="text"
                value={formData.highestDegree}
                onChange={(e) => setFormData({ ...formData, highestDegree: e.target.value })}
                placeholder="e.g., Ph.D., M.S., B.S."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="degreeDate" className="block text-sm font-medium mb-1 text-gray-900">
                Date of Degree *
              </label>
              <input
                id="degreeDate"
                type="text"
                value={formData.degreeDate}
                onChange={(e) => setFormData({ ...formData, degreeDate: e.target.value })}
                placeholder="e.g., 2010"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="degreeDiscipline" className="block text-sm font-medium mb-1 text-gray-900">
                Discipline *
              </label>
              <input
                id="degreeDiscipline"
                type="text"
                value={formData.degreeDiscipline}
                onChange={(e) => setFormData({ ...formData, degreeDiscipline: e.target.value })}
                placeholder="e.g., Biology, Chemistry, Physics"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Area of Expertise</h2>
            <div>
              <label htmlFor="areaOfExpertise" className="block text-sm font-medium mb-1 text-gray-900">
                Primary Area of Expertise *
              </label>
              <textarea
                id="areaOfExpertise"
                value={formData.areaOfExpertise}
                onChange={(e) => setFormData({ ...formData, areaOfExpertise: e.target.value })}
                rows={4}
                placeholder="Describe your area of expertise..."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Publications & Patents</h2>
            <div>
              <label htmlFor="publications" className="block text-sm font-medium mb-1 text-gray-900">
                Publications
              </label>
              <textarea
                id="publications"
                value={formData.publications}
                onChange={(e) => setFormData({ ...formData, publications: e.target.value })}
                rows={4}
                placeholder="List your publications (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="patents" className="block text-sm font-medium mb-1 text-gray-900">
                Patents
              </label>
              <textarea
                id="patents"
                value={formData.patents}
                onChange={(e) => setFormData({ ...formData, patents: e.target.value })}
                rows={4}
                placeholder="List your patents (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Judging Experience</h2>
            <div>
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={formData.experienceJudgingScienceFairs}
                  onChange={(e) => setFormData({ ...formData, experienceJudgingScienceFairs: e.target.checked })}
                  className="mr-2"
                />
                Have you had experience judging science fairs?
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canCommitToAllProjects}
                  onChange={(e) => setFormData({ ...formData, canCommitToAllProjects: e.target.checked })}
                  className="mr-2"
                />
                Can you commit to viewing all 10 projects even if they are outside of your primary field of expertise?
              </label>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Conflicts of Interest</h2>
            <div>
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={formData.knowsStudents}
                  onChange={(e) => setFormData({ ...formData, knowsStudents: e.target.checked })}
                  className="mr-2"
                />
                Do you know any high school students that may apply to NJSRS?
              </label>
              {formData.knowsStudents && (
                <div className="ml-6 mb-4">
                  <label htmlFor="knownStudents" className="block text-sm font-medium mb-1 text-gray-900">
                    If yes, who?
                  </label>
                  <textarea
                    id="knownStudents"
                    value={formData.knownStudents}
                    onChange={(e) => setFormData({ ...formData, knownStudents: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={formData.mentoringStudents}
                  onChange={(e) => setFormData({ ...formData, mentoringStudents: e.target.checked })}
                  className="mr-2"
                />
                Are you mentoring any students this year?
              </label>
              {formData.mentoringStudents && (
                <div className="ml-6">
                  <label htmlFor="mentoringDetails" className="block text-sm font-medium mb-1 text-gray-900">
                    Please provide details
                  </label>
                  <textarea
                    id="mentoringDetails"
                    value={formData.mentoringDetails}
                    onChange={(e) => setFormData({ ...formData, mentoringDetails: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-blue mb-4">Availability</h2>
            <div>
              <label htmlFor="availabilityApril18" className="block text-sm font-medium mb-3 text-gray-900">
                Availability on April 18th *
              </label>
              <div className="space-y-2">
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="availabilityApril18"
                    value="remote_morning_only"
                    checked={formData.availabilityApril18 === "remote_morning_only"}
                    onChange={(e) => setFormData({ ...formData, availabilityApril18: e.target.value as any })}
                    className="mr-2"
                  />
                  Remote (Morning Only, 8:30 AM - 12:00 PM)
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="availabilityApril18"
                    value="in_person_full_day"
                    checked={formData.availabilityApril18 === "in_person_full_day"}
                    onChange={(e) => setFormData({ ...formData, availabilityApril18: e.target.value as any })}
                    className="mr-2"
                  />
                  In Person (Full Day, 8:30 AM - 3:30 PM)
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="availabilityApril18"
                    value="in_person_morning_only"
                    checked={formData.availabilityApril18 === "in_person_morning_only"}
                    onChange={(e) => setFormData({ ...formData, availabilityApril18: e.target.value as any })}
                    className="mr-2"
                  />
                  In Person (Morning Only, 8:30 AM - 12:00 PM)
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-green h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        {renderStep()}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Previous
        </button>
        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="bg-primary-green text-white px-6 py-2 rounded-md hover:bg-primary-darkGreen font-semibold"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-green text-white px-6 py-2 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? "Registering..." : "REGISTER AS JUDGE"}
          </button>
        )}
      </div>
    </form>
  );
}
