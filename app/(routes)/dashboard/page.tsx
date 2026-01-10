"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { IRoute } from "@/app/types/routes.types";

export default function Dashboard() {
  const router = useRouter();
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();

  useEffect(() => {
    // Wait for auth to initialize and userData to be loaded
    if (!auth.initialized || auth.loading || !auth.user) {
      return;
    }

    // Wait for userData to be loaded before making redirect decisions
    if (!auth.userData) {
      return;
    }

    // If user is a super admin and no tenant is selected, redirect to users management
    if (auth.userData.role === "superadmin" && !state.selectedTenantId) {
      router.push("/dashboard/settings/superadmin/users-and-access" as IRoute);
    } else {
      router.push("/dashboard/asset-management/applications" as IRoute);
    }
  }, [
    auth.initialized,
    auth.loading,
    auth.user,
    auth.userData,
    state.selectedTenantId,
    router,
  ]);

  return null;
}
