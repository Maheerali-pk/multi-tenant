"use client";
import AssetsTable from "@/app/components/AssetsTable";
import ContentWrapper from "@/app/components/ContentWrapper";
import Header from "@/app/components/Header";
import Search from "@/app/components/Search";
import Sidebar from "@/app/components/Sidebar";
import TableFilter from "@/app/components/TableFilter";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { ExampleTable1 } from "@/app/helpers/data";
import { useAssetFilters } from "@/app/hooks/useAssetFilters";
import { CreateNewAssetButton } from "@/app/components/CreateNewAssetButton";

interface ApplicationsProps {}

const Applications: React.FC<ApplicationsProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const { filterValues, setFilterValues, filterOptions } = useAssetFilters({
    includeFilters: {
      name: true,
      subcategory: true,
    },
    categoryId: 2,
  });

  return (
    <div className="grid grid-cols-[min-content_auto] gap-3 p-3 bg-bg-outer h-full w-full">
      <Sidebar></Sidebar>
      <ContentWrapper>
        <div className="flex flex-col rounded-3xl  p-6 gap-6 min-h-0 flex-1">
          <div className="flex justify-between shrink-0">
            <div className="font-semibold text-2xl items-center text-text-primary">
              Assets Management / Network and Infrastructure management
            </div>
            <div className="gap-7 flex items-center">
              <Search
                onChange={(value) =>
                  dispatch({ setState: { tableSearchValue: value } })
                }
                value={state.tableSearchValue}
              />
              <CreateNewAssetButton />
            </div>
          </div>
          <div className="shrink-0">
            <TableFilter
              filters={filterOptions}
              values={filterValues}
              onChange={setFilterValues}
            />
          </div>
          <div className="flex-1 min-h-0">
            <AssetsTable
              filterValues={filterValues}
              searchValue={state.tableSearchValue}
              categoryId={2}
            />
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default Applications;
