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
    primaryScientificDomain: [] as string[],
    experimentalMethodology: [] as string[],
    primaryRealWorldFocus: "",
    primaryRealWorldFocusOther: "",
    isTeamProject: false,
    teamMemberFirstName: "",
    teamMemberLastName: "",
    teamMemberEmail: "",
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

    if (!formData.primaryScientificDomain || formData.primaryScientificDomain.length === 0) {
      setError("Please select at least one primary scientific domain");
      return;
    }

    if (formData.primaryScientificDomain.length > 2) {
      setError("Please select no more than two primary scientific domains");
      return;
    }

    if (!formData.experimentalMethodology || formData.experimentalMethodology.length === 0) {
      setError("Please select at least one experimental methodology");
      return;
    }

    if (!formData.primaryRealWorldFocus) {
      setError("Please select a primary real-world focus");
      return;
    }

    if (formData.primaryRealWorldFocus === "Other" && !formData.primaryRealWorldFocusOther.trim()) {
      setError("Please specify the other real-world focus");
      return;
    }

    if (formData.isTeamProject) {
      if (!formData.teamMemberFirstName.trim()) {
        setError("Team member first name is required for team projects");
        return;
      }
      if (!formData.teamMemberLastName.trim()) {
        setError("Team member last name is required for team projects");
        return;
      }
      if (!formData.teamMemberEmail.trim()) {
        setError("Team member email is required for team projects");
        return;
      }
      const teamEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!teamEmailRegex.test(formData.teamMemberEmail)) {
        setError("Please enter a valid team member email address");
        return;
      }
      if (formData.teamMemberEmail.toLowerCase() === formData.email.toLowerCase()) {
        setError("Team member email must be different from your email");
        return;
      }
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
        primaryScientificDomain: formData.primaryScientificDomain,
        experimentalMethodology: formData.experimentalMethodology,
        primaryRealWorldFocus: formData.primaryRealWorldFocus === "Other" ? formData.primaryRealWorldFocusOther : formData.primaryRealWorldFocus,
        isTeamProject: formData.isTeamProject,
        teamMemberFirstName: formData.isTeamProject ? formData.teamMemberFirstName : undefined,
        teamMemberLastName: formData.isTeamProject ? formData.teamMemberLastName : undefined,
        teamMemberEmail: formData.isTeamProject ? formData.teamMemberEmail : undefined,
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

      <div className="border rounded-lg p-4 bg-blue-50">
        <div className="flex items-center mb-4">
          <input
            id="isTeamProject"
            type="checkbox"
            checked={formData.isTeamProject}
            onChange={(e) => setFormData({ ...formData, isTeamProject: e.target.checked, teamMemberFirstName: "", teamMemberLastName: "", teamMemberEmail: "" })}
            className="h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
          />
          <label htmlFor="isTeamProject" className="ml-2 block text-sm font-medium text-gray-900">
            This is a team project (maximum 2 people)
          </label>
        </div>
        {formData.isTeamProject && (
          <div className="space-y-4 mt-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> You and your team member will share the same password. Both team members can log in with their own email addresses to access the same student portal. When you verify your email, your team member will be automatically verified as well.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="teamMemberFirstName" className="block text-sm font-medium mb-1 text-gray-900">
                  Team Member First Name *
                </label>
                <input
                  id="teamMemberFirstName"
                  type="text"
                  value={formData.teamMemberFirstName}
                  onChange={(e) => setFormData({ ...formData, teamMemberFirstName: e.target.value })}
                  required={formData.isTeamProject}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="teamMemberLastName" className="block text-sm font-medium mb-1 text-gray-900">
                  Team Member Last Name *
                </label>
                <input
                  id="teamMemberLastName"
                  type="text"
                  value={formData.teamMemberLastName}
                  onChange={(e) => setFormData({ ...formData, teamMemberLastName: e.target.value })}
                  required={formData.isTeamProject}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            <div>
              <label htmlFor="teamMemberEmail" className="block text-sm font-medium mb-1 text-gray-900">
                Team Member Email *
              </label>
              <input
                id="teamMemberEmail"
                type="email"
                value={formData.teamMemberEmail}
                onChange={(e) => setFormData({ ...formData, teamMemberEmail: e.target.value })}
                required={formData.isTeamProject}
                placeholder="teammate@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your team member will use this email and the same password to log in.
              </p>
            </div>
          </div>
        )}
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

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-xl font-semibold text-primary-blue mb-4">Project Classification</h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-900">
            1. Primary Scientific Domain *
          </label>
          <p className="text-sm text-gray-500 mb-3">Select up to TWO primary domains that best represent your project.</p>
          <div className="space-y-2">
            {[
              "Life Sciences (Biology, Microbiology, Neuroscience, Medicine, Biochemistry)",
              "Physical Sciences (Physics, Chemistry, Materials Science, Astronomy)",
              "Engineering & Technology (Mechanical, Electrical, Civil, Biomedical, Robotics)",
              "Computer Science & Artificial Intelligence",
              "Environmental & Earth Sciences (Ecology, Climate, Geology, Atmospheric Science)",
              "Mathematics",
              "Social & Behavioral Sciences (Psychology, Sociology, Behavioral Studies)",
            ].map((domain) => (
              <label key={domain} className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.primaryScientificDomain.includes(domain)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (formData.primaryScientificDomain.length < 2) {
                        setFormData({
                          ...formData,
                          primaryScientificDomain: [...formData.primaryScientificDomain, domain],
                        });
                      }
                    } else {
                      setFormData({
                        ...formData,
                        primaryScientificDomain: formData.primaryScientificDomain.filter((d) => d !== domain),
                      });
                    }
                  }}
                  className="mt-1 h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{domain}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected: {formData.primaryScientificDomain.length} / 2
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-900">
            3. Experimental Methodology Used *
          </label>
          <p className="text-sm text-gray-500 mb-3">Select all that apply.</p>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Experimental / Lab-Based:</p>
              <div className="space-y-2 ml-4">
                {[
                  "Wet lab experimentation (biological or chemical testing)",
                  "Physical experimentation (physics/material testing)",
                  "Environmental or field data collection",
                ].map((method) => (
                  <label key={method} className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.experimentalMethodology.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            experimentalMethodology: [...formData.experimentalMethodology, method],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            experimentalMethodology: formData.experimentalMethodology.filter((m) => m !== method),
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Engineering / Applied Testing:</p>
              <div className="space-y-2 ml-4">
                {[
                  "Engineering prototype built and physically tested",
                  "Device performance testing with measurable output",
                  "Hardware construction with experimental validation",
                ].map((method) => (
                  <label key={method} className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.experimentalMethodology.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            experimentalMethodology: [...formData.experimentalMethodology, method],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            experimentalMethodology: formData.experimentalMethodology.filter((m) => m !== method),
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Computational / Data-Driven:</p>
              <div className="space-y-2 ml-4">
                {[
                  "Computational modeling with experimental validation",
                  "Machine learning model",
                  "Statistical analysis",
                  "Simulation",
                ].map((method) => (
                  <label key={method} className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.experimentalMethodology.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            experimentalMethodology: [...formData.experimentalMethodology, method],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            experimentalMethodology: formData.experimentalMethodology.filter((m) => m !== method),
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Human Subjects Research:</p>
              <div className="space-y-2 ml-4">
                {[
                  "Controlled behavioral experiment",
                  "Survey study",
                ].map((method) => (
                  <label key={method} className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.experimentalMethodology.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            experimentalMethodology: [...formData.experimentalMethodology, method],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            experimentalMethodology: formData.experimentalMethodology.filter((m) => m !== method),
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="primaryRealWorldFocus" className="block text-sm font-medium mb-2 text-gray-900">
            5. Primary Real-World Focus *
          </label>
          <p className="text-sm text-gray-500 mb-3">What real-world problem or scientific objective does your experiment address?</p>
          <select
            id="primaryRealWorldFocus"
            value={formData.primaryRealWorldFocus}
            onChange={(e) => setFormData({ ...formData, primaryRealWorldFocus: e.target.value, primaryRealWorldFocusOther: "" })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
          >
            <option value="">Select a focus...</option>
            <option value="Healthcare / Disease">Healthcare / Disease</option>
            <option value="Environmental Sustainability / Climate">Environmental Sustainability / Climate</option>
            <option value="Energy Systems">Energy Systems</option>
            <option value="Agriculture / Food Systems">Agriculture / Food Systems</option>
            <option value="Infrastructure / Engineering Systems">Infrastructure / Engineering Systems</option>
            <option value="Accessibility / Assistive Technology">Accessibility / Assistive Technology</option>
            <option value="Education">Education</option>
            <option value="Public Safety / Cybersecurity">Public Safety / Cybersecurity</option>
            <option value="Fundamental Scientific Advancement">Fundamental Scientific Advancement</option>
            <option value="Theoretical Mathematics/Physics">Theoretical Mathematics/Physics</option>
            <option value="Other">Other (please specify)</option>
          </select>
          {formData.primaryRealWorldFocus === "Other" && (
            <input
              type="text"
              value={formData.primaryRealWorldFocusOther}
              onChange={(e) => setFormData({ ...formData, primaryRealWorldFocusOther: e.target.value })}
              placeholder="Please specify..."
              required
              className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
            />
          )}
        </div>
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
