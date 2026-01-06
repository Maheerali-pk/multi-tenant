"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import ContentWrapper from "@/app/components/ContentWrapper";
import DashboardWrapper from "@/app/components/DashboardWrapper";
import PoliciesTable, { PolicyRow } from "../components/PoliciesTable";
import Search from "@/app/components/Search";
import TableFilter from "@/app/components/TableFilter";
import { CreateNewPolicyButton } from "../components/CreateNewPolicyButton";
import PolicyEditModal from "../components/PolicyEditModal";
import DeletePolicy from "../components/DeletePolicy";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";
import { usePolicyFilters } from "@/app/hooks/usePolicyFilters";
import { getRouteTitle } from "@/app/helpers/data";
import { IRoute } from "@/app/types/routes.types";
import { usePathname } from "next/navigation";
import type {
  PolicyModalStatus,
  PolicyUserRole,
} from "@/app/types/policy.types";
import { Tables, TablesInsert } from "@/app/types/database.types";

type Policy = Tables<"policies">;

interface SecurityPoliciesProps {}

const SecurityPolicies: React.FC<SecurityPoliciesProps> = () => {
  const [state, dispatch] = useGlobalContext();
  const [auth] = useAuthContext();
  const [searchValue, setSearchValue] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPolicyForDelete, setSelectedPolicyForDelete] =
    useState<PolicyRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  // Helper function to map status name to PolicyModalStatus
  const mapStatusToModalStatus = (status: string | null): PolicyModalStatus => {
    if (!status) return "draft";

    // Map database status names to PolicyModalStatus
    switch (status) {
      case "draft":
        return "draft";
      case "under-review": // DB has "under-review" which maps to "under-review" in PolicyModalStatus
        return "under-review";
      case "changes-required":
        return "changes-required";
      case "waiting-approval":
        return "waiting-approval";
      case "approved":
        return "approved";
      default:
        return "draft";
    }
  };

  // Fetch policies
  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine tenant ID based on user role
      const isSuperAdmin = auth.userData?.role === "superadmin";
      const tenantId = isSuperAdmin
        ? state.selectedTenantId
        : auth.userData?.tenant_id;

      if (!tenantId) {
        setError(
          isSuperAdmin ? "Please select a tenant" : "User tenant not found"
        );
        setLoading(false);
        return;
      }

      // Get current user ID
      const userId = auth.userData?.id;
      if (!userId) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Build query with filtering:
      // PRIMARY CONDITION: Always filter by tenant_id first
      // SECONDARY CONDITIONS (applied after tenant_id):
      // Show policies where:
      // 1. Status IS approved (4) - visible to everyone
      // OR
      // 2. Status IS draft (1) AND created_by = current_user_id - visible only to creator
      // OR
      // 3. Status IS changes-required (3) AND created_by = current_user_id - visible only to creator
      // OR
      // 4. Status IS under-review (2) AND (created_by = current_user_id OR reviewer_user_id = current_user_id) - creator and reviewer
      // OR
      // 5. Status IS waiting-approval (7) AND (created_by = current_user_id OR reviewer_user_id = current_user_id OR approver_user_id = current_user_id) - creator, reviewer, approver
      // OR
      // 6. policy_owner_user_id = current_user_id - owner always sees it
      const { data: policiesData, error: policiesError } = await supabase
        .from("policies")
        .select("*")
        .eq("tenant_id", tenantId) // PRIMARY: Always filter by tenant first
        .or(
          `status_id.eq.4,and(status_id.eq.1,created_by.eq.${userId}),and(status_id.eq.3,created_by.eq.${userId}),and(status_id.eq.2,or(created_by.eq.${userId},reviewer_user_id.eq.${userId})),and(status_id.eq.7,or(created_by.eq.${userId},reviewer_user_id.eq.${userId},approver_user_id.eq.${userId})),policy_owner_user_id.eq.${userId}`
        ) // SECONDARY: Status-based visibility rules
        .order("created_at", { ascending: false });

      if (policiesError) {
        console.error("Error fetching policies:", policiesError);
        setError("Failed to load policies");
        return;
      }

      if (!policiesData || policiesData.length === 0) {
        setPolicies([]);
        return;
      }

      // Get unique IDs for related data
      const creatorIds = [
        ...new Set(
          policiesData
            .map((policy) => policy.created_by)
            .filter((id): id is string => id !== null)
        ),
      ];

      const ownerTeamIds = [
        ...new Set(
          policiesData
            .map((policy) => policy.policy_owner_team_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const ownerUserIds = [
        ...new Set(
          policiesData
            .map((policy) => policy.policy_owner_user_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const approverTeamIds = [
        ...new Set(
          policiesData
            .map((policy) => policy.approver_team_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const approverUserIds = [
        ...new Set(
          policiesData
            .map((policy) => policy.approver_user_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const statusIds = [
        ...new Set(
          policiesData
            .map((policy) => policy.status_id)
            .filter((id): id is number => id !== null)
        ),
      ];

      // Fetch all related data in parallel
      const [
        creatorsResult,
        ownerTeamsResult,
        ownerUsersResult,
        approverTeamsResult,
        approverUsersResult,
        statusesResult,
      ] = await Promise.all([
        creatorIds.length > 0
          ? supabase.from("users").select("id, name").in("id", creatorIds)
          : Promise.resolve({ data: [], error: null }),
        ownerTeamIds.length > 0
          ? supabase.from("teams").select("id, name").in("id", ownerTeamIds)
          : Promise.resolve({ data: [], error: null }),
        ownerUserIds.length > 0
          ? supabase.from("users").select("id, name").in("id", ownerUserIds)
          : Promise.resolve({ data: [], error: null }),
        approverTeamIds.length > 0
          ? supabase.from("teams").select("id, name").in("id", approverTeamIds)
          : Promise.resolve({ data: [], error: null }),
        approverUserIds.length > 0
          ? supabase.from("users").select("id, name").in("id", approverUserIds)
          : Promise.resolve({ data: [], error: null }),
        statusIds.length > 0
          ? supabase
              .from("document_lifecycle_statuses")
              .select("id, name")
              .in("id", statusIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Create lookup maps
      const creatorMap = new Map(
        (creatorsResult.data || []).map(
          (user: { id: string; name: string }) => [user.id, user.name]
        )
      );

      const ownerTeamMap = new Map(
        (ownerTeamsResult.data || []).map(
          (team: { id: string; name: string }) => [team.id, team.name]
        )
      );

      const ownerUserMap = new Map(
        (ownerUsersResult.data || []).map(
          (user: { id: string; name: string }) => [user.id, user.name]
        )
      );

      const approverTeamMap = new Map(
        (approverTeamsResult.data || []).map(
          (team: { id: string; name: string }) => [team.id, team.name]
        )
      );

      const approverUserMap = new Map(
        (approverUsersResult.data || []).map(
          (user: { id: string; name: string }) => [user.id, user.name]
        )
      );

      // Create status map from fetched data
      const statusMap = new Map(
        (statusesResult.data || []).map(
          (status: { id: number; name: string }) => [status.id, status.name]
        )
      );

      // Transform the data to match our PolicyRow interface
      const transformedData: PolicyRow[] = policiesData.map((policy) => {
        // Get creator name
        const creatorName = policy.created_by
          ? creatorMap.get(policy.created_by) || null
          : null;

        // Determine owner name
        let ownerName: string | null = null;
        if (policy.policy_owner_team_id) {
          ownerName = ownerTeamMap.get(policy.policy_owner_team_id) || null;
        } else if (policy.policy_owner_user_id) {
          ownerName = ownerUserMap.get(policy.policy_owner_user_id) || null;
        }

        // Determine approver name
        let approverName: string | null = null;
        if (policy.approver_team_id) {
          approverName = approverTeamMap.get(policy.approver_team_id) || null;
        } else if (policy.approver_user_id) {
          approverName = approverUserMap.get(policy.approver_user_id) || null;
        }

        // Get status name
        const statusName = policy.status_id
          ? statusMap.get(policy.status_id) || null
          : null;

        return {
          id: policy.id,
          title: policy.title,
          creator: creatorName,
          owner: ownerName,
          approver: approverName,
          status: statusName,
          statusId: policy.status_id,
          version: policy.version,
          nextReviewDate: policy.next_review_date,
          // IDs for role calculation
          createdBy: policy.created_by,
          reviewerUserId: policy.reviewer_user_id,
          approverUserId: policy.approver_user_id,
          policyOwnerUserId: policy.policy_owner_user_id,
        };
      });

      setPolicies(transformedData);
    } catch (err) {
      console.error("Unexpected error fetching policies:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [
    auth.userData?.role,
    auth.userData?.tenant_id,
    auth.userData?.id,
    state.selectedTenantId,
  ]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies, state.refreshTrigger]);

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

  const handleClone = useCallback(
    async (policy: PolicyRow) => {
      try {
        setLoading(true);

        // Check if user is authenticated
        if (!auth.userData?.id) {
          toast.error("User not authenticated");
          setLoading(false);
          return;
        }

        // Determine tenant ID
        const isSuperAdmin = auth.userData?.role === "superadmin";
        const tenantId = isSuperAdmin
          ? state.selectedTenantId
          : auth.userData?.tenant_id;

        if (!tenantId) {
          toast.error(
            isSuperAdmin ? "Please select a tenant" : "User tenant not found"
          );
          setLoading(false);
          return;
        }

        // Fetch full policy data including content fields
        const { data: fullPolicy, error: fetchError } = await supabase
          .from("policies")
          .select("*")
          .eq("id", policy.id)
          .single();

        if (fetchError || !fullPolicy) {
          console.error("Error fetching policy:", fetchError);
          toast.error("Failed to fetch policy data");
          setLoading(false);
          return;
        }

        // Find draft status ID
        const { data: draftStatus, error: statusError } = await supabase
          .from("document_lifecycle_statuses")
          .select("id")
          .eq("name", "draft")
          .single();

        if (statusError || !draftStatus) {
          console.error("Error fetching draft status:", statusError);
          toast.error("Failed to find draft status");
          setLoading(false);
          return;
        }

        // Prepare cloned policy data
        const clonedPolicyData: TablesInsert<"policies"> = {
          title: `Copy of ${fullPolicy.title}`,
          created_by: auth.userData.id,
          created_at: new Date().toISOString(),
          tenant_id: tenantId,
          policy_owner_team_id: fullPolicy.policy_owner_team_id,
          policy_owner_user_id: fullPolicy.policy_owner_user_id,
          reviewer_team_id: fullPolicy.reviewer_team_id,
          reviewer_user_id: fullPolicy.reviewer_user_id,
          approver_team_id: fullPolicy.approver_team_id,
          approver_user_id: fullPolicy.approver_user_id,
          classification_id: fullPolicy.classification_id,
          status_id: draftStatus.id,
          document_type_id: fullPolicy.document_type_id,
          version: "1.0",
          objective: fullPolicy.objective,
          scope: fullPolicy.scope,
          requirements: fullPolicy.requirements,
          // Set these to null/empty as per requirements
          reviewed_at: null,
          approved_at: null,
          effective_date: null,
          next_review_date: null,
        };

        // Insert the cloned policy
        const { data: clonedPolicy, error: insertError } = await supabase
          .from("policies")
          .insert(clonedPolicyData)
          .select()
          .single();

        if (insertError) {
          console.error("Error cloning policy:", insertError);
          toast.error(insertError.message || "Failed to clone policy");
          setLoading(false);
          return;
        }

        // Show success toast
        toast.success(`Policy "${policy.title}" has been cloned successfully`);

        // Refresh policies table by incrementing refreshTrigger
        dispatch({
          setState: {
            refreshTrigger: (state.refreshTrigger || 0) + 1,
          },
        });
      } catch (err) {
        console.error("Error cloning policy:", err);
        toast.error("An unexpected error occurred while cloning policy");
      } finally {
        setLoading(false);
      }
    },
    [
      auth.userData?.id,
      auth.userData?.role,
      auth.userData?.tenant_id,
      state.selectedTenantId,
      dispatch,
      state.refreshTrigger,
    ]
  );
  const editModalStatus = useMemo(() => {
    return selectedPolicyId
      ? mapStatusToModalStatus(
          policies.find((p) => p.id === selectedPolicyId)?.status || null
        )
      : "draft";
  }, [selectedPolicyId, policies]);

  // Calculate user role for the selected policy
  const userRolesForPolicy: PolicyUserRole[] = useMemo((): PolicyUserRole[] => {
    if (!selectedPolicyId || !auth.userData?.id) return [];

    const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);
    if (!selectedPolicy) return [];

    const userId = auth.userData.id;

    const userRoles: PolicyUserRole[] = [];
    // Check in priority order: creator, reviewer, approver, owner
    if (selectedPolicy.createdBy === userId) {
      userRoles.push("creator");
    }
    if (selectedPolicy.reviewerUserId === userId) {
      userRoles.push("reviewer");
    }
    if (selectedPolicy.approverUserId === userId) {
      userRoles.push("approver");
    }
    if (selectedPolicy.policyOwnerUserId === userId) {
      userRoles.push("owner");
    }

    // Return undefined if user has no role (don't pass "none" as it's not useful for overrides)
    return userRoles;
  }, [selectedPolicyId, policies, auth.userData?.id]);

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
                policies={policies}
                loading={loading}
                error={error}
                searchValue={searchValue}
                filterValues={filterValues}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                onClone={handleClone}
              />
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>
      <PolicyEditModal
        isOpen={state.modals.createPolicy || false}
        onClose={() => dispatch({ closeModal: "createPolicy" })}
        onSuccess={handleCreateSuccess}
        policyId={null}
      />
      <PolicyEditModal
        isOpen={editModalOpen}
        status={editModalStatus}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        policyId={selectedPolicyId}
        userRolesForPolicy={userRolesForPolicy}
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
