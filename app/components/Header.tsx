"use client";

import { Bell, Menu, Moon } from "lucide-react";
import Search from "./Search";
import UserDropdown from "./UserDropdown";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useState } from "react";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [searchValue, setSearchValue] = useState("");
  // Mock user data - replace with actual user data from your auth system
  const user = {
    name: "John William",
    role: "Project Manager",
    avatar: undefined, // You can add avatar URL here
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSettings = () => {
    console.log("Settings clicked");
    // TODO: Implement settings functionality
  };

  const handleLogout = () => {
    console.log("Logout clicked");
    // TODO: Implement logout functionality
  };

  return (
    <div className="h-16 px-6 flex cursor-pointer justify-between items-center bg-bg-inner rounded-3xl">
      <div></div>
      <div className="flex items-center gap-16">
        <Search onChange={handleSearchChange} value={searchValue} />
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
              className="rounded-full b-white border-border-main border p-3"
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
            user={user}
            onSettingsClick={handleSettings}
            onLogoutClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
