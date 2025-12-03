"use client";
import AssetsTable from "@/app/components/AssetsTable";
import ContentWrapper from "@/app/components/ContentWrapper";
import Header from "@/app/components/Header";
import Search from "@/app/components/Search";
import Sidebar from "@/app/components/Sidebar";
import TableFilter from "@/app/components/TableFilter";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useAssetFilters } from "@/app/hooks/useAssetFilters";
import { CreateNewAssetButton } from "@/app/components/CreateNewAssetButton";
import { commonAssetFields, getRouteTitle } from "@/app/helpers/data";
import DashboardWrapper from "@/app/components/DashboardWrapper";
import { IRoute } from "@/app/types/routes.types";
import { usePathname } from "next/navigation";

interface ApplicationsProps {}

const Applications: React.FC<ApplicationsProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const { filterValues, setFilterValues, filterOptions } = useAssetFilters({
    includeFilters: {
      name: true,
      subcategory: true,
      sensitivity: true,
      exposure: true,
      status: true,
      owner: true,
      reviewer: true,
    },
    categoryId: 3,
  });
  const pathname = usePathname();

  return (
    <DashboardWrapper>
      <ContentWrapper filedsToInlcude={[...commonAssetFields]}>
        <div className="flex flex-col rounded-3xl  p-6 gap-3 min-h-0 flex-1">
          <div className="flex justify-between items-center shrink-0 gap-4">
            <div className="font-semibold text-xl items-center text-text-primary">
              {getRouteTitle(pathname as IRoute)}
            </div>
            <div className="gap-7 flex items-center">
              <Search
                onChange={(value) =>
                  dispatch({ setState: { tableSearchValue: value } })
                }
                value={state.tableSearchValue}
              />
              <TableFilter
                filters={filterOptions}
                values={filterValues}
                onChange={setFilterValues}
              />
              <CreateNewAssetButton categoryId={3} />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <AssetsTable
              refreshTrigger={state.refreshTrigger}
              searchValue={state.tableSearchValue}
              filterValues={filterValues}
              categoryId={3}
              filedsToInlcude={[...commonAssetFields]}
            />
          </div>
        </div>
      </ContentWrapper>
    </DashboardWrapper>
  );
};

export default Applications;
