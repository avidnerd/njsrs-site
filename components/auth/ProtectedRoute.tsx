"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("sra" | "student" | "judge" | "fair_director" | "website_manager")[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
        // Redirect to appropriate dashboard based on role
        switch (userProfile.role) {
          case "sra":
            router.push("/dashboard/sra");
            break;
          case "student":
            router.push("/dashboard/student");
            break;
          case "judge":
            router.push("/dashboard/judge");
            break;
          case "fair_director":
          case "website_manager":
            router.push("/dashboard/admin");
            break;
          default:
            router.push("/");
        }
        return;
      }
    }
  }, [user, userProfile, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    return null;
  }

  return <>{children}</>;
}
