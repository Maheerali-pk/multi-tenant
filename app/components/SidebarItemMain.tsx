import { SidebarItem } from "../helpers/data";
import { ChevronDown } from "lucide-react";
import SidebarSubItem from "./SidebarSubItem";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import classNames from "classnames";

interface SidebarItemMainProps {
  data: SidebarItem;
  onClick?: () => void;
}

const SidebarItemMain: React.FC<SidebarItemMainProps> = ({ data, onClick }) => {
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
  return (
    <>
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          onClick?.();
        }}
        className="flex cursor-pointer text-text-primary font-medium  items-center justify-between w-full p-3"
      >
        <div className="gap-3 flex items-center ">
          {data.icon}
          <span className="text-sm font-medium">{data.name}</span>
        </div>
        {data.subItems.length > 0 && (
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
      <div
        className={classNames(
          "flex flex-col border-l border-l-border-hr ml-8 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          {
            "max-h-[500px] opacity-100": isOpen,
            "max-h-0 opacity-0": !isOpen,
          }
        )}
      >
        <div
          className={classNames(
            "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            {
              "translate-x-0": isOpen,
              "-translate-x-2": !isOpen,
            }
          )}
        >
          {data.subItems.map((subItem) => (
            <SidebarSubItem key={subItem.name} data={subItem} />
          ))}
        </div>
      </div>
    </>
  );
};

export default SidebarItemMain;
