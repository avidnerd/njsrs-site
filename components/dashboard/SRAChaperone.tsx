"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSRA, updateSRAChaperone } from "@/lib/firebase/database";
import type { SRA, Chaperone } from "@/lib/firebase/database";

export default function SRAChaperone() {
  const { user } = useAuth();
  const [sraData, setSraData] = useState<SRA | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [chaperoneName, setChaperoneName] = useState("");
  const [chaperonePhone, setChaperonePhone] = useState("");
  const [chaperoneEmail, setChaperoneEmail] = useState("");

  useEffect(() => {
    if (user) {
      loadSRAData();
    }
  }, [user]);

  const loadSRAData = async () => {
    if (!user) return;
    
    try {
      const sra = await getSRA(user.uid);
      setSraData(sra);
      if (sra?.chaperone) {
        setChaperoneName(sra.chaperone.name || "");
        setChaperonePhone(sra.chaperone.phone || "");
        setChaperoneEmail(sra.chaperone.email || "");
      }
    } catch (error) {
      console.error("Error loading SRA data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !sraData) return;
    
    if (!chaperoneName.trim() || !chaperonePhone.trim() || !chaperoneEmail.trim()) {
      setError("Please fill in all chaperone fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(chaperoneEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const chaperone: Chaperone = {
        name: chaperoneName.trim(),
        phone: chaperonePhone.trim(),
        email: chaperoneEmail.trim(),
        inviteSent: sraData.chaperone?.inviteSent || false,
        inviteToken: sraData.chaperone?.inviteToken,
        confirmed: sraData.chaperone?.confirmed || false,
        confirmationDate: sraData.chaperone?.confirmationDate,
        signature: sraData.chaperone?.signature,
      };

      await updateSRAChaperone(user.uid, chaperone);
      await loadSRAData();
      setSuccess("Chaperone information saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to save chaperone information");
      console.error("Error saving chaperone:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!user || !sraData) return;
    
    if (!chaperoneName.trim() || !chaperonePhone.trim() || !chaperoneEmail.trim()) {
      setError("Please save chaperone information first");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/send-chaperone-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sraId: user.uid,
          schoolName: sraData.schoolName,
          chaperoneName: chaperoneName.trim(),
          chaperoneEmail: chaperoneEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      await loadSRAData();
      setSuccess("Invitation sent to chaperone successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        School Chaperone
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Designate a chaperone who will supervise all students from your school at the event.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="chaperoneName" className="block text-sm font-medium mb-1 text-gray-900">
            Chaperone Name *
          </label>
          <input
            id="chaperoneName"
            type="text"
            value={chaperoneName}
            onChange={(e) => setChaperoneName(e.target.value)}
            placeholder="Enter chaperone's full name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="chaperonePhone" className="block text-sm font-medium mb-1 text-gray-900">
            Phone Number *
          </label>
          <input
            id="chaperonePhone"
            type="tel"
            value={chaperonePhone}
            onChange={(e) => setChaperonePhone(e.target.value)}
            placeholder="Enter phone number"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="chaperoneEmail" className="block text-sm font-medium mb-1 text-gray-900">
            Email Address *
          </label>
          <input
            id="chaperoneEmail"
            type="email"
            value={chaperoneEmail}
            onChange={(e) => setChaperoneEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-green focus:border-transparent text-gray-900"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {sraData?.chaperone?.confirmed && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold text-green-800">Chaperone Confirmed</span>
            </div>
            <p className="text-sm text-green-700">
              {sraData.chaperone.name} has confirmed they will supervise all students from {sraData.schoolName}.
            </p>
            {sraData.chaperone.confirmationDate && (
              <p className="text-xs text-green-600 mt-1">
                Confirmed on: {sraData.chaperone.confirmationDate instanceof Date
                  ? sraData.chaperone.confirmationDate.toLocaleDateString()
                  : sraData.chaperone.confirmationDate.toDate
                  ? sraData.chaperone.confirmationDate.toDate().toLocaleDateString()
                  : new Date(sraData.chaperone.confirmationDate.seconds * 1000).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {sraData?.chaperone?.inviteSent && !sraData?.chaperone?.confirmed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              Invitation sent to {sraData.chaperone.email}. Waiting for confirmation.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-primary-blue text-white py-2 px-4 rounded-md hover:bg-primary-darkBlue disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {saving ? "Saving..." : "Save Chaperone Info"}
          </button>
          {chaperoneName && chaperonePhone && chaperoneEmail && (
            <button
              onClick={handleSendInvitation}
              disabled={sending || sraData?.chaperone?.inviteSent}
              className="flex-1 bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {sending ? "Sending..." : sraData?.chaperone?.inviteSent ? "Invitation Sent" : "Send Confirmation Email"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
