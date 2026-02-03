"use client";

import { useState, useEffect } from "react";
import { registerStudent } from "@/lib/firebase/registration";
import { getSchoolsWithSRAs, getSRAsBySchool } from "@/lib/firebase/database";
import { useRouter } from "next/navigation";
import type { School, SRA } from "@/lib/firebase/database";

export default function StudentRegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    grade: "",
    projectTitle: "",
    projectDescription: "",
    shirtSize: "",
    schoolId: "",
    sraId: "",
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [sras, setSRAs] = useState<SRA[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (formData.schoolId) {
      loadSRAs();
    } else {
      setSRAs([]);
      setFormData({ ...formData, sraId: "" });
      setError(""); 
    }
  }, [formData.schoolId]);

  const loadSchools = async () => {
    try {
      const schoolsWithSRAs = await getSchoolsWithSRAs();
      setSchools(schoolsWithSRAs);
    } catch (err) {
      console.error("Error loading schools:", err);
      setError("Error loading schools. Please try again.");
    }
  };

  const loadSRAs = async () => {
    try {
      const schoolSRAs = await getSRAsBySchool(formData.schoolId);
      setSRAs(schoolSRAs);
      if (schoolSRAs.length === 0) {
        setError("No Science Research Advisors found for this school. Please contact your school to register an SRA first.");
      } else {
        setError(""); 
      }
    } catch (err) {
      console.error("Error loading SRAs:", err);
      setError("Error loading SRAs for this school");
    }
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.password) {
      setError("Password is required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.grade) {
      setError("Please select your grade");
      return;
    }

    if (!formData.schoolId) {
      setError("Please select your school");
      return;
    }

    if (!formData.sraId) {
      setError("Please select your Science Research Advisor");
      return;
    }

    if (!formData.shirtSize) {
      setError("Please select your shirt size");
      return;
    }

    if (formData.projectDescription.trim()) {
      const wordCount = countWords(formData.projectDescription);
      if (wordCount > 150) {
        setError(`Project description must be 150 words or less. Current: ${wordCount} words`);
        return;
      }
    }

    setLoading(true);

    try {
      const selectedSchool = schools.find((s) => s.id === formData.schoolId);
      
      const { verificationCode } = await registerStudent(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        schoolId: formData.schoolId,
        schoolName: selectedSchool?.name || "",
        sraId: formData.sraId,
        grade: formData.grade,
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
        shirtSize: formData.shirtSize as "XS" | "S" | "M" | "L" | "XL" | undefined,
      });

      sessionStorage.setItem("verificationCode", verificationCode);
      router.push("/verify");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
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
        <p className="text-sm text-gray-500 mb-2">
          Note: We recommend using a personal email address for this registration, as a school email address may block verification emails from us.
        </p>
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

      <div>
        <label htmlFor="grade" className="block text-sm font-medium mb-1 text-gray-900">
          Grade *
        </label>
        <select
          id="grade"
          value={formData.grade}
          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
        >
          <option value="">Select grade...</option>
          <option value="9">9th Grade</option>
          <option value="10">10th Grade</option>
          <option value="11">11th Grade</option>
          <option value="12">12th Grade</option>
        </select>
      </div>

      <div>
        <label htmlFor="school" className="block text-sm font-medium mb-1 text-gray-900">
          School *
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Note: if you do not see your school, it means that there is no Science Research Advisor currently registered at your school. Any member of your school&apos;s administration or faculty can register as a science research advisor, but they must be able to be present at the competition to chaperone your school&apos;s team. If there is an SRA registered at your school, make sure you contact them prior to registering so that they know to approve your registration.
        </p>
        <select
          id="school"
          value={formData.schoolId}
          onChange={(e) => {
            setFormData({
              ...formData,
              schoolId: e.target.value,
              sraId: "", 
            });
          }}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
        >
          <option value="">Select a school...</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
        {schools.length === 0 && !loading && (
          <p className="mt-2 text-sm text-gray-600">
            No schools with Science Research Advisors found. Please contact your school to register an advisor first.
          </p>
        )}
      </div>

      {formData.schoolId && (
        <div>
          <label htmlFor="sra" className="block text-sm font-medium mb-1 text-gray-900">
            Science Research Advisor *
          </label>
          {sras.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              No SRAs found for this school. Please contact your school to register an SRA first.
            </div>
          ) : (
            <select
              id="sra"
              value={formData.sraId}
              onChange={(e) => setFormData({ ...formData, sraId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
            >
              <option value="">Select your SRA...</option>
              {sras.map((sra) => (
                <option key={sra.id} value={sra.id}>
                  {sra.firstName} {sra.lastName} {sra.title ? `(${sra.title})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div>
        <label htmlFor="projectTitle" className="block text-sm font-medium mb-1 text-gray-900">
          Project Title *
        </label>
        <input
          id="projectTitle"
          type="text"
          value={formData.projectTitle}
          onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
        />
      </div>

      <div>
        <label htmlFor="projectDescription" className="block text-sm font-medium mb-1 text-gray-900">
          Please enter a brief description of your project (150 words max). *
        </label>
        <textarea
          id="projectDescription"
          value={formData.projectDescription}
          onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
          rows={4}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
        />
        <p className="mt-1 text-sm text-gray-500">
          Word count: {countWords(formData.projectDescription)} / 150
        </p>
      </div>

      <div>
        <label htmlFor="shirtSize" className="block text-sm font-medium mb-1 text-gray-900">
          Shirt Size *
        </label>
        <select
          id="shirtSize"
          value={formData.shirtSize}
          onChange={(e) => setFormData({ ...formData, shirtSize: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
        >
          <option value="">Select shirt size...</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || sras.length === 0}
        className="w-full bg-primary-green text-white py-3 px-4 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? "Registering..." : "REGISTER AS STUDENT"}
      </button>
    </form>
  );
}
