"use client";

import { useState, useCallback, useMemo } from "react";
import ContentWrapper from "@/app/components/ContentWrapper";
import DashboardWrapper from "@/app/components/DashboardWrapper";
import PoliciesTable from "@/app/components/PoliciesTable";
import Search from "@/app/components/Search";
import TableFilter from "@/app/components/TableFilter";
import { CreateNewPolicyButton } from "@/app/components/CreateNewPolicyButton";
import CreateNewPolicyModal from "@/app/modals/CreateNewPolicyModal";
import PolicyEditModal from "@/app/modals/PolicyEditModal";
import DeletePolicy from "@/app/modals/DeletePolicy";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";
import type { PolicyRow } from "@/app/components/PoliciesTable";
import { usePolicyFilters } from "@/app/hooks/usePolicyFilters";
import { getRouteTitle } from "@/app/helpers/data";
import { IRoute } from "@/app/types/routes.types";
import { usePathname } from "next/navigation";

interface SecurityPoliciesProps {}

const SecurityPolicies: React.FC<SecurityPoliciesProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [searchValue, setSearchValue] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPolicyForDelete, setSelectedPolicyForDelete] =
    useState<PolicyRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const pathname = usePathname();

  // Memoize includeFilters to prevent infinite re-renders
  const includeFilters = useMemo(
    () => ({
      title: true,
      status: true,
      creator: true,
      owner: true,
      approver: true,
    }),
    []
  );

  const { filterValues, setFilterValues, filterOptions } = usePolicyFilters({
    includeFilters,
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    // Refresh policies table by incrementing refreshTrigger
    dispatch({
      setState: {
        refreshTrigger: (state.refreshTrigger || 0) + 1,
      },
    });
  }, [dispatch, state.refreshTrigger]);

  const handleEditClick = useCallback((policyId: string) => {
    setSelectedPolicyId(policyId);
    setEditModalOpen(true);
  }, []);

  const handleEditSuccess = useCallback(async () => {
    // Refresh policies table by incrementing refreshTrigger
    dispatch({
      setState: {
        refreshTrigger: (state.refreshTrigger || 0) + 1,
      },
    });
    setEditModalOpen(false);
    setSelectedPolicyId(null);
  }, [dispatch, state.refreshTrigger]);

  const handleEditClose = useCallback(() => {
    setEditModalOpen(false);
    setSelectedPolicyId(null);
  }, []);

  const handleDeleteClick = useCallback((policy: PolicyRow) => {
    setSelectedPolicyForDelete(policy);
    setSelectedPolicyId(policy.id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setSelectedPolicyForDelete(null);
    setSelectedPolicyId(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedPolicyId) return;

    setDeleteLoading(true);
    try {
      // First, delete all comments associated with this policy
      const { error: commentsError } = await supabase
        .from("policy_comments")
        .delete()
        .eq("policy_id", selectedPolicyId);

      if (commentsError) {
        console.error("Error deleting policy comments:", commentsError);
        // Continue with policy deletion even if comments deletion fails
      }

      // Then delete the policy
      const { error: policyError } = await supabase
        .from("policies")
        .delete()
        .eq("id", selectedPolicyId);

      if (policyError) {
        console.error("Error deleting policy:", policyError);
        toast.error(policyError.message || "Failed to delete policy");
        setDeleteLoading(false);
        return;
      }

      // Show success toast
      const policyTitle = selectedPolicyForDelete?.title || "Policy";
      toast.success(`Policy "${policyTitle}" has been deleted successfully`);

      // Close dialog and refresh policies
      setDeleteModalOpen(false);
      setSelectedPolicyForDelete(null);
      setSelectedPolicyId(null);

      // Refresh policies table by incrementing refreshTrigger
      dispatch({
        setState: {
          refreshTrigger: (state.refreshTrigger || 0) + 1,
        },
      });
    } catch (err) {
      console.error("Error deleting policy:", err);
      toast.error("Failed to delete policy");
    } finally {
      setDeleteLoading(false);
    }
  }, [
    selectedPolicyId,
    selectedPolicyForDelete,
    dispatch,
    state.refreshTrigger,
  ]);

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
                <CreateNewPolicyButton />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <PoliciesTable
                searchValue={searchValue}
                filterValues={filterValues}
                refreshTrigger={state.refreshTrigger}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
              />
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>
      <CreateNewPolicyModal
        isOpen={state.modals.createPolicy || false}
        onClose={() => dispatch({ closeModal: "createPolicy" })}
        onSuccess={handleCreateSuccess}
      />
      <PolicyEditModal
        isOpen={editModalOpen}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        policyId={selectedPolicyId}
      />
      <DeletePolicy
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        policy={selectedPolicyForDelete}
        loading={deleteLoading}
      />
    </>
  );
};

export default SecurityPolicies;
