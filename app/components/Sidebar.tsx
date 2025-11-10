"use client";

import { Settings, LogOut, Menu, LucideMenu } from "lucide-react";
import { SidebarItems } from "../helpers/data";
import { allIcons } from "../helpers/icons";
import SidebarItemMain from "./SidebarItemMain";
import { useGlobalContext } from "@/contexts/GlobalContext";
import Image from "next/image";
import classNames from "classnames";

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const isOpen = state.isSidebarOpen;

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
                <Image
                  src="/images/logo.png"
                  alt="logo"
                  width={140}
                  height={30}
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
        <div className="flex flex-col gap-0 py-2">
          {SidebarItems.map((item) => (
            <SidebarItemMain key={item.name} data={item} isOpen={isOpen} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-0 pb-5">
        <SidebarItemMain
          isOpen={isOpen}
          data={{
            icon: <Settings size={20} />,
            name: "Settings 1",
            href: "/settings",
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
