"use client";

import { useState, useCallback } from "react";
import ContentWrapper from "@/app/components/content-wrapper";
import DashboardWrapper from "@/app/components/dashboard-wrapper";
import AssessmentsTable from "./components/assessments-table";
import Search from "@/app/components/search";
import TableFilter from "@/app/components/table-filter";
import { CreateNewAssessmentButton } from "./components/create-new-assessment-button";
import CreateNewAssessmentModal from "./components/create-new-assessment-modal";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useAssessmentFilters } from "@/app/hooks/useAssessmentFilters";
import { getRouteTitle } from "@/app/helpers/data";
import { IRoute } from "@/app/types/routes.types";
import { usePathname } from "next/navigation";

interface AssessmentsManagementProps {}

const AssessmentsManagement: React.FC<AssessmentsManagementProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [searchValue, setSearchValue] = useState("");
  const pathname = usePathname();
  const { filterValues, setFilterValues, filterOptions } = useAssessmentFilters(
    {
      includeFilters: {
        name: true,
        status: true,
        tenant: true,
        version: true,
      },
    }
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    dispatch({ closeModal: "createAssessment" });
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
                <CreateNewAssessmentButton />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <AssessmentsTable
                searchValue={searchValue}
                filterValues={filterValues}
                refreshTrigger={state.refreshTrigger}
              />
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>

      <CreateNewAssessmentModal
        isOpen={state.modals.createAssessment || false}
        onClose={() => dispatch({ closeModal: "createAssessment" })}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default AssessmentsManagement;
