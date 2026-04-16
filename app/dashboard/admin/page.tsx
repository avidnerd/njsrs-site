"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import AdminSRAList from "@/components/dashboard/AdminSRAList";
import AdminJudgeList from "@/components/dashboard/AdminJudgeList";
import AdminSRCApproval from "@/components/dashboard/AdminSRCApproval";
import AdminStudentList from "@/components/dashboard/AdminStudentList";
import AdminCategories from "@/components/dashboard/AdminCategories";
import AdminJudgingScoring from "@/components/dashboard/AdminJudgingScoring";
import AdminGuestList from "@/components/dashboard/AdminGuestList";
import AdminProctorList from "@/components/dashboard/AdminProctorList";
import AdminChaperoneList from "@/components/dashboard/AdminChaperoneList";
import AdminPresentationOrder from "@/components/dashboard/AdminPresentationOrder";

export default function AdminDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "sras" | "judges" | "src" | "students" | "categories" | "scoring" | "guests" | "proctors" | "chaperones" | "order"
  >("sras");

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const isAdmin = userProfile?.role === "fair_director" || userProfile?.role === "website_manager";

  return (
    <ProtectedRoute allowedRoles={["fair_director", "website_manager"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary-blue">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  {userProfile?.role === "fair_director" ? "Fair Director" : "Website Manager"} - {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-6 border-b border-gray-200 overflow-x-auto">
            <nav className="flex flex-nowrap gap-4 sm:gap-6 min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab("sras")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "sras"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                SRAs
              </button>
              <button
                onClick={() => setActiveTab("judges")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "judges"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Judges
              </button>
              <button
                onClick={() => setActiveTab("src")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "src"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                SRC
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "students"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "categories"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab("scoring")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "scoring"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Scoring
              </button>
              <button
                onClick={() => setActiveTab("guests")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "guests"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Guests
              </button>
              <button
                onClick={() => setActiveTab("proctors")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "proctors"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Proctors
              </button>
              <button
                onClick={() => setActiveTab("chaperones")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "chaperones"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Chaperones
              </button>
              <button
                onClick={() => setActiveTab("order")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "order"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Presentation Order
              </button>
            </nav>
          </div>

          {}
          {activeTab === "sras" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Manage SRAs
                </h2>
                <p className="text-gray-600">
                  Review and approve Science Research Advisor registrations.
                </p>
              </div>
              <AdminSRAList />
            </div>
          ) : activeTab === "judges" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Manage Judges
                </h2>
                <p className="text-gray-600">
                  Review judge applications and approve qualified judges.
                </p>
              </div>
              <AdminJudgeList />
            </div>
          ) : activeTab === "src" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  SRC Approval Requests
                </h2>
                <p className="text-gray-600">
                  Review and approve Scientific Review Committee requests from students.
                </p>
              </div>
              <AdminSRCApproval />
            </div>
          ) : activeTab === "students" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  All Students
                </h2>
                <p className="text-gray-600">
                  View all registered students, assign categories, and export project classifications (including project description).
                </p>
              </div>
              <AdminStudentList />
            </div>
          ) : activeTab === "categories" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Categories
                </h2>
                <p className="text-gray-600">
                  Create categories for the fair, then assign students and judges to them under Students and Judges.
                </p>
              </div>
              <AdminCategories />
            </div>
          ) : activeTab === "scoring" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Judging & scoring
                </h2>
                <p className="text-gray-600">
                  Assign judges to students for category and final rounds. View standings (average score,
                  ties broken by average rank) and export CSV reports.
                </p>
              </div>
              <AdminJudgingScoring />
            </div>
          ) : activeTab === "guests" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Guests
                </h2>
                <p className="text-gray-600">
                  All guests registered by students, with ticket status.
                </p>
              </div>
              <AdminGuestList />
            </div>
          ) : activeTab === "proctors" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Proctors
                </h2>
                <p className="text-gray-600">
                  Create proctor accounts and assign them to a category. Proctors can mark the current presenter in real time, visible at <strong>njsrs.org/live</strong>.
                </p>
              </div>
              <AdminProctorList />
            </div>
          ) : activeTab === "chaperones" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Chaperones
                </h2>
                <p className="text-gray-600">
                  All chaperones registered by SRAs, grouped by school. Shows confirmation status and contact info.
                </p>
              </div>
              <AdminChaperoneList />
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Presentation Order
                </h2>
                <p className="text-gray-600">
                  Set the order in which students present within each category. This order is shown on the proctor dashboard and on each judge&apos;s scoring panel.
                </p>
              </div>
              <AdminPresentationOrder />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
