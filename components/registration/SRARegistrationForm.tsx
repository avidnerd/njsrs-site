"use client";

import { useState, useEffect } from "react";
import { registerSRA } from "@/lib/firebase/registration";
import { getAllSchools, searchSchools, createSchool } from "@/lib/firebase/database";
import { useRouter } from "next/navigation";
import type { School } from "@/lib/firebase/database";

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
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [showNewSchool, setShowNewSchool] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const allSchools = await getAllSchools();
      setSchools(allSchools);
    } catch (err) {
      console.error("Error loading schools:", err);
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!formData.schoolId && !formData.schoolName) {
      setError("Please select or create a school");
      return;
    }

    setLoading(true);

    try {
      let schoolId = formData.schoolId;
      
      if (!schoolId && formData.schoolName) {
        schoolId = await createSchool({
          name: formData.schoolName,
        });
      }

      const { verificationCode } = await registerSRA(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        schoolId: schoolId!,
        schoolName: formData.schoolName || schools.find(s => s.id === schoolId)?.name || "",
        phone: formData.phone,
        title: formData.title,
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
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
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
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Science Teacher, Administrator"
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
            <input
              type="text"
              placeholder="Search for your school..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent mb-2"
            />
            <select
              value={formData.schoolId}
              onChange={(e) => {
                const selected = schools.find((s) => s.id === e.target.value);
                setFormData({
                  ...formData,
                  schoolId: e.target.value,
                  schoolName: selected?.name || "",
                });
              }}
              required={!showNewSchool}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
            >
              <option value="">Select a school...</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="newSchoolName" className="block text-sm font-medium mb-1">
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
