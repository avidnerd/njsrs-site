"use client";

import { useState, useEffect, useRef } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/firebase/database";
import type { Category } from "@/lib/firebase/database";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingRoom, setEditingRoom] = useState("");
  const [editingPrefix, setEditingPrefix] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const loadCategories = async () => {
    try {
      const list = await getCategories();
      setCategories(list);
    } catch (e) {
      console.error("Error loading categories:", e);
      alert("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      await createCategory(name, newRoom.trim(), newPrefix.trim().toUpperCase());
      setNewName("");
      setNewRoom("");
      setNewPrefix("");
      await loadCategories();
    } catch (e) {
      console.error(e);
      alert("Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id!);
    setEditingName(c.name);
    setEditingRoom(c.room ?? "");
    setEditingPrefix(c.prefix ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    const room = editingRoom.trim();
    const prefix = editingPrefix.trim().toUpperCase();
    setSavingId(id);
    try {
      await updateCategory(id, name, room, prefix);
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name, room, prefix } : c)));
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to update category.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Students and judges assigned to it will keep the assignment until you reassign them.`)) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (e) {
      console.error(e);
      alert("Failed to delete category.");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create category</h3>
        <p className="text-sm text-gray-600 mb-4">
          Categories are used to assign students and judges (e.g. by discipline or track). Create categories here, then assign students and judges under All Students and Judges.
        </p>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name (e.g. Life Sciences)"
            className="flex-1 min-w-48 rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <input
            type="text"
            value={newPrefix}
            onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
            placeholder="ID prefix (e.g. LS)"
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm font-mono"
            maxLength={6}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <input
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="Room (e.g. 204)"
            className="w-28 rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting || !newName.trim()}
            className="bg-primary-green text-white px-4 py-2 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 font-medium"
          >
            {submitting ? "Adding…" : "Add category"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">No categories yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                {editingId === c.id ? (
                  <>
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(c.id!);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 rounded-md border border-primary-blue px-3 py-1 text-gray-900 text-sm focus:ring-2 focus:ring-primary-blue focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editingPrefix}
                      onChange={(e) => setEditingPrefix(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(c.id!);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      placeholder="Prefix"
                      maxLength={6}
                      className="w-20 rounded-md border border-primary-blue px-3 py-1 text-gray-900 text-sm font-mono focus:ring-2 focus:ring-primary-blue focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editingRoom}
                      onChange={(e) => setEditingRoom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(c.id!);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      placeholder="Room"
                      className="w-24 rounded-md border border-primary-blue px-3 py-1 text-gray-900 text-sm focus:ring-2 focus:ring-primary-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={savingId === c.id || !editingName.trim()}
                      onClick={() => handleSaveEdit(c.id!)}
                      className="text-primary-green hover:text-primary-darkGreen text-sm font-medium disabled:opacity-50"
                    >
                      {savingId === c.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-900 font-medium">{c.name}</span>
                    {c.prefix ? (
                      <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono border border-indigo-200">
                        {c.prefix}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">auto</span>
                    )}
                    {c.room && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                        Room {c.room}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-primary-blue hover:text-primary-darkBlue text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => c.id && handleDelete(c.id, c.name)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
