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

export default function AdminDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sras" | "judges" | "src" | "students">("sras");

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
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("sras")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "sras"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Science Research Advisors
              </button>
              <button
                onClick={() => setActiveTab("judges")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "judges"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Judges
              </button>
              <button
                onClick={() => setActiveTab("src")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "src"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                SRC Approval
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "students"
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Students
              </button>
            </nav>
          </div>

          {/* Content */}
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
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  All Students
                </h2>
                <p className="text-gray-600">
                  View all registered students and their submitted materials, forms, and information.
                </p>
              </div>
              <AdminStudentList />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
