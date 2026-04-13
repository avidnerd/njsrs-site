"use client";

import { useState, useEffect } from "react";
import { getAllStudents } from "@/lib/firebase/database";
import type { Student, Guest } from "@/lib/firebase/database";
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      const students = await getAllStudents();
      const allRows: GuestRow[] = [];
      for (const student of students) {
        if (student.guests && student.guests.length > 0) {
          for (const guest of student.guests) {
            allRows.push({ guest, student });
          }
        }
      }
      setRows(allRows);
    } catch (error) {
      console.error("Error loading guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    return (
      row.guest.name.toLowerCase().includes(q) ||
      row.guest.email.toLowerCase().includes(q) ||
      `${row.student.firstName} ${row.student.lastName}`.toLowerCase().includes(q) ||
      row.student.schoolName.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{rows.length} total guests across {new Set(rows.map(r => r.student.id)).size} students</p>
        <input
          type="text"
          placeholder="Search guests or students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-green focus:border-transparent w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {rows.length === 0 ? "No guests have been registered yet." : "No results match your search."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Guest Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Guest Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Ticket</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">School</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-gray-900">{row.guest.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.guest.email}</td>
                  <td className="px-4 py-3">
                    {row.guest.ticketSent ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        ✓ Sent{row.guest.sentAt ? ` ${formatDate(row.guest.sentAt)}` : ""}
                      </span>
                    ) : (
                      <span className="text-yellow-600">Not sent</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {row.student.firstName} {row.student.lastName}
                    {row.student.isTeamProject && row.student.teamMemberFirstName && (
                      <span className="text-gray-500 font-normal"> & {row.student.teamMemberFirstName} {row.student.teamMemberLastName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.student.schoolName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
