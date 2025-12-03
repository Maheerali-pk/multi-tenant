import { SidebarItem } from "../helpers/data";
import { ChevronDown } from "lucide-react";
import SidebarSubItem from "./SidebarSubItem";
import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import classNames from "classnames";

interface SidebarItemMainProps {
  data: SidebarItem;
  onClick?: () => void;
  isOpen?: boolean;
}

const SidebarItemMain: React.FC<SidebarItemMainProps> = ({
  data,
  onClick,
  isOpen: sidebarOpen = true,
}) => {
  const pathname = usePathname();

  // Check if any sub-item is active
  const hasActiveSubItem = data.subItems.some(
    (subItem) => pathname === subItem.href
  );

  const [isOpen, setIsOpen] = useState(hasActiveSubItem);

  // Update isOpen when pathname changes
  useEffect(() => {
    const hasActive = data.subItems.some(
      (subItem) => pathname === subItem.href
    );
    if (hasActive) {
      setIsOpen(true);
    }
  }, [pathname, data.subItems]);

  // Determine if this item should be shown as selected
  const shouldShowAsSelected = useMemo(() => {
    // If item has a direct href and it matches current pathname
    if (data.href && pathname === data.href) {
      return true;
    }
    // If any sub-item is active
    if (hasActiveSubItem) {
      return true;
    }
    return false;
  }, [data.href, pathname, hasActiveSubItem]);

  // Don't show sub-items when sidebar is minimized
  const shouldShowSubItems = sidebarOpen && isOpen;

  return (
    <>
      <div
        onClick={() => {
          if (sidebarOpen) {
            setIsOpen(!isOpen);
          }
          onClick?.();
        }}
        className={classNames(
          "flex cursor-pointer  font-medium items-center w-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          {
            "justify-between p-3": sidebarOpen,
            "text-brand": shouldShowAsSelected,
            "text-text-primary": !shouldShowAsSelected,
            "justify-center p-2": !sidebarOpen,
          }
        )}
      >
        <div
          className={classNames("flex items-center", {
            "gap-3": sidebarOpen,
            "gap-0": !sidebarOpen,
          })}
        >
          {data.icon}
          {sidebarOpen && (
            <span className="text-sm font-medium transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
              {data.name}
            </span>
          )}
        </div>
        {sidebarOpen && data.subItems.length > 0 && (
          <ChevronDown
            className={classNames(
              "w-4 h-4 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              {
                "rotate-180": isOpen,
                "rotate-0": !isOpen,
              }
            )}
          />
        )}
      </div>
      {sidebarOpen && (
        <div
          className={classNames(
            "flex flex-col border-l border-l-border-hr ml-8 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            {
              "max-h-[500px] opacity-100": shouldShowSubItems,
              "max-h-0 opacity-0": !shouldShowSubItems,
            }
          )}
        >
          <div
            className={classNames(
              "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              {
                "translate-x-0": shouldShowSubItems,
                "-translate-x-2": !shouldShowSubItems,
              }
            )}
          >
            {data.subItems.map((subItem) => (
              <SidebarSubItem key={subItem.name} data={subItem} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarItemMain;
