"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SRARegistrationForm from "@/components/registration/SRARegistrationForm";

export default function SRARegistrationPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard/sra");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-blue mb-2">
            Register as Science Research Advisor
          </h1>
          <p className="text-gray-600">
            Each school must have an SRA for students to register. Register your school first.
          </p>
        </div>
        <SRARegistrationForm />
      </div>
    </div>
  );
}
