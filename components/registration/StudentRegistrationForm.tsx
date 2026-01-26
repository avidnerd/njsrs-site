"use client";

import { useState, useEffect } from "react";
import { registerStudent } from "@/lib/firebase/registration";
import { getAllSchools, searchSchools, getSRAsBySchool } from "@/lib/firebase/database";
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
    schoolId: "",
    sraId: "",
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [sras, setSRAs] = useState<SRA[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      setError(""); // Clear error when school is deselected
    }
  }, [formData.schoolId]);

  const loadSchools = async () => {
    try {
      const allSchools = await getAllSchools();
      setSchools(allSchools);
    } catch (err) {
      console.error("Error loading schools:", err);
    }
  };

  const loadSRAs = async () => {
    try {
      const schoolSRAs = await getSRAsBySchool(formData.schoolId);
      setSRAs(schoolSRAs);
      if (schoolSRAs.length === 0) {
        setError("No Science Research Advisors found for this school. Please contact your school to register an SRA first.");
      } else {
        setError(""); // Clear error when SRAs are successfully loaded
      }
    } catch (err) {
      console.error("Error loading SRAs:", err);
      setError("Error loading SRAs for this school");
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 0) {
      try {
        const results = await searchSchools(term);
        setSchools(results);
      } catch (err) {
        console.error("Error searching schools:", err);
      }
    } else {
      loadSchools();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
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

    setLoading(true);

    try {
      const selectedSchool = schools.find((s) => s.id === formData.schoolId);
      
      await registerStudent(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        schoolId: formData.schoolId,
        schoolName: selectedSchool?.name || "",
        sraId: formData.sraId,
        grade: formData.grade,
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
      });

      router.push("/register/student/pending");
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
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
            First Name *
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
            Last Name *
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email *
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password *
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="grade" className="block text-sm font-medium mb-1">
          Grade *
        </label>
        <select
          id="grade"
          value={formData.grade}
          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
        >
          <option value="">Select grade...</option>
          <option value="9">9th Grade</option>
          <option value="10">10th Grade</option>
          <option value="11">11th Grade</option>
          <option value="12">12th Grade</option>
        </select>
      </div>

      <div>
        <label htmlFor="school" className="block text-sm font-medium mb-1">
          School *
        </label>
        <input
          type="text"
          placeholder="Search for your school..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent mb-2"
        />
        <select
          id="school"
          value={formData.schoolId}
          onChange={(e) => {
            setFormData({
              ...formData,
              schoolId: e.target.value,
              sraId: "", // Reset SRA when school changes
            });
          }}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
        >
          <option value="">Select a school...</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      {formData.schoolId && (
        <div>
          <label htmlFor="sra" className="block text-sm font-medium mb-1">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
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
        <label htmlFor="projectTitle" className="block text-sm font-medium mb-1">
          Project Title
        </label>
        <input
          id="projectTitle"
          type="text"
          value={formData.projectTitle}
          onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="projectDescription" className="block text-sm font-medium mb-1">
          Project Description
        </label>
        <textarea
          id="projectDescription"
          value={formData.projectDescription}
          onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
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
