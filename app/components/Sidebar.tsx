"use client";

import { Settings, LogOut } from "lucide-react";
import { SidebarItems } from "../helpers/data";
import { allIcons } from "../helpers/icons";
import SidebarItemMain from "./SidebarItemMain";
import { useGlobalContext } from "@/contexts/GlobalContext";

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const [state] = useGlobalContext();
  const isOpen = state.isSidebarOpen;

  return (
    <div
      className={`flex flex-col justify-between bg-bg-inner rounded-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isOpen ? "w-80" : "w-0"
      }`}
    >
      <div
        className={`flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen
            ? "opacity-100 px-3 delay-100 pointer-events-auto"
            : "opacity-0 px-0 delay-0 pointer-events-none"
        }`}
      >
        <div
          className={`py-6 px-6 flex text-text-dark gap-3 items-center border-b border-b-border-hr whitespace-nowrap transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isOpen ? "opacity-100 delay-200" : "opacity-0 delay-0"
          }`}
        >
          {allIcons.sidebar.dashboard}
          <span className="font-medium text-lg text-text-dark">Dashboard</span>
        </div>
        <div className="flex flex-col gap-0">
          {SidebarItems.map((item) => (
            <SidebarItemMain key={item.name} data={item} />
          ))}
        </div>
      </div>
      <div
        className={`flex flex-col gap-6 pb-5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen
            ? "opacity-100 px-3 delay-100 pointer-events-auto"
            : "opacity-0 px-0 delay-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col">
          <SidebarItemMain
            data={{
              icon: <Settings size={20} />,
              name: "Settings",
              href: "/settings",
              subItems: [],
            }}
          />

          <SidebarItemMain
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
    </div>
  );
};

export default Sidebar;
