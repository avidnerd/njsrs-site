"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, userProfile } = useAuth();
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <img 
                src="/njsrs_logo.jpg" 
                alt="NJSRS Logo" 
                className="h-12 sm:h-16 md:h-20 w-auto"
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

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Link
                href={getDashboardPath()}
                className="bg-primary-green text-white px-3 sm:px-4 py-2 rounded-md hover:bg-primary-darkGreen font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-primary-green text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-md hover:bg-primary-darkGreen font-semibold transition-colors text-xs sm:text-sm whitespace-nowrap"
                >
                  LOG IN
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowRegisterDropdown(!showRegisterDropdown)}
                    className="bg-primary-green text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-md hover:bg-primary-darkGreen font-semibold flex items-center transition-colors text-xs sm:text-sm whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">REGISTER AS...</span>
                    <span className="sm:hidden">REGISTER</span>
                    <svg
                      className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4"
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
                        SPONSOR/ADVISOR
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
            
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-blue focus:outline-none"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <nav className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              <Link
                href="/competition"
                className="text-gray-900 hover:text-primary-blue font-medium transition-colors px-2 py-1"
                onClick={() => setShowMobileMenu(false)}
              >
                Competition
              </Link>
              <Link
                href="/judging"
                className="text-gray-900 hover:text-primary-blue font-medium transition-colors px-2 py-1"
                onClick={() => setShowMobileMenu(false)}
              >
                Judging
              </Link>
              <Link
                href="/donate"
                className="text-gray-900 hover:text-primary-blue font-medium transition-colors px-2 py-1"
                onClick={() => setShowMobileMenu(false)}
              >
                Donate
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
