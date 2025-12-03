"use client";
import {
  Settings,
  LogOut,
  Menu,
  LucideMenu,
  UsersRound,
  KeyRound,
} from "lucide-react";
import { SidebarItems } from "../helpers/data";
import { allIcons } from "../helpers/icons";
import SidebarItemMain from "./SidebarItemMain";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import Image from "next/image";
import classNames from "classnames";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const [auth, dispatchAuth] = useAuthContext();
  const [state, dispatch] = useGlobalContext();
  const router = useRouter();
  const isOpen = state.isSidebarOpen;
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);

  // Determine active tenant ID
  const activeTenantId =
    auth.userData?.role === "superadmin"
      ? state.selectedTenantId
      : auth.userData?.tenant_id;

  // Fetch tenant logo when active tenant changes
  useEffect(() => {
    const fetchTenantLogo = async () => {
      if (!activeTenantId) {
        setTenantLogo(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tenants")
          .select("logo")
          .eq("id", activeTenantId)
          .single();

        if (error) {
          console.error("Error fetching tenant logo:", error);
          setTenantLogo(null);
          return;
        }

        setTenantLogo(data?.logo || null);
      } catch (err) {
        console.error("Error fetching tenant logo:", err);
        setTenantLogo(null);
      }
    };

    fetchTenantLogo();
  }, [activeTenantId]);

  // Determine which logo to display
  const logoUrl = tenantLogo || "/images/logo.png";
  console.log(logoUrl);
  const shouldHideSidebar =
    (auth.userData?.role === "superadmin" && !state.selectedTenantId) ||
    !auth.userData?.role;
  return (
    <div
      className={`flex flex-col justify-between bg-bg-inner rounded-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isOpen ? "w-72" : "w-16"
      }`}
    >
      <div className="flex flex-col">
        <div
          className={`py-6 flex text-text-dark items-center border-b border-b-border-hr whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isOpen ? "px-6 opacity-100 justify-start" : "px-0  justify-center"
          }`}
        >
          <div
            className={classNames(
              "flex items-center gap-2 justify-between w-full",
              {
                "px-0 justify-center": !isOpen,
              }
            )}
          >
            {isOpen && (
              <div>
                <img
                  src={logoUrl}
                  alt="logo"
                  className="object-contain h-8 w-auto"
                  onError={(e) => {
                    // Fallback to default logo if tenant logo fails to load
                    if (tenantLogo) {
                      (e.target as HTMLImageElement).src = "/images/logo.png";
                    }
                  }}
                />
              </div>
            )}
            <div
              className={classNames(
                "rounded-full b-white rotate-180 hover:scale-125 transition-all duration-250 ease-in-out border-border-main border p-2 cursor-pointer",
                {}
              )}
              onClick={() => {
                dispatch({ setState: { isSidebarOpen: !state.isSidebarOpen } });
              }}
            >
              <LucideMenu size={16}></LucideMenu>
            </div>
          </div>
        </div>
        {!shouldHideSidebar && (
          <div className="flex flex-col gap-0 py-2">
            {SidebarItems.map((item) => (
              <SidebarItemMain key={item.name} data={item} isOpen={isOpen} />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0 pb-5">
        {auth.userData?.role === "superadmin" && (
          <SidebarItemMain
            isOpen={isOpen}
            data={{
              icon: <Settings size={20} />,
              name: "Settings (Super Admin)",
              href: "/dashboard/settings/superadmin/users-and-access",
              subItems: [
                {
                  name: "Tenant Management",
                  href: "/dashboard/settings/superadmin/tenant-management",
                  icon: <UsersRound size={20} />,
                },

                {
                  name: "Users and Access",
                  href: "/dashboard/settings/superadmin/users-and-access",
                  icon: <KeyRound size={20} />,
                },
              ],
            }}
          />
        )}

        {auth.userData?.role === "tenant_admin" && (
          <SidebarItemMain
            isOpen={isOpen}
            data={{
              icon: <Settings size={20} />,
              name: "Settings (Tenant Admin)",
              href: "/dashboard/settings/tenant-admin/tenant-profile",
              subItems: [
                {
                  name: "Company Profile",
                  href: "/dashboard/settings/tenant-admin/tenant-profile",
                  icon: <UsersRound size={20} />,
                },

                {
                  name: "Users and Access",
                  href: "/dashboard/settings/tenant-admin/users-and-access",
                  icon: <KeyRound size={20} />,
                },
              ],
            }}
          />
        )}
        <SidebarItemMain
          onClick={() => {
            router.push("/dashboard/profile-settings");
          }}
          isOpen={isOpen}
          data={{
            icon: <Settings size={20} />,
            name: "Settings",
            href: "/dashboard/profile-settings",
            subItems: [],
          }}
        />

        <SidebarItemMain
          isOpen={isOpen}
          onClick={() => alert("Logout")}
          data={{
            icon: <LogOut size={20} />,
            name: "Logout",
            href: "/logout",
            subItems: [],
          }}
        />
      </div>
    </div>
  );
};

export default Sidebar;
