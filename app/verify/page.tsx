"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import EmailVerification from "@/components/auth/EmailVerification";

export default function VerifyPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState("");
  const [changeEmailSuccess, setChangeEmailSuccess] = useState(false);

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

  useEffect(() => {
    if (user && userProfile?.emailVerified) {
      router.push(getDashboardPath());
    } else if (!user) {
      router.push("/login");
    }
  }, [user, userProfile, router]);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeEmailError("");
    setChangeEmailSuccess(false);
    setChangingEmail(true);

    if (!user) {
      setChangeEmailError("You must be logged in to change your email");
      setChangingEmail(false);
      return;
    }

    if (!newEmail.trim()) {
      setChangeEmailError("Please enter a new email address");
      setChangingEmail(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setChangeEmailError("Please enter a valid email address");
      setChangingEmail(false);
      return;
    }

    try {
      const response = await fetch("/api/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, newEmail: newEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change email");
      }

      setChangeEmailSuccess(true);
      setNewEmail("");
      setShowChangeEmail(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setChangeEmailError(err.message || "Failed to change email");
    } finally {
      setChangingEmail(false);
    }
  };

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
            We sent a verification code to {user.email}. Check your spam folder if you don't see it in your inbox! Refresh your page after entering the code.
          </p>
        </div>
        <EmailVerification />
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          {!showChangeEmail ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Still not seeing the verification code?
              </p>
              <button
                type="button"
                onClick={() => setShowChangeEmail(true)}
                className="text-sm text-primary-blue hover:text-primary-darkBlue underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium mb-1 text-gray-900">
                  New Email Address
                </label>
                <input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  All your information will remain the same, only your email address will be updated.
                </p>
              </div>
              {changeEmailError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                  {changeEmailError}
                </div>
              )}
              {changeEmailSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                  Email updated successfully! A new verification code has been sent to your new email address. Refreshing...
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={changingEmail || !newEmail.trim()}
                  className="flex-1 bg-primary-blue text-white py-2 px-4 rounded-md hover:bg-primary-darkBlue disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                >
                  {changingEmail ? "Updating..." : "Update Email"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangeEmail(false);
                    setNewEmail("");
                    setChangeEmailError("");
                    setChangeEmailSuccess(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
