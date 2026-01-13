"use client";

import { useState, useCallback } from "react";
import ContentWrapper from "@/app/components/content-wrapper";
import DashboardWrapper from "@/app/components/dashboard-wrapper";
import UsersTable from "@/app/components/users-table";
import Search from "@/app/components/search";
import TableFilter from "@/app/components/table-filter";
import { CreateUserForTenantButton } from "@/app/components/create-user-for-tenant-button";
import CreateUserModalForTenantAdmin from "@/app/modals/create-user-modal-for-tenant-admin";
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
      tenant: false, // Tenant admin doesn't need tenant filter since they only see their own tenant
      title: true,
    },
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    dispatch({ closeModal: "createUserForTenant" });
    dispatch({ setState: { refreshTrigger: (state.refreshTrigger || 0) + 1 } });
  }, [dispatch, state.refreshTrigger]);

  return (
    <>
      <DashboardWrapper>
        <ContentWrapper filedsToInlcude={[]}>
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
                <CreateUserForTenantButton />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <UsersTable
                mode="tenant_admin"
                searchValue={searchValue}
                filterValues={filterValues}
                refreshTrigger={state.refreshTrigger}
              />
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>
      <CreateUserModalForTenantAdmin
        isOpen={state.modals.createUserForTenant || false}
        onClose={() => dispatch({ closeModal: "createUserForTenant" })}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default UsersManagement;
