"use client";

import { useState, useCallback } from "react";
import ContentWrapper from "@/app/components/content-wrapper";
import DashboardWrapper from "@/app/components/dashboard-wrapper";
import TeamsTable from "@/app/components/teams-table";
import Search from "@/app/components/search";
import TableFilter from "@/app/components/table-filter";
import { CreateNewTeamButton } from "@/app/components/create-new-team-button";
import CreateTeam from "@/app/modals/create-team";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useTeamFilters } from "@/app/hooks/useTeamFilters";
import { getRouteTitle } from "@/app/helpers/data";
import { IRoute } from "@/app/types/routes.types";
import { usePathname } from "next/navigation";

interface TeamsManagementProps {}

const TeamsManagement: React.FC<TeamsManagementProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [searchValue, setSearchValue] = useState("");
  const pathname = usePathname();
  const { filterValues, setFilterValues, filterOptions } = useTeamFilters({
    includeFilters: {
      email: true,
    },
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    dispatch({ closeModal: "createTeam" });
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
                <CreateNewTeamButton />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <TeamsTable
                searchValue={searchValue}
                filterValues={filterValues}
                refreshTrigger={state.refreshTrigger}
              />
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>
      <CreateTeam
        isOpen={state.modals.createTeam || false}
        onClose={() => dispatch({ closeModal: "createTeam" })}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default TeamsManagement;
