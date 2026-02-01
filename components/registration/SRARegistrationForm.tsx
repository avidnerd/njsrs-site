"use client";

import { useState, useEffect } from "react";
import { registerSRA } from "@/lib/firebase/registration";
import { createSchool } from "@/lib/firebase/database";
import { useRouter } from "next/navigation";
import { loadAllSchools, searchSchools as searchSchoolsCSV, type SchoolData } from "@/lib/schools";

export default function SRARegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    title: "",
    schoolName: "",
    schoolId: "",
    selectedSchool: null as SchoolData | null,
  });
  const [allSchools, setAllSchools] = useState<SchoolData[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolData[]>([]);
  const [showNewSchool, setShowNewSchool] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoadingSchools(true);
      const schools = await loadAllSchools();
      setAllSchools(schools);
      setFilteredSchools([]);
    } catch (err) {
      console.error("Error loading schools:", err);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      const results = searchSchoolsCSV(allSchools, term);
      setFilteredSchools(results);
    } else {
      setFilteredSchools([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all required fields
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

    // Email validation
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

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError("Please enter a valid phone number");
      return;
    }

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.selectedSchool && !formData.schoolName.trim()) {
      setError("Please select or create a school");
      return;
    }

    setLoading(true);

    try {
      let schoolId = formData.schoolId;
      let schoolName = formData.schoolName;
      
      // Create or get school BEFORE authentication
      if (formData.selectedSchool) {
        schoolName = formData.selectedSchool.name;
        // Create school in Firestore (allowed without auth now)
        schoolId = await createSchool({
          name: formData.selectedSchool.name,
          address: formData.selectedSchool.address || `${formData.selectedSchool.city}, ${formData.selectedSchool.state} ${formData.selectedSchool.zip}`,
        });
      } else if (formData.schoolName) {
        // Create new school
        schoolId = await createSchool({
          name: formData.schoolName,
        });
        schoolName = formData.schoolName;
      }

      // Now register the user (this authenticates them)
      const { verificationCode } = await registerSRA(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        schoolId: schoolId!,
        schoolName: schoolName,
        phone: formData.phone,
        title: formData.title,
      });

      sessionStorage.setItem("verificationCode", verificationCode);
      router.push("/verify");
    } catch (err: any) {
      console.error("SRA Registration Error:", err);
      const errorMessage = err.message || "Registration failed";
      if (errorMessage.includes("permission") || errorMessage.includes("Permission")) {
        setError("Registration failed due to permissions. Please ensure you are logged in and try again. If the problem persists, please contact support.");
      } else {
        setError(errorMessage);
      }
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-900">
            Phone *
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1 text-gray-900">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Science Teacher, Administrator"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={() => setShowNewSchool(false)}
            className={`px-4 py-2 rounded-md ${
              !showNewSchool
                ? "bg-primary-green text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Select Existing School
          </button>
          <button
            type="button"
            onClick={() => setShowNewSchool(true)}
            className={`px-4 py-2 rounded-md ${
              showNewSchool
                ? "bg-primary-green text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Create New School
          </button>
        </div>

        {!showNewSchool ? (
          <div>
            <label htmlFor="schoolSearch" className="block text-sm font-medium mb-1 text-gray-900">
              Search for your school *
            </label>
            <input
              id="schoolSearch"
              type="text"
              placeholder="Type to search for your school..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900 mb-2"
            />
            {loadingSchools && (
              <p className="text-sm text-gray-500 mb-2">Loading schools...</p>
            )}
            {filteredSchools.length > 0 && (
              <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                {filteredSchools.map((school, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        selectedSchool: school,
                        schoolName: school.name,
                        schoolId: "",
                      });
                      setSearchTerm(school.name);
                      setFilteredSchools([]);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      formData.selectedSchool?.name === school.name ? "bg-primary-green bg-opacity-10" : ""
                    }`}
                  >
                    <div className="font-medium text-gray-900">{school.name}</div>
                    <div className="text-sm text-gray-600">
                      {school.city}, {school.state} {school.zip}
                      {school.district && ` • ${school.district}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {formData.selectedSchool && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="font-medium text-gray-900">Selected: {formData.selectedSchool.name}</div>
                <div className="text-sm text-gray-600">
                  {formData.selectedSchool.city}, {formData.selectedSchool.state} {formData.selectedSchool.zip}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, selectedSchool: null, schoolName: "", schoolId: "" });
                    setSearchTerm("");
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="newSchoolName" className="block text-sm font-medium mb-1 text-gray-900">
              School Name *
            </label>
            <input
              id="newSchoolName"
              type="text"
              value={formData.schoolName}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  schoolName: e.target.value,
                  schoolId: "",
                });
              }}
              required={showNewSchool}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-green text-white py-3 px-4 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? "Registering..." : "REGISTER AS SRA"}
      </button>
    </form>
  );
}
