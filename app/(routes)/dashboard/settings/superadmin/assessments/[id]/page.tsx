"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ContentWrapper from "@/app/components/content-wrapper";
import DashboardWrapper from "@/app/components/dashboard-wrapper";
import AssessmentItemsTable from "./components/assessment-items-table";
import Search from "@/app/components/search";
import TableFilter from "@/app/components/table-filter";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useAssessmentItemFilters } from "@/app/hooks/useAssessmentItemFilters";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { CreateNewAssessmentItemButton } from "./components/create-new-assessment-item-button";
import CreateNewAssessmentItemModal from "./components/create-new-assessment-item-modal";

interface AssessmentItemsPageProps {}

const AssessmentItemsPage: React.FC<AssessmentItemsPageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params?.id as string;
  const [state, dispatch] = useGlobalContext();
  const [searchValue, setSearchValue] = useState("");
  const [assessmentName, setAssessmentName] = useState<string>("");
  const { filterValues, setFilterValues, filterOptions } =
    useAssessmentItemFilters({
      includeFilters: {
        title: true,
        category: true,
        required: true,
        is_active: true,
      },
    });

  // Fetch assessment name
  useEffect(() => {
    const fetchAssessmentName = async () => {
      if (!assessmentId) return;

      const { data, error } = await supabase
        .from("assessment_catalog")
        .select("name")
        .eq("id", assessmentId)
        .single();

      if (!error && data) {
        setAssessmentName(data.name);
      }
    };

    fetchAssessmentName();
  }, [assessmentId]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleBack = useCallback(() => {
    router.push("/dashboard/settings/superadmin/assessments");
  }, [router]);

  const handleCreateSuccess = useCallback(async () => {
    dispatch({ closeModal: "createAssessmentItem" });
    dispatch({ setState: { refreshTrigger: (state.refreshTrigger || 0) + 1 } });
  }, [dispatch, state.refreshTrigger]);

  if (!assessmentId) {
    return (
      <DashboardWrapper>
        <ContentWrapper showWithoutTenant filedsToInlcude={[]}>
          <div className="flex items-center justify-center py-8 text-failure">
            Assessment ID not found
          </div>
        </ContentWrapper>
      </DashboardWrapper>
    );
  }

  return (
    <>
      <DashboardWrapper>
        <ContentWrapper showWithoutTenant filedsToInlcude={[]}>
          <div className="flex flex-col rounded-3xl p-6 gap-3 min-h-0 flex-1">
            <div className="flex justify-between items-center shrink-0 gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="p-1.5 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer"
                  aria-label="Back to assessments"
                >
                  <ArrowLeft size={20} className="text-text-primary" />
                </button>
                <div className="font-semibold text-xl items-center text-text-primary">
                  {assessmentName
                    ? `Settings / Superadmin / Assessments / ${assessmentName}`
                    : "Assessment Items"}
                </div>
              </div>
              <div className="gap-4 flex items-center">
                <Search onChange={handleSearchChange} value={searchValue} />
                <TableFilter
                  filters={filterOptions}
                  values={filterValues}
                  onChange={setFilterValues}
                />
                <CreateNewAssessmentItemButton />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <AssessmentItemsTable
                assessmentId={assessmentId}
                searchValue={searchValue}
                filterValues={filterValues}
                refreshTrigger={state.refreshTrigger}
              />
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>

      <CreateNewAssessmentItemModal
        isOpen={state.modals.createAssessmentItem || false}
        onClose={() => dispatch({ closeModal: "createAssessmentItem" })}
        onSuccess={handleCreateSuccess}
        assessmentId={assessmentId}
      />
    </>
  );
};

export default AssessmentItemsPage;
