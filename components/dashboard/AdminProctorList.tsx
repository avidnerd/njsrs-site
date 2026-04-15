"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllProctors, updateProctorRoom } from "@/lib/firebase/proctors";
import type { ProctorProfile } from "@/lib/firebase/proctors";
import { getCategories } from "@/lib/firebase/database";
import type { Category } from "@/lib/firebase/database";

export default function AdminProctorList() {
  const { user } = useAuth();
  const [proctors, setProctors] = useState<ProctorProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  // proctorId → room draft value being edited
  const [roomEdits, setRoomEdits] = useState<Record<string, string>>({});
  const [savingRoom, setSavingRoom] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    categoryId: "",
  });

  useEffect(() => {
    Promise.all([loadProctors(), loadCategories()]);
  }, []);

  const loadProctors = async () => {
    try {
      const list = await getAllProctors();
      setProctors(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories(await getCategories());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.categoryId) {
      setMessage({ type: "err", text: "Please select a category." });
      return;
    }
    setCreating(true);
    setMessage(null);
    try {
      const idToken = await user.getIdToken();
      const category = categories.find((c) => c.id === form.categoryId);
      const res = await fetch("/api/create-proctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminIdToken: idToken,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          categoryId: form.categoryId,
          categoryName: category?.name ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create proctor");
      setMessage({ type: "ok", text: `Proctor account created. Email: ${form.email} · Password: ${form.password}` });
      setForm({ firstName: "", lastName: "", email: "", password: "", categoryId: "" });
      setShowCreate(false);
      await loadProctors();
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (proctor: ProctorProfile) => {
    if (!user || !proctor.id) return;
    if (!confirm(`Delete proctor account for ${proctor.firstName} ${proctor.lastName}? This cannot be undone.`)) return;
    setDeleting(proctor.id);
    setMessage(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/create-proctor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminIdToken: idToken, uid: proctor.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete proctor");
      setProctors((prev) => prev.filter((p) => p.id !== proctor.id));
      setMessage({ type: "ok", text: `Deleted proctor: ${proctor.firstName} ${proctor.lastName}` });
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveRoom = async (proctor: ProctorProfile) => {
    if (!proctor.id) return;
    const room = (roomEdits[proctor.id] ?? proctor.room ?? "").trim();
    setSavingRoom(proctor.id);
    try {
      await updateProctorRoom(proctor.id, room);
      setProctors((prev) => prev.map((p) => p.id === proctor.id ? { ...p, room } : p));
      setRoomEdits((prev) => { const next = { ...prev }; delete next[proctor.id!]; return next; });
    } catch (e: any) {
      setMessage({ type: "err", text: e.message ?? "Failed to save room." });
    } finally {
      setSavingRoom(null);
    }
  };

  if (loading) return <div className="text-center py-8">Loading proctors…</div>;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {proctors.length} proctor{proctors.length !== 1 ? "s" : ""} created
        </p>
        <button
          onClick={() => { setShowCreate((v) => !v); setMessage(null); }}
          className="px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-medium hover:opacity-90"
        >
          {showCreate ? "Cancel" : "+ Create proctor"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-900">New proctor account</h3>
          <p className="text-sm text-gray-500">
            The proctor can log in immediately — no email verification required. Give them the credentials directly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="text"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white"
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-amber-700 mt-1">Create categories under the Categories tab first.</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2 rounded-lg bg-primary-green text-white font-semibold text-sm hover:bg-primary-darkGreen disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create proctor account"}
          </button>
        </form>
      )}

      {proctors.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
          No proctor accounts yet. Create one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proctors.map((p) => {
            const roomDraft = roomEdits[p.id!] ?? p.room ?? "";
            const isDirty = p.id! in roomEdits && roomEdits[p.id!] !== (p.room ?? "");
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{p.firstName} {p.lastName}</p>
                    <p className="text-sm text-gray-600">{p.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {p.categoryName || "No category"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={deleting === p.id}
                    className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50 shrink-0"
                  >
                    {deleting === p.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
                {/* Room assignment */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Room</label>
                  <input
                    type="text"
                    value={roomDraft}
                    placeholder="e.g. 204"
                    onChange={(e) => setRoomEdits((prev) => ({ ...prev, [p.id!]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveRoom(p); }}
                    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-primary-blue focus:outline-none"
                  />
                  {isDirty && (
                    <button
                      onClick={() => handleSaveRoom(p)}
                      disabled={savingRoom === p.id}
                      className="px-3 py-1 rounded-md bg-primary-blue text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
                    >
                      {savingRoom === p.id ? "Saving…" : "Save"}
                    </button>
                  )}
                  {!isDirty && p.room && (
                    <span className="text-xs text-green-700 font-medium shrink-0">Saved</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
