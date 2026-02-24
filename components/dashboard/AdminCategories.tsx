"use client";

import { useState, useEffect } from "react";
import { getCategories, createCategory, deleteCategory } from "@/lib/firebase/database";
import type { Category } from "@/lib/firebase/database";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

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
      await createCategory(name);
      setNewName("");
      await loadCategories();
    } catch (e) {
      console.error(e);
      alert("Failed to create category.");
    } finally {
      setSubmitting(false);
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
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name (e.g. Life Sciences)"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm"
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
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-900 font-medium">{c.name}</span>
                <button
                  type="button"
                  onClick={() => c.id && handleDelete(c.id, c.name)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
