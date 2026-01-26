"use client";

import { useState } from "react";
import { registerJudge } from "@/lib/firebase/registration";
import { useRouter } from "next/navigation";

export default function JudgeRegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    qualifications: "",
    affiliation: "",
    expertise: [] as string[],
  });
  const [expertiseInput, setExpertiseInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const expertiseOptions = [
    "Biology",
    "Chemistry",
    "Physics",
    "Mathematics",
    "Computer Science",
    "Engineering",
    "Environmental Science",
    "Medicine",
    "Other",
  ];

  const handleAddExpertise = () => {
    if (expertiseInput && !formData.expertise.includes(expertiseInput)) {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, expertiseInput],
      });
      setExpertiseInput("");
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter((e) => e !== item),
    });
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

    setLoading(true);

    try {
      await registerJudge(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        qualifications: formData.qualifications,
        affiliation: formData.affiliation,
        expertise: formData.expertise,
      });

      router.push("/dashboard/judge");
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
        <label htmlFor="qualifications" className="block text-sm font-medium mb-1">
          Qualifications *
        </label>
        <textarea
          id="qualifications"
          value={formData.qualifications}
          onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
          required
          rows={3}
          placeholder="e.g., Ph.D. in Biology, 10 years of research experience..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="affiliation" className="block text-sm font-medium mb-1">
          Affiliation
        </label>
        <input
          id="affiliation"
          type="text"
          value={formData.affiliation}
          onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
          placeholder="e.g., Rutgers University, Johnson & Johnson..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="expertise" className="block text-sm font-medium mb-1">
          Areas of Expertise
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={expertiseInput}
            onChange={(e) => setExpertiseInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddExpertise();
              }
            }}
            placeholder="Add expertise area..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddExpertise}
            className="bg-primary-green text-white px-4 py-2 rounded-md hover:bg-primary-darkGreen"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.expertise.map((item) => (
            <span
              key={item}
              className="bg-primary-blue text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveExpertise(item)}
                className="hover:text-red-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
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
        {loading ? "Registering..." : "REGISTER AS JUDGE"}
      </button>
    </form>
  );
}
