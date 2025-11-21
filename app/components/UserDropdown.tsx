"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Settings, LogOut } from "lucide-react";
import { UserData, UserRole } from "../types/user.types";
import { formatUserRole } from "../helpers/utils";

interface User {
  name: string;
  role: string;
  avatar?: string;
  userData: UserData;
}

interface UserDropdownProps {
  user: User;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

// Avatar component with fallback
const Avatar: React.FC<{ name: string; src?: string }> = ({ name, src }) => {
  const [imageError, setImageError] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showImage = src && !imageError;

  return (
    <div className="relative w-[2.625rem] h-[2.625rem] rounded-full overflow-hidden bg-gradient-to-br from-brand to-blue flex items-center justify-center shrink-0">
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-text-contrast text-sm font-semibold">
          {initials}
        </span>
      )}
    </div>
  );
};

const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onSettingsClick,
  onLogoutClick,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSettings = () => {
    onSettingsClick?.();
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    onLogoutClick?.();
    setIsDropdownOpen(false);
  };

  console.log(user.userData);
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 rounded-xl hover:bg-sidebar-sub-item-hover transition-all duration-300 p-2 cursor-pointer"
        aria-label="User menu"
        aria-expanded={isDropdownOpen}
      >
        <Avatar name={user.name} src={user.avatar} />
        <div className="flex flex-col items-start min-w-0">
          <div className="flex items-center gap-2 w-full">
            <span className="text-sm font-semibold text-text-primary truncate">
              {user.name}
            </span>
            <ChevronDown
              size={16}
              className={`text-text-secondary transition-transform duration-300 shrink-0 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>
          <span className="text-xs font-medium text-text-secondary truncate ">
            {user.userData?.role
              ? formatUserRole(user.userData.role as unknown as UserRole)
              : ""}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-bg-inner rounded-xl shadow-lg border border-border-hr overflow-hidden z-50">
          <div className="py-1">
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-primary hover:bg-sidebar-sub-item-hover transition-all duration-300 cursor-pointer"
            >
              <Settings size={18} className="text-text-secondary shrink-0" />
              <span>Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-primary hover:bg-sidebar-sub-item-hover transition-all duration-300 cursor-pointer"
            >
              <LogOut size={18} className="text-text-secondary shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
