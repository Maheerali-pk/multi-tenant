"use client";

import { useCallback } from "react";
import ContentWrapper from "@/app/components/ContentWrapper";
import DashboardWrapper from "@/app/components/DashboardWrapper";
import TenantsTable from "@/app/components/TenantsTable";
import { CreateNewTenantButton } from "@/app/components/CreateNewTenantButton";
import CreateTenant from "@/app/modals/CreateTenant";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

interface TenantsManagementProps {}

const TenantsManagement: React.FC<TenantsManagementProps> = () => {
  const [state, dispatch] = useGlobalContext();

  const handleCreateSuccess = useCallback(async () => {
    dispatch({ closeModal: "createTenant" });
    dispatch({ setState: { refreshTrigger: (state.refreshTrigger || 0) + 1 } });
  }, [dispatch, state.refreshTrigger]);

  return (
    <>
      <DashboardWrapper>
        <ContentWrapper filedsToInlcude={[]}>
          <div className="flex flex-col rounded-3xl p-6 gap-3 min-h-0 flex-1">
            <div className="flex justify-between items-center shrink-0 gap-4">
              <div className="font-semibold text-xl items-center text-text-primary">
                Tenants Management
              </div>
              <CreateNewTenantButton />
            </div>
            <div className="flex-1 min-h-0">
              <TenantsTable refreshTrigger={state.refreshTrigger} />
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
