"use client";

import { Bell, Menu, Moon } from "lucide-react";
import Search from "./Search";
import UserDropdown from "./UserDropdown";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/app/contexts/AuthContext";
import CustomSelect, { SelectOption } from "./CustomSelect";
import type { Tables } from "@/app/types/database.types";
import { useRouter } from "next/navigation";

type Tenant = Tables<"tenants">;

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [auth] = useAuthContext();
  const [searchValue, setSearchValue] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const isSuperAdmin = auth.userData?.role === "superadmin";
  const router = useRouter();

  // Fetch tenants for superadmin
  useEffect(() => {
    if (isSuperAdmin && auth.userData?.id) {
      fetchSuperAdminTenants();
    }
  }, [isSuperAdmin, auth.userData?.id]);

  useEffect(() => {
    fetchSuperAdminTenants();
  }, [state.refreshTrigger]);

  const fetchSuperAdminTenants = async () => {
    if (!auth.userData?.id) return;

    setLoadingTenants(true);
    try {
      // First, get tenant IDs from internal_user_tenant_access
      const { data: accessData, error: accessError } = await supabase
        .from("internal_user_tenant_access")
        .select("tenant_id")
        .eq("user_id", auth.userData.id);

      if (accessError) {
        console.error("Error fetching tenant access:", accessError);
        setLoadingTenants(false);
        return;
      }

      if (!accessData || accessData.length === 0) {
        setTenants([]);
        setLoadingTenants(false);
        return;
      }

      // Then, fetch tenant details
      const tenantIds = accessData.map((a) => a.tenant_id);
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name")
        .in("id", tenantIds)
        .order("name");

      if (tenantsError) {
        console.error("Error fetching tenants:", tenantsError);
      } else {
        setTenants((tenantsData as Tenant[]) || []);

        // Validate and handle tenant selection
        if (tenantsData && tenantsData.length > 0) {
          const tenantIds = tenantsData.map((t) => t.id);
          const currentSelectedId = state.selectedTenantId;

          // If no tenant is selected, or the selected tenant is not in the available list, auto-select first tenant
          if (!currentSelectedId || !tenantIds.includes(currentSelectedId)) {
            dispatch({
              setState: {
                selectedTenantId: tenantsData[0].id,
              },
            });
          }
          // Otherwise, keep the current selection (it's valid)
        } else {
          // No tenants available, clear selection
          if (state.selectedTenantId) {
            dispatch({
              setState: {
                selectedTenantId: null,
              },
            });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching superadmin tenants:", err);
    } finally {
      setLoadingTenants(false);
    }
  };

  const tenantOptions: SelectOption[] = useMemo(() => {
    return tenants.map((tenant) => ({
      value: tenant.id,
      label: tenant.name,
    }));
  }, [tenants]);

  const handleTenantChange = (tenantId: string) => {
    dispatch({
      setState: {
        selectedTenantId: tenantId || null,
      },
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSettings = () => {
    router.push("/dashboard/profile-settings");
    // TODO: Implement settings functionality
  };

  const handleLogout = async () => {
    localStorage.removeItem("globalState");
    dispatch({
      setState: {
        selectedTenantId: null,
        createAssetCategoryId: undefined,
      },
    });
    await supabase.auth.signOut();
    // TODO: Implement logout functionality
  };

  return (
    <div className="h-16 px-6 flex justify-between items-center bg-bg-inner rounded-3xl">
      <div className="flex items-center">
        {isSuperAdmin && (
          <div className="w-64">
            {loadingTenants ? (
              <div className="text-sm text-text-secondary">
                Loading tenants...
              </div>
            ) : tenantOptions.length > 0 ? (
              <CustomSelect
                options={tenantOptions}
                value={state.selectedTenantId || ""}
                onChange={handleTenantChange}
                placeholder="Select tenant"
              />
            ) : (
              <div className="text-sm text-text-secondary">
                No tenant access
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-16">
        {/* <Search onChange={handleSearchChange} value={searchValue} /> */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full b-white border-border-main border p-3">
              <Bell
                height={16}
                width={16}
                className="text-text-secondary"
              ></Bell>
            </div>

            <div
              className="rounded-full b-white border-border-main border p-3 cursor-pointer"
              onClick={() => {
                dispatch({
                  setState: {
                    theme: state.theme === "light" ? "dark" : "light",
                  },
                });
              }}
            >
              <Moon
                height={16}
                width={16}
                className="text-text-secondary"
              ></Moon>
            </div>
          </div>
          <UserDropdown
            user={{
              userData: auth.userData,
              name: auth.userData?.name ?? "Unknown User",
              role: auth.user?.role || " ",
              avatar: auth.user?.user_metadata?.avatar_url || undefined,
            }}
            onSettingsClick={handleSettings}
            onLogoutClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
