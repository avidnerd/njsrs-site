"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import EmailVerification from "@/components/auth/EmailVerification";

export default function VerifyPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && userProfile?.emailVerified) {
      router.push("/dashboard");
    } else if (!user) {
      router.push("/login");
    }
  }, [user, userProfile, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification code to {user.email}
          </p>
        </div>
        <EmailVerification />
      </div>
    </div>
  );
}
