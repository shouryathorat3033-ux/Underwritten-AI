"use client";
import { useSession } from "next-auth/react";

export function getDashboardBase(role) {
  if (role === "underwriter" || role === "admin") return "/admin/dashboard";
  return "/applicant/dashboard";
}

export function useDashboardBase() {
  const { data: session } = useSession();
  return getDashboardBase(session?.user?.role);
}
