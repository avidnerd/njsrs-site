"use client";

import { useState, useEffect } from "react";
import { getAllStudents, getCategories, batchSetPresentationOrders } from "@/lib/firebase/database";
import type { Student, Category } from "@/lib/firebase/database";

interface OrderedStudent {
  id: string;
  firstName: string;
  lastName: string;
  projectId?: string;
  projectTitle?: string;
  presentationOrder?: number;
}

export default function AdminPresentationOrder() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [studentsByCategory, setStudentsByCategory] = useState<Record<string, OrderedStudent[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [savedCat, setSavedCat] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [cats, students] = await Promise.all([getCategories(), getAllStudents()]);
      const approved = students.filter((s) => s.status === "approved" && s.categoryId && s.id);

      const byCat: Record<string, OrderedStudent[]> = {};
      for (const cat of cats) {
        if (!cat.id) continue;
        const inCat = approved
          .filter((s) => s.categoryId === cat.id)
          .map((s) => ({
            id: s.id!,
            firstName: s.firstName,
            lastName: s.lastName,
            projectId: s.projectId,
            projectTitle: s.projectTitle,
            presentationOrder: s.presentationOrder,
          }));
        // Sort by saved presentationOrder, then projectId as fallback
        inCat.sort((a, b) => {
          const oa = a.presentationOrder ?? 9999;
          const ob = b.presentationOrder ?? 9999;
          if (oa !== ob) return oa - ob;
          return (a.projectId ?? "").localeCompare(b.projectId ?? "");
        });
        byCat[cat.id] = inCat;
      }

      setCategories(cats);
      setStudentsByCategory(byCat);
    } catch (e) {
      console.error("Error loading presentation order data:", e);
    } finally {
      setLoading(false);
    }
  };

  const move = (catId: string, fromIdx: number, toIdx: number) => {
    setStudentsByCategory((prev) => {
      const list = [...(prev[catId] ?? [])];
      const [item] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, item);
      return { ...prev, [catId]: list };
    });
    setSavedCat(null);
  };

  const moveToEnd = (catId: string, idx: number) => {
    setStudentsByCategory((prev) => {
      const list = [...(prev[catId] ?? [])];
      const [item] = list.splice(idx, 1);
      list.push(item);
      return { ...prev, [catId]: list };
    });
    setSavedCat(null);
  };

  const moveToStart = (catId: string, idx: number) => {
    setStudentsByCategory((prev) => {
      const list = [...(prev[catId] ?? [])];
      const [item] = list.splice(idx, 1);
      list.unshift(item);
      return { ...prev, [catId]: list };
    });
    setSavedCat(null);
  };

  const saveOrder = async (catId: string) => {
    const list = studentsByCategory[catId] ?? [];
    setSavingCat(catId);
    try {
      await batchSetPresentationOrders(list.map((s, idx) => ({ id: s.id, order: idx + 1 })));
      setSavedCat(catId);
    } catch (e) {
      console.error("Failed to save order:", e);
      alert("Failed to save order.");
    } finally {
      setSavingCat(null);
    }
  };

  if (loading) return <div className="text-center py-12">Loading…</div>;

  const categoriesWithStudents = categories.filter(
    (c) => c.id && (studentsByCategory[c.id]?.length ?? 0) > 0
  );

  if (categoriesWithStudents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-gray-500 text-sm">
        No approved students with categories assigned yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
        Drag the order within each category using the ↑ / ↓ buttons, then click <strong>Save order</strong>. This order controls the sequence in which students appear on the proctor dashboard and on each judge&apos;s scoring panel.
      </div>

      {categoriesWithStudents.map((cat) => {
        const list = studentsByCategory[cat.id!] ?? [];
        const isSaving = savingCat === cat.id;
        const justSaved = savedCat === cat.id;

        return (
          <div key={cat.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{list.length} student(s)</p>
              </div>
              <button
                type="button"
                onClick={() => saveOrder(cat.id!)}
                disabled={isSaving}
                className={`px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 transition-colors ${
                  justSaved
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-primary-green text-white hover:bg-primary-darkGreen"
                }`}
              >
                {isSaving ? "Saving…" : justSaved ? "Saved ✓" : "Save order"}
              </button>
            </div>

            <ol className="divide-y divide-gray-100">
              {list.map((s, idx) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-6 text-right text-xs text-gray-400 font-mono shrink-0">{idx + 1}</span>

                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => move(cat.id!, idx, idx - 1)}
                      disabled={idx === 0}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none px-1"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => move(cat.id!, idx, idx + 1)}
                      disabled={idx === list.length - 1}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none px-1"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {s.firstName} {s.lastName}
                      {s.projectId && (
                        <span className="ml-2 text-xs text-gray-500 font-mono">{s.projectId}</span>
                      )}
                    </p>
                    {s.projectTitle && (
                      <p className="text-xs text-gray-500 truncate">{s.projectTitle}</p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveToStart(cat.id!, idx)}
                      disabled={idx === 0}
                      className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-20 underline"
                      title="Move to start"
                    >
                      First
                    </button>
                    <button
                      type="button"
                      onClick={() => moveToEnd(cat.id!, idx)}
                      disabled={idx === list.length - 1}
                      className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-20 underline"
                      title="Move to end"
                    >
                      Last
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
