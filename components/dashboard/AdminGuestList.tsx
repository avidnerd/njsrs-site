"use client";

import { useState, useEffect } from "react";
import { getAllStudents, addAdminGuest, markAdminGuestTicketSent, getAllAdminGuests } from "@/lib/firebase/database";
import type { Student, Guest, AdminGuest } from "@/lib/firebase/database";
import { Timestamp } from "firebase/firestore";

interface GuestRow {
  guest: Guest;
  student: Student;
}

function formatDate(date: any): string {
  if (!date) return "";
  if (date instanceof Date) return date.toLocaleDateString();
  if (date instanceof Timestamp) return date.toDate().toLocaleDateString();
  if (typeof date === "object" && "seconds" in date)
    return new Date(date.seconds * 1000).toLocaleDateString();
  return "";
}

export default function AdminGuestList() {
  const [rows, setRows] = useState<GuestRow[]>([]);
  const [adminGuests, setAdminGuests] = useState<AdminGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [students, ag] = await Promise.all([getAllStudents(), getAllAdminGuests()]);
      const allRows: GuestRow[] = [];
      for (const student of students) {
        for (const guest of student.guests ?? []) {
          allRows.push({ guest, student });
        }
      }
      setRows(allRows);
      setAdminGuests(ag.sort((a, b) => {
        const ta = a.createdAt instanceof Timestamp ? a.createdAt.seconds : 0;
        const tb = b.createdAt instanceof Timestamp ? b.createdAt.seconds : 0;
        return tb - ta;
      }));
    } catch (error) {
      console.error("Error loading guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    const email = newEmail.trim();
    if (!name || !email) return;
    setCreating(true);
    setCreateMsg(null);
    try {
      const id = await addAdminGuest(name, email);
      // Send ticket immediately
      const res = await fetch("/api/send-guest-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name,
          guestEmail: email,
          studentName: "NJSRS Administration",
          studentSchool: "",
        }),
      });
      if (res.ok) {
        await markAdminGuestTicketSent(id);
        setCreateMsg({ type: "success", text: `Guest pass sent to ${email}.` });
      } else {
        const err = await res.json();
        setCreateMsg({ type: "error", text: `Created but email failed: ${err.error ?? "unknown error"}` });
      }
      setNewName("");
      setNewEmail("");
      await loadAll();
    } catch (e: any) {
      setCreateMsg({ type: "error", text: e.message ?? "Failed to create guest pass." });
    } finally {
      setCreating(false);
    }
  };

  const handleResend = async (guest: AdminGuest) => {
    if (!guest.id) return;
    setSendingId(guest.id);
    try {
      const res = await fetch("/api/send-guest-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guest.name,
          guestEmail: guest.email,
          studentName: "NJSRS Administration",
          studentSchool: "",
        }),
      });
      if (res.ok) {
        await markAdminGuestTicketSent(guest.id);
        setAdminGuests((prev) =>
          prev.map((g) => g.id === guest.id ? { ...g, ticketSent: true, sentAt: Timestamp.now() } : g)
        );
      } else {
        alert("Failed to resend ticket.");
      }
    } catch {
      alert("Failed to resend ticket.");
    } finally {
      setSendingId(null);
    }
  };

  const filteredRows = rows.filter((row) => {
    const q = search.toLowerCase();
    return (
      row.guest.name.toLowerCase().includes(q) ||
      row.guest.email.toLowerCase().includes(q) ||
      `${row.student.firstName} ${row.student.lastName}`.toLowerCase().includes(q) ||
      row.student.schoolName.toLowerCase().includes(q)
    );
  });

  const filteredAdmin = adminGuests.filter((g) => {
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">

      {/* ── Create admin guest pass ── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Issue a guest pass</h3>
        <p className="text-sm text-gray-500 mb-4">
          Send a guest pass directly from the admin — not tied to any student's registration.
        </p>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Guest name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 min-w-40 rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm"
          />
          <input
            type="email"
            placeholder="Guest email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 min-w-52 rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim() || !newEmail.trim()}
            className="bg-primary-green text-white px-5 py-2 rounded-md hover:bg-primary-darkGreen font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {creating ? "Sending…" : "Send guest pass"}
          </button>
        </div>
        {createMsg && (
          <p className={`mt-3 text-sm font-medium ${createMsg.type === "success" ? "text-green-700" : "text-red-700"}`}>
            {createMsg.text}
          </p>
        )}
      </div>

      {/* ── Admin-issued passes ── */}
      {adminGuests.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Admin-issued passes ({adminGuests.length})
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {adminGuests.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{g.name}</td>
                  <td className="px-6 py-3 text-gray-600">{g.email}</td>
                  <td className="px-6 py-3">
                    {g.ticketSent ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        ✓ Sent{g.sentAt ? ` ${formatDate(g.sentAt)}` : ""}
                      </span>
                    ) : (
                      <span className="text-yellow-600">Not sent</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(g.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleResend(g)}
                      disabled={sendingId === g.id}
                      className="text-primary-blue hover:text-primary-darkBlue text-xs font-medium disabled:opacity-50"
                    >
                      {sendingId === g.id ? "Sending…" : "Resend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Student-invited guests ── */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-semibold text-gray-900">
            Student-invited guests ({rows.length} across {new Set(rows.map((r) => r.student.id)).size} students)
          </h3>
          <input
            type="text"
            placeholder="Search guests or students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-green focus:border-transparent w-64"
          />
        </div>

        {filteredRows.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {rows.length === 0 ? "No student-invited guests yet." : "No results match your search."}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Guest Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">School</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{row.guest.name}</td>
                  <td className="px-6 py-3 text-gray-600">{row.guest.email}</td>
                  <td className="px-6 py-3">
                    {row.guest.ticketSent ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        ✓ Sent{row.guest.sentAt ? ` ${formatDate(row.guest.sentAt)}` : ""}
                      </span>
                    ) : (
                      <span className="text-yellow-600">Not sent</span>
                    )}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {row.student.firstName} {row.student.lastName}
                    {row.student.isTeamProject && row.student.teamMemberFirstName && (
                      <span className="text-gray-500 font-normal"> & {row.student.teamMemberFirstName} {row.student.teamMemberLastName}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{row.student.schoolName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
