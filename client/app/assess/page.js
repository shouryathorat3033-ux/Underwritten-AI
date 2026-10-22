"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AssessRedirect() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signup");
    else if (status === "authenticated") router.replace("/applicant/dashboard/assess");
  }, [status, router]);

  return null;
}
