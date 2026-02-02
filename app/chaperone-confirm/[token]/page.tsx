"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";

interface ChaperoneData {
  sraId: string;
  schoolName: string;
  chaperoneName: string;
  chaperoneEmail: string;
  confirmed: boolean;
}

export default function ChaperoneConfirmPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ChaperoneData | null>(null);
  const [signature, setSignature] = useState("");

  useEffect(() => {
    if (token) {
      loadFormData();
    }
  }, [token]);

  const loadFormData = async () => {
    try {
      const response = await fetch(`/api/chaperone-form?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load form");
      }

      if (data.confirmed) {
        setSuccess(true);
      }

      setFormData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!signature.trim()) {
      setError("Please provide your signature");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/chaperone-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit confirmation");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit confirmation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-600 font-semibold mb-2">Error</div>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirmation Submitted</h2>
            <p className="text-gray-700 mb-2">
              Thank you for confirming your role as chaperone for <strong>{formData?.schoolName}</strong>.
            </p>
            <p className="text-gray-700">
              You have confirmed that you will supervise all students from this school at the New Jersey Science Research Symposium.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary-blue mb-2">
              Chaperone Confirmation
            </h1>
            <p className="text-gray-600">
              Confirm your role as chaperone for <strong>{formData?.schoolName}</strong>
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">Your Responsibilities</h3>
            <p className="text-sm text-blue-800 mb-2">
              As the designated chaperone for <strong>{formData?.schoolName}</strong>, you will be responsible for:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Supervising all students from {formData?.schoolName} during the event</li>
              <li>Ensuring student safety and appropriate behavior</li>
              <li>Being present and available throughout the competition</li>
              <li>Coordinating with event staff as needed</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="signature" className="block text-sm font-medium mb-1 text-gray-900">
                Your Signature *
              </label>
              <input
                id="signature"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name to sign"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                By signing, you confirm that you will serve as the chaperone and supervise all students from {formData?.schoolName}.
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !signature.trim()}
              className="w-full bg-primary-green text-white py-3 px-4 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? "Submitting..." : "Confirm Chaperone Role"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
