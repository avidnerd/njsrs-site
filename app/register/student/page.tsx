"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import StudentRegistrationForm from "@/components/registration/StudentRegistrationForm";

export default function StudentRegistrationPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard/student");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-blue mb-2">
            Register as Student
          </h1>
          <p className="text-gray-600">
            Register to compete in the New Jersey Science Research Symposium. You must have a Science Research Advisor from your school.
          </p>
        </div>
        <StudentRegistrationForm />
      </div>
    </div>
  );
}
