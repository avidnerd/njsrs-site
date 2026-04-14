"use client";

import { useState, useEffect } from "react";
import { getAllSRAs } from "@/lib/firebase/database";
import type { SRA } from "@/lib/firebase/database";
import { Timestamp } from "firebase/firestore";

function formatDate(value: Date | Timestamp | undefined | null): string {
  if (!value) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "object" && "toDate" in value) return value.toDate().toLocaleDateString();
  if (typeof value === "object" && "seconds" in value)
    return new Date((value as { seconds: number }).seconds * 1000).toLocaleDateString();
  return "";
}

interface ChaperoneRow {
  sra: SRA;
  schoolName: string;
}

export default function AdminChaperoneList() {
  const [rows, setRows] = useState<ChaperoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadChaperones();
  }, []);

  const loadChaperones = async () => {
    try {
      const sras = await getAllSRAs();
      // Keep only SRAs that have a chaperone entry (any field populated)
      const withChaperone = sras
        .filter((s) => s.chaperone && (s.chaperone.name || s.chaperone.email))
        .map((s) => ({ sra: s, schoolName: s.schoolName || "Unknown School" }))
        .sort((a, b) => a.schoolName.localeCompare(b.schoolName));
      setRows(withChaperone);
    } catch (e) {
      console.error("Failed to load chaperones:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = rows.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.schoolName.toLowerCase().includes(term) ||
      r.sra.firstName.toLowerCase().includes(term) ||
      r.sra.lastName.toLowerCase().includes(term) ||
      r.sra.chaperone?.name?.toLowerCase().includes(term) ||
      r.sra.chaperone?.email?.toLowerCase().includes(term)
    );
  });

  // Group by school for display
  const bySchool: Record<string, ChaperoneRow[]> = {};
  for (const row of filtered) {
    if (!bySchool[row.schoolName]) bySchool[row.schoolName] = [];
    bySchool[row.schoolName].push(row);
  }

  if (loading) return <div className="text-center py-12">Loading chaperones…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {rows.length} chaperone{rows.length !== 1 ? "s" : ""} registered across{" "}
          {Object.keys(bySchool).length} school{Object.keys(bySchool).length !== 1 ? "s" : ""}.
        </p>
        <input
          type="text"
          placeholder="Search by school, SRA, or chaperone…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-72 px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
        />
      </div>

      {Object.keys(bySchool).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {searchTerm ? "No results match your search." : "No chaperones have been registered yet."}
        </div>
      ) : (
        Object.entries(bySchool).map(([school, schoolRows]) => (
          <div key={school} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800">{school}</h4>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SRA
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chaperone Name
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invite Sent
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirmed
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schoolRows.map((row) => {
                  const ch = row.sra.chaperone!;
                  return (
                    <tr key={row.sra.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.sra.firstName} {row.sra.lastName}
                        <div className="text-xs text-gray-400">{row.sra.email}</div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ch.name || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {ch.email ? (
                          <a href={`mailto:${ch.email}`} className="text-primary-blue hover:underline">
                            {ch.email}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {ch.phone || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        {ch.inviteSent ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            Sent
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                            Not sent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        {ch.confirmed ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Confirmed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ch.confirmationDate) || <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
