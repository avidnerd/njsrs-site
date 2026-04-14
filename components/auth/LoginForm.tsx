"use client";

import { useState, useEffect } from "react";
import { loginUser, sendPasswordReset } from "@/lib/firebase/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && userProfile && loading) {
      setLoading(false);
    } else if (user && !userProfile && !authLoading && loading) {
      setError("Account not found. Please try refreshing the page. If the problem persists, contact the fair director.");
      setLoading(false);
    }
  }, [user, userProfile, authLoading, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      // Loading will be cleared by the useEffect once AuthContext resolves the profile
    } catch (err: any) {
      setError(err.message || "Failed to log in");
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSending(true);
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      // Don't reveal whether the email exists; show a generic success message instead
      setResetSent(true);
    } finally {
      setResetSending(false);
    }
  };

  if (resetMode) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        {resetSent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-md text-sm">
              If an account exists for <strong>{resetEmail}</strong>, a password reset link has been sent. Check your inbox (and spam folder).
            </div>
            <button
              type="button"
              onClick={() => { setResetMode(false); setResetSent(false); setResetEmail(""); }}
              className="w-full bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Reset your password</h3>
              <p className="text-sm text-gray-600">Enter your email address and we&apos;ll send you a link to reset your password.</p>
            </div>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium mb-1 text-gray-900">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
            </div>
            {resetError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {resetError}
              </div>
            )}
            <button
              type="submit"
              disabled={resetSending}
              className="w-full bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen disabled:opacity-50"
            >
              {resetSending ? "Sending…" : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={() => { setResetMode(false); setResetError(""); }}
              className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600 text-center">
          Administrators: Use your admin email to log in
        </p>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-900">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-900">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
        />
      </div>
      <div className="text-right">
        <button
          type="button"
          onClick={() => { setResetMode(true); setResetEmail(email); }}
          className="text-sm text-primary-blue hover:underline"
        >
          Forgot password?
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Logging in..." : "LOG IN"}
      </button>
    </form>
  );
}
