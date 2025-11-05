import { FunctionComponent } from "react";
import type { SidebarSubItem } from "../helpers/data";
import Link from "next/link";
import classNames from "classnames";
import { usePathname } from "next/navigation";

interface SidebarSubItemProps {
  data: SidebarSubItem;
}

const SidebarSubItem: FunctionComponent<SidebarSubItemProps> = ({ data }) => {
  const pathname = usePathname();

  return (
    <Link href={data.href}>
      <div
        className={classNames("w-full border-l-3 pl-2.5 ", {
          "border-l-brand": pathname === data.href,
          "border-l-transparent": pathname !== data.href,
        })}
      >
        <div
          className={classNames(
            "flex cursor-pointer text-text-secondary   items-center justify-between w-full p-2 rounded-xl hover:bg-sidebar-sub-item-hover transition-all duration-300",
            {
              "bg-sidebar-sub-item-hover": pathname === data.href,
              "bg-transparent": pathname !== data.href,
            }
          )}
        >
          <div className="gap-3 flex items-center ">
            {data.icon}
            <span className="text-sm font-medium">{data.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SidebarSubItem;
