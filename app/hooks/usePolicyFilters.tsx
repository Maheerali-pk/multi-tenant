"use client";

import { useState, useMemo, useEffect } from "react";
import { FilterOption, FilterValues } from "@/app/components/table-filter";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

interface UsePolicyFiltersOptions {
  includeFilters?: {
    title?: boolean;
    status?: boolean;
    creator?: boolean;
    owner?: boolean;
    approver?: boolean;
  };
}

export const usePolicyFilters = ({
  includeFilters = {
    title: true,
    status: true,
    creator: true,
    owner: true,
    approver: true,
  },
}: UsePolicyFiltersOptions = {}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [creatorOptions, setCreatorOptions] = useState<string[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<string[]>([]);
  const [approverOptions, setApproverOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoading(true);

        // Determine tenant ID based on user role
        const isSuperAdmin = auth.userData?.role === "superadmin";
        const tenantId = isSuperAdmin
          ? state.selectedTenantId
          : auth.userData?.tenant_id;

        if (!tenantId) {
          setLoading(false);
          return;
        }

        // Fetch all filter data in parallel
        const [
          policiesResult,
          teamsResult,
          usersResult,
          documentLifecycleStatusesResult,
        ] = await Promise.all([
          supabase
            .from("policies")
            .select(
              "created_by, policy_owner_team_id, policy_owner_user_id, approver_team_id, approver_user_id, status_id"
            ),
          includeFilters.owner || includeFilters.approver
            ? supabase
                .from("teams")
                .select("id, name")
                .eq("tenant_id", tenantId)
                .order("name")
            : Promise.resolve({ data: [], error: null }),
          includeFilters.creator ||
          includeFilters.owner ||
          includeFilters.approver
            ? tenantId
              ? supabase
                  .from("users")
                  .select("id, name")
                  .eq("tenant_id", tenantId)
                  .order("name")
              : Promise.resolve({ data: [], error: null })
            : Promise.resolve({ data: [], error: null }),
          includeFilters.status
            ? supabase
                .from("document_lifecycle_statuses")
                .select("id, name")
                .order("name")
            : Promise.resolve({ data: [], error: null }),
        ]);

        // Extract status options
        if (
          includeFilters.status &&
          documentLifecycleStatusesResult.data &&
          documentLifecycleStatusesResult.data.length > 0
        ) {
          const statusNames = documentLifecycleStatusesResult.data.map(
            (s: { id: number; name: string }) => s.name
          );
          setStatusOptions(statusNames);
        }

        // Extract unique creator names
        if (includeFilters.creator && policiesResult.data && usersResult.data) {
          const creatorIds = [
            ...new Set(
              policiesResult.data
                .map((p: any) => p.created_by)
                .filter((id: string | null): id is string => id !== null)
            ),
          ];
          const creatorMap = new Map(
            usersResult.data.map((u: { id: string; name: string }) => [
              u.id,
              u.name,
            ])
          );
          const creatorNames = creatorIds
            .map((id) => creatorMap.get(id))
            .filter((name): name is string => name !== undefined);
          setCreatorOptions([...new Set(creatorNames)]);
        }

        // Extract unique owner names (teams and users)
        if (includeFilters.owner && policiesResult.data) {
          const ownerNames = new Set<string>();
          if (teamsResult.data) {
            const ownerTeamIds = [
              ...new Set(
                policiesResult.data
                  .map((p: any) => p.policy_owner_team_id)
                  .filter((id: string | null): id is string => id !== null)
              ),
            ];
            const teamMap = new Map(
              teamsResult.data.map((t: { id: string; name: string }) => [
                t.id,
                t.name,
              ])
            );
            ownerTeamIds.forEach((id) => {
              const name = teamMap.get(id);
              if (name) ownerNames.add(name);
            });
          }
          if (usersResult.data) {
            const ownerUserIds = [
              ...new Set(
                policiesResult.data
                  .map((p: any) => p.policy_owner_user_id)
                  .filter((id: string | null): id is string => id !== null)
              ),
            ];
            const userMap = new Map(
              usersResult.data.map((u: { id: string; name: string }) => [
                u.id,
                u.name,
              ])
            );
            ownerUserIds.forEach((id) => {
              const name = userMap.get(id);
              if (name) ownerNames.add(name);
            });
          }
          setOwnerOptions(Array.from(ownerNames).sort());
        }

        // Extract unique approver names (teams and users)
        if (includeFilters.approver && policiesResult.data) {
          const approverNames = new Set<string>();
          if (teamsResult.data) {
            const approverTeamIds = [
              ...new Set(
                policiesResult.data
                  .map((p: any) => p.approver_team_id)
                  .filter((id: string | null): id is string => id !== null)
              ),
            ];
            const teamMap = new Map(
              teamsResult.data.map((t: { id: string; name: string }) => [
                t.id,
                t.name,
              ])
            );
            approverTeamIds.forEach((id) => {
              const name = teamMap.get(id);
              if (name) approverNames.add(name);
            });
          }
          if (usersResult.data) {
            const approverUserIds = [
              ...new Set(
                policiesResult.data
                  .map((p: any) => p.approver_user_id)
                  .filter((id: string | null): id is string => id !== null)
              ),
            ];
            const userMap = new Map(
              usersResult.data.map((u: { id: string; name: string }) => [
                u.id,
                u.name,
              ])
            );
            approverUserIds.forEach((id) => {
              const name = userMap.get(id);
              if (name) approverNames.add(name);
            });
          }
          setApproverOptions(Array.from(approverNames).sort());
        }
      } catch (err) {
        console.error("Error fetching filter data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, [
    includeFilters,
    auth.userData?.role,
    auth.userData?.tenant_id,
    state.selectedTenantId,
  ]);

  // Build filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    const options: FilterOption[] = [];

    if (includeFilters.title) {
      options.push({
        key: "title",
        label: "Title",
        type: "text",
        placeholder: "Search by title...",
      });
    }

    if (includeFilters.status) {
      options.push({
        key: "status",
        label: "Status",
        type: "select",
        options: statusOptions.map((status) => ({
          value: status,
          label: status,
        })),
        placeholder: "All statuses",
      });
    }

    if (includeFilters.creator) {
      options.push({
        key: "creator",
        label: "Creator",
        type: "select",
        options: creatorOptions.map((creator) => ({
          value: creator,
          label: creator,
        })),
        placeholder: "All creators",
      });
    }

    if (includeFilters.owner) {
      options.push({
        key: "owner",
        label: "Owner",
        type: "select",
        options: ownerOptions.map((owner) => ({
          value: owner,
          label: owner,
        })),
        placeholder: "All owners",
      });
    }

    if (includeFilters.approver) {
      options.push({
        key: "approver",
        label: "Approver",
        type: "select",
        options: approverOptions.map((approver) => ({
          value: approver,
          label: approver,
        })),
        placeholder: "All approvers",
      });
    }

    return options;
  }, [
    includeFilters,
    statusOptions,
    creatorOptions,
    ownerOptions,
    approverOptions,
  ]);

  return {
    filterValues,
    setFilterValues,
    filterOptions,
    loading,
  };
};
