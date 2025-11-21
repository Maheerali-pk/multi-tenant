"use client";

import { useState, useCallback } from "react";
import ContentWrapper from "@/app/components/ContentWrapper";
import DashboardWrapper from "@/app/components/DashboardWrapper";
import UsersTable from "@/app/components/UsersTable";
import Search from "@/app/components/Search";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

interface UsersManagementProps {}

const UsersManagement: React.FC<UsersManagementProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
    },
    []
  );

  return (
    <DashboardWrapper>
      <ContentWrapper filedsToInlcude={[]}>
        <div className="flex flex-col rounded-3xl p-6 gap-3 min-h-0 flex-1">
          <div className="flex justify-between items-center shrink-0 gap-4">
            <div className="font-semibold text-xl items-center text-text-primary">
              Users Management
            </div>
            <div className="gap-4 flex items-center">
              <Search
                onChange={handleSearchChange}
                value={searchValue}
              />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <UsersTable
              searchValue={searchValue}
              refreshTrigger={state.refreshTrigger}
            />
          </div>
        </div>
      </ContentWrapper>
    </DashboardWrapper>
  );
};

export default UsersManagement;
