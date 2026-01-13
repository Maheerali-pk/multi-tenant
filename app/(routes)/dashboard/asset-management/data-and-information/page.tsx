"use client";
import AssetsTable from "@/app/components/assets-table";
import ContentWrapper from "@/app/components/content-wrapper";
import Search from "@/app/components/search";
import TableFilter from "@/app/components/table-filter";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useAssetFilters } from "@/app/hooks/useAssetFilters";
import { commonAssetFields, getRouteTitle } from "@/app/helpers/data";
import { CreateNewAssetButton } from "@/app/components/create-new-asset-button";
import DashboardWrapper from "@/app/components/dashboard-wrapper";
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
    categoryId: 4,
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
              <CreateNewAssetButton categoryId={4} />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <AssetsTable
              refreshTrigger={state.refreshTrigger}
              filterValues={filterValues}
              searchValue={state.tableSearchValue}
              categoryId={4}
              filedsToInlcude={[...commonAssetFields]}
            />
          </div>
        </div>
      </ContentWrapper>
    </DashboardWrapper>
  );
};

export default Applications;
