"use client";

import { useState, useCallback } from "react";
import ContentWrapper from "@/app/components/ContentWrapper";
import DashboardWrapper from "@/app/components/DashboardWrapper";
import TenantsTable from "@/app/components/TenantsTable";
import { CreateNewTenantButton } from "@/app/components/CreateNewTenantButton";
import CreateTenant from "@/app/modals/CreateTenant";
import Search from "@/app/components/Search";
import TableFilter from "@/app/components/TableFilter";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useTenantFilters } from "@/app/hooks/useTenantFilters";

interface TenantsManagementProps {}

const TenantsManagement: React.FC<TenantsManagementProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [searchValue, setSearchValue] = useState("");
  const { filterValues, setFilterValues, filterOptions } = useTenantFilters({
    includeFilters: {
      status: true,
      country: true,
      contact_name: true,
    },
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    dispatch({ closeModal: "createTenant" });
    dispatch({ setState: { refreshTrigger: (state.refreshTrigger || 0) + 1 } });
  }, [dispatch, state.refreshTrigger]);

  return (
    <>
      <DashboardWrapper>
        <ContentWrapper showWithoutTenant filedsToInlcude={[]}>
          <div className="flex flex-col rounded-3xl p-6 gap-3 min-h-0 flex-1">
            <div className="flex justify-between items-center shrink-0 gap-4">
              <div className="font-semibold text-xl items-center text-text-primary">
                Tenants Management
              </div>
              <div className="gap-4 flex items-center">
                <Search onChange={handleSearchChange} value={searchValue} />
                <TableFilter
                  filters={filterOptions}
                  values={filterValues}
                  onChange={setFilterValues}
                />
                <CreateNewTenantButton />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <TenantsTable
                searchValue={searchValue}
                filterValues={filterValues}
                refreshTrigger={state.refreshTrigger}
              />
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>
      <CreateTenant
        isOpen={state.modals.createTenant || false}
        onClose={() => dispatch({ closeModal: "createTenant" })}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default TenantsManagement;
