"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import { FilterValues } from "./table-filter";
import { formatStatusForDisplay } from "@/app/utils/statusBadge";
import EditAssessmentModal from "@/app/modals/edit-assessment-modal";
import DeleteAssessment from "@/app/modals/delete-assessment";
import { toast } from "react-toastify";
import { Settings } from "lucide-react";
import Tooltip from "./tooltip";

type AssessmentCatalog = Tables<"assessment_catalog">;
type AssessmentStatus = Tables<"assessment_statuses">;
type Tenant = Tables<"tenants">;

export interface AssessmentRow extends AssessmentCatalog {
  status_name?: string | null;
  tenant_name?: string | null;
  created_by_name?: string | null;
}

interface AssessmentsTableProps {
  onEdit?: (row: AssessmentRow) => void;
  onDelete?: (row: AssessmentRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  refreshTrigger?: number;
}

const AssessmentsTable: React.FC<AssessmentsTableProps> = ({
  searchValue = "",
  filterValues = {},
  refreshTrigger,
  onEdit,
  onDelete,
}) => {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAssessmentForEdit, setSelectedAssessmentForEdit] =
    useState<AssessmentRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssessmentForDelete, setSelectedAssessmentForDelete] =
    useState<AssessmentRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper function to get assessment status badge styles
  const getAssessmentStatusBadgeStyles = (
    status: string | null | undefined
  ): React.CSSProperties => {
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
      case "published":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          color: "#059669",
        };
      case "retired":
        return {
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          color: "#dc2626",
        };
      default:
        return {
          backgroundColor: "rgba(100, 116, 139, 0.15)",
          color: "#475569",
        };
    }
  };

  // Helper function to render assessment status badge
  const renderAssessmentStatusBadge = (
    status: string | null | undefined
  ): React.ReactNode => {
    if (!status) return "-";

    return (
      <span
        className="px-2 py-1 text-xs rounded-full font-medium inline-flex items-center gap-1"
        style={getAssessmentStatusBadgeStyles(status)}
      >
        {formatStatusForDisplay(status)}
      </span>
    );
  };

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("assessment_catalog")
        .select("*")
        .order("created_at", { ascending: false });

      if (assessmentsError) {
        console.error("Error fetching assessments:", assessmentsError);
        setError("Failed to load assessments");
        return;
      }

      if (!assessmentsData || assessmentsData.length === 0) {
        setAssessments([]);
        return;
      }

      // Get unique status IDs, tenant IDs, and created_by user IDs
      const statusIds = [
        ...new Set(
          assessmentsData
            .map((a) => a.status)
            .filter((id): id is number => id !== null)
        ),
      ];
      const tenantIds = [
        ...new Set(
          assessmentsData
            .map((a) => a.tenant_id)
            .filter((id): id is string => id !== null)
        ),
      ];
      const createdByUserIds = [
        ...new Set(
          assessmentsData
            .map((a) => a.created_by)
            .filter((id): id is string => id !== null && id !== "")
        ),
      ];

      // Fetch status names
      let statusMap = new Map<number, string>();
      if (statusIds.length > 0) {
        const { data: statusData, error: statusError } = await supabase
          .from("assessment_statuses")
          .select("id, name")
          .in("id", statusIds);

        if (!statusError && statusData) {
          statusMap = new Map(
            statusData.map((status) => [status.id, status.name])
          );
        }
      }

      // Fetch tenant names
      let tenantMap = new Map<string, string>();
      if (tenantIds.length > 0) {
        const { data: tenantsData, error: tenantsError } = await supabase
          .from("tenants")
          .select("id, name")
          .in("id", tenantIds);

        if (!tenantsError && tenantsData) {
          tenantMap = new Map(
            tenantsData.map((tenant) => [tenant.id, tenant.name])
          );
        }
      }

      // Fetch creator user names
      let userMap = new Map<string, string>();
      if (createdByUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", createdByUserIds);

        if (!usersError && usersData) {
          userMap = new Map(
            usersData.map((user) => [
              user.id,
              user.name || user.email || "Unknown",
            ])
          );
        }
      }

      // Combine assessment data with status, tenant, and creator names
      const assessmentsWithDetails: AssessmentRow[] = assessmentsData.map(
        (assessment) => ({
          ...assessment,
          status_name: statusMap.get(assessment.status) || null,
          tenant_name: assessment.tenant_id
            ? tenantMap.get(assessment.tenant_id) || null
            : null,
          created_by_name: assessment.created_by
            ? userMap.get(assessment.created_by) || null
            : null,
        })
      );

      setAssessments(assessmentsWithDetails);
    } catch (err) {
      console.error("Unexpected error fetching assessments:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments, refreshTrigger]);

  // Apply search and filter values
  const filteredData = useMemo(() => {
    let result = [...assessments];

    // Apply search filter
    if (searchValue && searchValue.trim() !== "") {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(
        (row) =>
          row.name.toLowerCase().includes(searchLower) ||
          (row.description &&
            row.description.toLowerCase().includes(searchLower)) ||
          (row.version && row.version.toLowerCase().includes(searchLower)) ||
          (row.status_name &&
            row.status_name.toLowerCase().includes(searchLower)) ||
          (row.tenant_name &&
            row.tenant_name.toLowerCase().includes(searchLower)) ||
          (row.created_by_name &&
            row.created_by_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply name filter
    if (filterValues.name && filterValues.name.trim() !== "") {
      const nameFilter = filterValues.name.toLowerCase();
      result = result.filter(
        (row) => row.name && row.name.toLowerCase().includes(nameFilter)
      );
    }

    // Apply status filter
    if (filterValues.status && filterValues.status.trim() !== "") {
      result = result.filter((row) => row.status_name === filterValues.status);
    }

    // Apply tenant filter
    if (filterValues.tenant && filterValues.tenant.trim() !== "") {
      result = result.filter((row) => row.tenant_id === filterValues.tenant);
    }

    // Apply version filter
    if (filterValues.version && filterValues.version.trim() !== "") {
      const versionFilter = filterValues.version.toLowerCase();
      result = result.filter(
        (row) =>
          row.version && row.version.toLowerCase().includes(versionFilter)
      );
    }

    return result;
  }, [assessments, searchValue, filterValues]);

  const columns: TableColumn<AssessmentRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      width: "20%",
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      width: "25%",
      render: (row) => row.description || "-",
    },
    {
      key: "version",
      header: "Version",
      sortable: true,
      width: "12%",
    },
    {
      key: "status_name",
      header: "Status",
      sortable: true,
      width: "15%",
      render: (row) => renderAssessmentStatusBadge(row.status_name),
    },
    {
      key: "tenant_name",
      header: "Tenant",
      sortable: true,
      width: "15%",
      render: (row) => row.tenant_name || "-",
    },
    {
      key: "created_by_name",
      header: "Created By",
      sortable: true,
      width: "15%",
      render: (row) => row.created_by_name || "-",
    },
  ];

  const handleEditClick = useCallback((row: AssessmentRow) => {
    setSelectedAssessmentForEdit(row);
    setEditDialogOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedAssessmentForEdit(null);
  }, []);

  const handleEditSuccessWithRefresh = useCallback(async () => {
    setEditDialogOpen(false);
    setSelectedAssessmentForEdit(null);
    await fetchAssessments();
  }, [fetchAssessments]);

  const handleDeleteClick = useCallback((row: AssessmentRow) => {
    setSelectedAssessmentForDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedAssessmentForDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedAssessmentForDelete) return;

    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("assessment_catalog")
        .delete()
        .eq("id", selectedAssessmentForDelete.id);

      if (deleteError) {
        console.error("Error deleting assessment:", deleteError);
        setError(deleteError.message || "Failed to delete assessment");
        setDeleteLoading(false);
        return;
      }

      // Show success toast
      const assessmentName = selectedAssessmentForDelete.name || "Assessment";
      toast.success(
        `Assessment ${assessmentName} has been deleted successfully`
      );

      // Close dialog and refresh assessments
      setDeleteDialogOpen(false);
      setSelectedAssessmentForDelete(null);
      await fetchAssessments();
    } catch (err) {
      console.error("Error deleting assessment:", err);
      setError("Failed to delete assessment");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedAssessmentForDelete, fetchAssessments]);

  // Default handlers
  const handleEdit = onEdit || handleEditClick;
  const handleDelete = onDelete || handleDeleteClick;

  // Custom actions renderer for settings icon
  const renderCustomActions = useCallback((row: AssessmentRow) => {
    return (
      <Tooltip text="Settings" position="top">
        <button
          onClick={() => {
            // Dummy action - can be implemented later
            console.log("Settings clicked for assessment:", row.id);
          }}
          className="p-1.5 cursor-pointer rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors text-[#7c3aed] hover:text-[#6d28d9]"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      </Tooltip>
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-secondary">
        Loading assessments...
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
    <>
      <Table
        columns={columns}
        rows={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={renderCustomActions}
        getRowKey={(row) => row.id}
        itemsPerPage={10}
      />
      <EditAssessmentModal
        isOpen={editDialogOpen}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccessWithRefresh}
        assessment={selectedAssessmentForEdit}
      />
      <DeleteAssessment
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        assessment={selectedAssessmentForDelete}
        loading={deleteLoading}
      />
    </>
  );
};

export default AssessmentsTable;
