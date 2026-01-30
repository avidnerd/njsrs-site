"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { verifyEmailCode } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

export default function EmailVerification() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const getDashboardPath = () => {
    if (!userProfile) return "/";
    switch (userProfile.role) {
      case "sra":
        return "/dashboard/sra";
      case "student":
        return "/dashboard/student";
      case "judge":
        return "/dashboard/judge";
      case "fair_director":
      case "website_manager":
        return "/dashboard/admin";
      default:
        return "/";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!user) {
      setError("You must be logged in to verify your email");
      setLoading(false);
      return;
    }

    try {
      const isValid = await verifyEmailCode(user.uid, code);
      if (isValid) {
        setVerified(true);
        setTimeout(() => {
          router.push(getDashboardPath());
        }, 2000);
      } else {
        setError("Invalid or expired verification code. Please check your email and try again.");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 font-semibold mb-2">✓ Email Verified!</div>
        <p className="text-green-700">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium mb-1 text-gray-900">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter 6-digit code"
          required
          maxLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-center text-2xl tracking-widest text-gray-900"
        />
        <p className="text-sm text-gray-600 mt-2">
          Check your email for the verification code we sent you.
        </p>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? "Verifying..." : "Verify Email"}
      </button>
    </form>
  );
}
