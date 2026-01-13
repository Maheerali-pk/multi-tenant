"use client";

import { useState, useCallback } from "react";
import ContentWrapper from "@/app/components/content-wrapper";
import DashboardWrapper from "@/app/components/dashboard-wrapper";
import UsersTable from "@/app/components/users-table";
import Search from "@/app/components/search";
import TableFilter from "@/app/components/table-filter";
import { CreateNewUserButton } from "@/app/components/create-new-user-button";
import CreateNewUserModal from "@/app/modals/create-new-user-modal";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useUserFilters } from "@/app/hooks/useUserFilters";
import { getRouteTitle } from "@/app/helpers/data";
import { IRoute } from "@/app/types/routes.types";
import { usePathname } from "next/navigation";

interface UsersManagementProps {}

const UsersManagement: React.FC<UsersManagementProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [searchValue, setSearchValue] = useState("");
  const pathname = usePathname();
  const { filterValues, setFilterValues, filterOptions } = useUserFilters({
    includeFilters: {
      role: true,
      tenant: true,
      title: true,
    },
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    dispatch({ closeModal: "createUser" });
    dispatch({ setState: { refreshTrigger: (state.refreshTrigger || 0) + 1 } });
  }, [dispatch, state.refreshTrigger]);

  return (
    <>
      <DashboardWrapper>
        <ContentWrapper showWithoutTenant filedsToInlcude={[]}>
          <div className="flex flex-col rounded-3xl p-6 gap-3 min-h-0 flex-1">
            <div className="flex justify-between items-center shrink-0 gap-4">
              <div className="font-semibold text-xl items-center text-text-primary">
                {getRouteTitle(pathname as IRoute)}
              </div>
              <div className="gap-4 flex items-center">
                <Search onChange={handleSearchChange} value={searchValue} />
                <TableFilter
                  filters={filterOptions}
                  values={filterValues}
                  onChange={setFilterValues}
                />
                <CreateNewUserButton />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <UsersTable
                mode="superadmin"
                searchValue={searchValue}
                filterValues={filterValues}
                refreshTrigger={state.refreshTrigger}
              />
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>

      <CreateNewUserModal
        isOpen={state.modals.createUser || false}
        onClose={() => dispatch({ closeModal: "createUser" })}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default UsersManagement;
