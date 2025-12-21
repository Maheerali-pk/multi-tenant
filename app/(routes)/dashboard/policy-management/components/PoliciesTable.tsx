"use client";

import { useMemo } from "react";
import Table, { TableColumn } from "@/app/components/Table";
import { FilterValues } from "@/app/components/TableFilter";
import {
  formatStatusForDisplay,
  renderStatusBadge,
} from "@/app/utils/statusBadge";

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
      render: (row) => renderStatusBadge(row.status, "sm"),
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
