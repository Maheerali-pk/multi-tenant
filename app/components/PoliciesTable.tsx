"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./Table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import { FilterValues } from "./TableFilter";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

type Policy = Tables<"policies">;
type DocumentLifecycleStatus = Tables<"document_lifecycle_statuses">;

export interface PolicyRow {
  id: string;
  title: string; // name field from policies
  creator: string | null;
  owner: string | null;
  approver: string | null;
  status: string | null; // status name from policy_lifecycle_statuses
  statusId: number | null;
  version: string | null;
  nextReviewDate: string | null;
}

interface PoliciesTableProps {
  onEdit?: (row: PolicyRow) => void;
  onDelete?: (row: PolicyRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  refreshTrigger?: number;
  onEditClick?: (policyId: string) => void;
  onDeleteClick?: (policy: PolicyRow) => void;
}

const PoliciesTable: React.FC<PoliciesTableProps> = ({
  searchValue = "",
  filterValues = {},
  refreshTrigger,
  onEdit,
  onDelete,
  onEditClick,
  onDeleteClick,
}) => {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Fetch policies
      const { data: policiesData, error: policiesError } = await supabase
        .from("policies")
        .select("*")
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
        };
      });

      setPolicies(transformedData);
    } catch (err) {
      console.error("Unexpected error fetching policies:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [auth.userData?.role, auth.userData?.tenant_id, state.selectedTenantId]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies, refreshTrigger]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Helper function to get status badge styles
  const getStatusBadgeStyles = (status: string | null): React.CSSProperties => {
    if (!status) {
      return {
        backgroundColor: "rgba(100, 116, 139, 0.15)",
        color: "#475569",
      };
    }

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "draft":
        return {
          backgroundColor: "rgba(100, 116, 139, 0.15)",
          color: "#475569",
        };
      case "under review":
      case "under_review":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          color: "#2563eb",
        };
      case "changes required":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          color: "#d97706",
        };
      case "approved":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          color: "#059669",
        };
      case "published":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          color: "#059669",
        };
      case "active":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          color: "#059669",
        };
      case "rejected":
        return {
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          color: "#dc2626",
        };
      case "archived":
        return {
          backgroundColor: "rgba(100, 116, 139, 0.15)",
          color: "#475569",
        };
      default:
        return {
          backgroundColor: "rgba(100, 116, 139, 0.15)",
          color: "#475569",
        };
    }
  };

  // Helper function to render status badge
  const renderStatusBadge = (status: string | null) => {
    if (!status) return "-";

    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1"
        style={getStatusBadgeStyles(status)}
      >
        {status}
      </span>
    );
  };

  // Apply search and filter values
  const filteredData = useMemo(() => {
    let result = [...policies];

    // Apply search filter
    if (searchValue && searchValue.trim() !== "") {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(
        (row) =>
          row.title.toLowerCase().includes(searchLower) ||
          (row.creator && row.creator.toLowerCase().includes(searchLower)) ||
          (row.owner && row.owner.toLowerCase().includes(searchLower)) ||
          (row.approver && row.approver.toLowerCase().includes(searchLower)) ||
          (row.status && row.status.toLowerCase().includes(searchLower)) ||
          (row.version && row.version.toLowerCase().includes(searchLower))
      );
    }

    // Apply title filter
    if (filterValues.title && filterValues.title.trim() !== "") {
      const titleFilter = filterValues.title.toLowerCase();
      result = result.filter((row) =>
        row.title.toLowerCase().includes(titleFilter)
      );
    }

    // Apply status filter
    if (filterValues.status && filterValues.status.trim() !== "") {
      result = result.filter((row) => row.status === filterValues.status);
    }

    // Apply creator filter
    if (filterValues.creator && filterValues.creator.trim() !== "") {
      result = result.filter((row) => row.creator === filterValues.creator);
    }

    // Apply owner filter
    if (filterValues.owner && filterValues.owner.trim() !== "") {
      result = result.filter((row) => row.owner === filterValues.owner);
    }

    // Apply approver filter
    if (filterValues.approver && filterValues.approver.trim() !== "") {
      result = result.filter((row) => row.approver === filterValues.approver);
    }

    return result;
  }, [policies, searchValue, filterValues]);

  const columns: TableColumn<PolicyRow>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      width: "20%",
    },
    {
      key: "creator",
      header: "Creator",
      sortable: true,
      width: "15%",
      render: (row) => row.creator || "-",
    },
    {
      key: "owner",
      header: "Owner",
      sortable: true,
      width: "15%",
      render: (row) => row.owner || "-",
    },
    {
      key: "approver",
      header: "Approver",
      sortable: true,
      width: "15%",
      render: (row) => row.approver || "-",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "12%",
      render: (row) => renderStatusBadge(row.status),
    },
    {
      key: "version",
      header: "Version",
      sortable: true,
      width: "10%",
      render: (row) => row.version || "-",
    },
    {
      key: "nextReviewDate",
      header: "Next Review Date",
      sortable: true,
      width: "13%",
      render: (row) => formatDate(row.nextReviewDate),
      customSort: (a, b, direction) => {
        const aDate = a ? new Date(a).getTime() : 0;
        const bDate = b ? new Date(b).getTime() : 0;
        return direction === "asc" ? aDate - bDate : bDate - aDate;
      },
    },
  ];

  // Default handlers
  const handleEdit = (row: PolicyRow) => {
    if (onEditClick) {
      onEditClick(row.id);
    } else if (onEdit) {
      onEdit(row);
    }
  };
  const handleDelete = (row: PolicyRow) => {
    if (onDeleteClick) {
      onDeleteClick(row);
    } else if (onDelete) {
      onDelete(row);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-secondary">
        Loading policies...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-failure">
        {error}
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      rows={filteredData}
      onEdit={handleEdit}
      onDelete={handleDelete}
      getRowKey={(row) => row.id}
      itemsPerPage={10}
    />
  );
};

export default PoliciesTable;
