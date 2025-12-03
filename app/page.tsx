"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

export default function Home() {
  const router = useRouter();
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();

  useEffect(() => {
    if (!auth.initialized || auth.loading) {
      return;
    }

    // If user is a super admin and no tenant is selected, redirect to users management
    if (auth.userData?.role === "superadmin" && !state.selectedTenantId) {
      router.push("/dashboard/settings/superadmin/users-management");
    } else {
      router.push("/dashboard/assets/applications");
    }
  }, [
    auth.initialized,
    auth.loading,
    auth.userData?.role,
    state.selectedTenantId,
    router,
  ]);

  return null;
}
