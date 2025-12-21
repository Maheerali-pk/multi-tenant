"use client";

import { useMemo } from "react";
import Table, { TableColumn } from "@/app/components/Table";
import { FilterValues } from "@/app/components/TableFilter";

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
  // IDs for role calculation
  createdBy: string | null;
  reviewerUserId: string | null;
  approverUserId: string | null;
  policyOwnerUserId: string | null;
}

interface PoliciesTableProps {
  policies: PolicyRow[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (row: PolicyRow) => void;
  onDelete?: (row: PolicyRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  onEditClick?: (policyId: string) => void;
  onDeleteClick?: (policy: PolicyRow) => void;
}

const PoliciesTable: React.FC<PoliciesTableProps> = ({
  policies,
  loading = false,
  error = null,
  searchValue = "",
  filterValues = {},
  onEdit,
  onDelete,
  onEditClick,
  onDeleteClick,
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Helper function to transform status name to display format
  // e.g., "under-review" -> "User Review", "changes-required" -> "Changes Required"
  const formatStatusForDisplay = (status: string | null): string => {
    if (!status) return "-";

    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to get status badge styles
  const getStatusBadgeStyles = (status: string | null): React.CSSProperties => {
    if (!status) {
      return {
        backgroundColor: "rgba(100, 116, 139, 0.15)",
        color: "#475569",
      };
    }

    // Use exact database status names
    switch (status) {
      case "draft":
        return {
          backgroundColor: "rgba(100, 116, 139, 0.15)",
          color: "#475569",
        };
      case "under-review":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          color: "#2563eb",
        };
      case "changes-required":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          color: "#d97706",
        };
      case "waiting-approval":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          color: "#2563eb",
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
      case "retired":
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
        {formatStatusForDisplay(status)}
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
