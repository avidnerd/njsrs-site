"use client";

import { useState, useEffect } from "react";
import { loginUser } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && userProfile && loading) {
      setLoading(false);
    } else if (user && !userProfile && !authLoading && loading) {
      const uid = user.uid;
      setError(`User profile not found in Firestore. Your User UID is: ${uid}. Please ensure the document ID in the 'users' collection matches this UID exactly. Check the browser console for more details.`);
      setLoading(false);
    }
  }, [user, userProfile, authLoading, loading]);

  useEffect(() => {
    return () => {
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const timeoutId = setTimeout(() => {
      setError("Login is taking longer than expected. Please check the browser console (F12) to see your User UID and verify it matches the Firestore document ID.");
      setLoading(false);
    }, 5000);

    try {
      const result = await loginUser(email, password);
      console.log("Login successful, user UID:", result.user.uid);
      console.log("Please verify this UID matches your Firestore document ID exactly.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      setError(err.message || "Failed to log in");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600 text-center">
          Administrators: Use your admin email to log in
        </p>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
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
        <label htmlFor="password" className="block text-sm font-medium mb-1">
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
