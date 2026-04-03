"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStudent, updateStudentGuests } from "@/lib/firebase/database";
import type { Guest } from "@/lib/firebase/database";

const MAX_GUESTS = 2;
const EMPTY_GUEST = (): Guest => ({ name: "", email: "", ticketSent: false });

export default function GuestRegistration() {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([EMPTY_GUEST(), EMPTY_GUEST()]);
  const [studentName, setStudentName] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingIdx, setSendingIdx] = useState<number | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    try {
      const s = await getStudent(user.uid);
      if (!s) return;
      setStudentName(`${s.firstName} ${s.lastName}`);
      setStudentSchool(s.schoolName || "");
      if (s.guests && s.guests.length > 0) {
        // Pad to MAX_GUESTS slots
        const padded = [...s.guests];
        while (padded.length < MAX_GUESTS) padded.push(EMPTY_GUEST());
        setGuests(padded);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (idx: number, field: "name" | "email", value: string) => {
    setGuests((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Save name+email for a slot (without sending ticket)
  const saveGuest = async (idx: number) => {
    if (!user) return;
    const g = guests[idx];
    if (!g.name.trim() || !g.email.trim()) {
      setMessage({ type: "err", text: "Please enter both a name and email before saving." });
      return;
    }
    setSavingIdx(idx);
    setMessage(null);
    try {
      const updated = guests.map((guest, i) =>
        i === idx ? { ...guest, name: g.name.trim(), email: g.email.trim() } : guest
      );
      // Only save slots with a name (skip empty trailing slots)
      const toSave = updated.filter((g) => g.name.trim());
      await updateStudentGuests(user.uid, toSave);
      setGuests(updated);
      setMessage({ type: "ok", text: "Guest info saved." });
    } catch (e: unknown) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setSavingIdx(null);
    }
  };

  const sendTicket = async (idx: number) => {
    if (!user) return;
    const g = guests[idx];
    if (!g.name.trim() || !g.email.trim()) {
      setMessage({ type: "err", text: "Please enter a name and email before sending the ticket." });
      return;
    }
    setSendingIdx(idx);
    setMessage(null);
    try {
      // Save to Firestore first
      const trimmed = { ...g, name: g.name.trim(), email: g.email.trim() };
      const updated = guests.map((guest, i) => (i === idx ? trimmed : guest));
      const toSave = updated.filter((g) => g.name.trim());
      await updateStudentGuests(user.uid, toSave);

      // Send the ticket email
      const res = await fetch("/api/send-guest-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: trimmed.name,
          guestEmail: trimmed.email,
          studentName,
          studentSchool,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send ticket");

      // Mark ticket as sent
      const withSent = updated.map((guest, i) =>
        i === idx ? { ...guest, ticketSent: true, sentAt: new Date() } : guest
      );
      const toSave2 = withSent.filter((g) => g.name.trim());
      await updateStudentGuests(user.uid, toSave2);
      setGuests(withSent);
      setMessage({ type: "ok", text: `Ticket sent to ${trimmed.email}!` });
    } catch (e: unknown) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Failed to send ticket." });
    } finally {
      setSendingIdx(null);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-primary-blue mb-1">Guest Registration</h2>
      <p className="text-sm text-gray-600 mb-5">
        Invite up to {MAX_GUESTS} guests (family, friends) to watch your presentation. Enter their name and email, then send them a guest pass by email. You can resend at any time.
      </p>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {guests.slice(0, MAX_GUESTS).map((guest, idx) => (
          <div key={idx} className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Guest {idx + 1}</p>
              {guest.ticketSent && (
                <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                  ✓ Ticket sent
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
                <input
                  type="text"
                  value={guest.name}
                  onChange={(e) => updateField(idx, "name", e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
                <input
                  type="email"
                  value={guest.email}
                  onChange={(e) => updateField(idx, "email", e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingIdx === idx || sendingIdx === idx}
                onClick={() => saveGuest(idx)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {savingIdx === idx ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={sendingIdx === idx || savingIdx === idx}
                onClick={() => sendTicket(idx)}
                className="px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {sendingIdx === idx
                  ? "Sending…"
                  : guest.ticketSent
                  ? "Resend ticket"
                  : "Send ticket"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
