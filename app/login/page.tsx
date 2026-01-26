"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && userProfile) {
      // Redirect based on role
      switch (userProfile.role) {
        case "sra":
          router.push("/dashboard/sra");
          break;
        case "student":
          router.push("/dashboard/student");
          break;
        case "judge":
          router.push("/dashboard/judge");
          break;
        default:
          router.push("/");
      }
    }
  }, [user, userProfile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in to your account
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
