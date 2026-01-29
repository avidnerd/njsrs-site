"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, userProfile } = useAuth();
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRegisterDropdown(false);
      }
    };

    if (showRegisterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRegisterDropdown]);

  const getDashboardPath = () => {
    if (!userProfile) return "/";
    switch (userProfile.role) {
      case "sra":
        return "/dashboard/sra";
      case "student":
        return "/dashboard/student";
      case "judge":
        return "/dashboard/judge";
      case "fair_director":
      case "website_manager":
        return "/dashboard/admin";
      default:
        return "/";
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src="/njsrs_logo.jpg" 
                alt="NJSRS Logo" 
                className="h-40 w-auto"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/competition"
              className="text-gray-900 hover:text-primary-blue font-medium transition-colors"
            >
              Competition
            </Link>
            <Link
              href="/judging"
              className="text-gray-900 hover:text-primary-blue font-medium transition-colors"
            >
              Judging
            </Link>
            <Link
              href="/donate"
              className="text-gray-900 hover:text-primary-blue font-medium transition-colors"
            >
              Donate
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <Link
                href={getDashboardPath()}
                className="bg-primary-green text-white px-4 py-2 rounded-md hover:bg-primary-darkGreen font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-primary-green text-white px-5 py-2.5 rounded-md hover:bg-primary-darkGreen font-semibold transition-colors"
                >
                  LOG IN
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowRegisterDropdown(!showRegisterDropdown)}
                    className="bg-primary-green text-white px-5 py-2.5 rounded-md hover:bg-primary-darkGreen font-semibold flex items-center transition-colors"
                  >
                    REGISTER AS...
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showRegisterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <Link
                        href="/register/student"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowRegisterDropdown(false)}
                      >
                        STUDENT
                      </Link>
                      <Link
                        href="/register/sra"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowRegisterDropdown(false)}
                      >
                        SPONSOR/TEACHER
                      </Link>
                      <Link
                        href="/register/judge"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowRegisterDropdown(false)}
                      >
                        JUDGE
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
