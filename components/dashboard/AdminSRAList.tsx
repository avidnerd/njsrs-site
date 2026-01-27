"use client";

import { useState, useEffect } from "react";
import { getAllSRAs, updateSRAApproval } from "@/lib/firebase/database";
import type { SRA } from "@/lib/firebase/database";

export default function AdminSRAList() {
  const [sras, setSRAs] = useState<SRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");

  useEffect(() => {
    loadSRAs();
  }, []);

  const loadSRAs = async () => {
    try {
      const sraList = await getAllSRAs();
      setSRAs(sraList);
    } catch (error) {
      console.error("Error loading SRAs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (sraId: string, approved: boolean) => {
    try {
      await updateSRAApproval(sraId, approved);
      await loadSRAs();
    } catch (error) {
      console.error("Error updating SRA approval:", error);
      alert("Failed to update SRA approval");
    }
  };

  const filteredSRAs = sras.filter((sra) => {
    if (filter === "all") return true;
    if (filter === "approved") return sra.adminApproved === true;
    if (filter === "pending") return sra.adminApproved !== true;
    return true;
  });

  if (loading) {
    return <div className="text-center py-12">Loading SRAs...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-md ${
            filter === "all"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          All ({sras.length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-md ${
            filter === "approved"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Approved ({sras.filter((s) => s.adminApproved === true).length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-md ${
            filter === "pending"
              ? "bg-primary-blue text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pending ({sras.filter((s) => s.adminApproved !== true).length})
        </button>
      </div>

      {filteredSRAs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No SRAs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSRAs.map((sra) => (
            <div key={sra.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {sra.firstName} {sra.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{sra.email}</p>
                  <p className="text-sm text-gray-600">{sra.schoolName}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    sra.adminApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {sra.adminApproved ? "APPROVED" : "PENDING"}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {sra.phone && (
                  <p className="text-sm text-gray-600">
                    <strong>Phone:</strong> {sra.phone}
                  </p>
                )}
                {sra.title && (
                  <p className="text-sm text-gray-600">
                    <strong>Title:</strong> {sra.title}
                  </p>
                )}
              </div>
              {!sra.adminApproved && (
                <button
                  onClick={() => handleApproval(sra.id!, true)}
                  className="w-full bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-darkGreen text-sm font-medium"
                >
                  Approve SRA
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
