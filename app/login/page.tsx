"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (!userProfile && !loading) {
        return;
      }

      if (userProfile) {
        // Check email verification for all roles except admins
        if (userProfile.role !== "fair_director" && userProfile.role !== "website_manager" && !userProfile.emailVerified) {
          router.push("/verify");
          return;
        }

        // Only redirect to dashboard if email is verified (or admin)
        if (userProfile.emailVerified || userProfile.role === "fair_director" || userProfile.role === "website_manager") {
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
            case "fair_director":
            case "website_manager":
              router.push("/dashboard/admin");
              break;
            default:
              router.push("/");
          }
        } else {
          router.push("/verify");
        }
      }
    }
  }, [user, userProfile, router, loading]);

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
