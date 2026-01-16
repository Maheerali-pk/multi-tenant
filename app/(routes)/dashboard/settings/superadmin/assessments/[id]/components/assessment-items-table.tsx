"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "../../../../../../../components/table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import { FilterValues } from "../../../../../../../components/table-filter";
import EditAssessmentItemModal from "./edit-assessment-item-modal";
import DeleteAssessmentItem from "./delete-assessment-item";
import { toast } from "react-toastify";
import {
  renderCheckMethodBadge,
  renderBooleanBadge,
  renderImportanceBadge,
} from "@/app/utils/statusBadge";
import AssessmentItemDrawer from "./assessment-item-drawer";
import { Info } from "lucide-react";
import Tooltip from "../../../../../../../components/tooltip";

type AssessmentItem = Tables<"assessment_items">;

export interface AssessmentItemRow extends AssessmentItem {}

interface AssessmentItemsTableProps {
  assessmentId: string;
  onEdit?: (row: AssessmentItemRow) => void;
  onDelete?: (row: AssessmentItemRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  refreshTrigger?: number;
}

const AssessmentItemsTable: React.FC<AssessmentItemsTableProps> = ({
  assessmentId,
  searchValue = "",
  filterValues = {},
  refreshTrigger,
  onEdit,
  onDelete,
}) => {
  const [items, setItems] = useState<AssessmentItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] =
    useState<AssessmentItemRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] =
    useState<AssessmentItemRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItemForView, setSelectedItemForView] =
    useState<AssessmentItemRow | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessment items filtered by assessment_id
      const { data: itemsData, error: itemsError } = await supabase
        .from("assessment_items")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("sort_order", { ascending: true });

      if (itemsError) {
        console.error("Error fetching assessment items:", itemsError);
        setError("Failed to load assessment items");
        return;
      }

      if (!itemsData || itemsData.length === 0) {
        setItems([]);
        return;
      }

      setItems(itemsData as AssessmentItemRow[]);
    } catch (err) {
      console.error("Unexpected error fetching assessment items:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (assessmentId) {
      fetchItems();
    }
  }, [fetchItems, refreshTrigger, assessmentId]);

  // Apply search and filter values
  const filteredData = useMemo(() => {
    let result = [...items];

    // Apply search filter
    if (searchValue && searchValue.trim() !== "") {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(
        (row) =>
          row.title.toLowerCase().includes(searchLower) ||
          (row.category && row.category.toLowerCase().includes(searchLower)) ||
          (row.what_to_check &&
            row.what_to_check.toLowerCase().includes(searchLower)) ||
          (row.how_to_check &&
            row.how_to_check.toLowerCase().includes(searchLower)) ||
          (row.check_method &&
            row.check_method.toLowerCase().includes(searchLower)) ||
          (row.evidence_hint &&
            row.evidence_hint.toLowerCase().includes(searchLower)) ||
          (row.how_it_helps &&
            row.how_it_helps.toLowerCase().includes(searchLower)) ||
          (row.importance && row.importance.toLowerCase().includes(searchLower))
      );
    }

    // Apply title filter
    if (filterValues.title && filterValues.title.trim() !== "") {
      const titleFilter = filterValues.title.toLowerCase();
      result = result.filter(
        (row) => row.title && row.title.toLowerCase().includes(titleFilter)
      );
    }

    // Apply category filter
    if (filterValues.category && filterValues.category.trim() !== "") {
      result = result.filter((row) => row.category === filterValues.category);
    }

    // Apply required filter
    if (filterValues.required !== undefined && filterValues.required !== "") {
      const isRequired = filterValues.required === "true";
      result = result.filter((row) => row.required === isRequired);
    }

    // Apply is_active filter
    if (filterValues.is_active !== undefined && filterValues.is_active !== "") {
      const isActive = filterValues.is_active === "true";
      result = result.filter((row) => row.is_active === isActive);
    }

    return result;
  }, [items, searchValue, filterValues]);

  const columns: TableColumn<AssessmentItemRow>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      width: "20%",
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      width: "15%",
      render: (row) => row.category || "-",
    },
    {
      key: "what_to_check",
      header: "What to Check",
      sortable: true,
      width: "25%",
    },
    {
      key: "how_to_check",
      header: "How to Check",
      sortable: true,
      width: "18%",
      render: (row) => row.how_to_check || "-",
    },
    {
      key: "check_method",
      header: "Check Method",
      sortable: true,
      width: "12%",
      render: (row) => renderCheckMethodBadge(row.check_method, "sm"),
    },
    {
      key: "importance",
      header: "Importance",
      sortable: true,
      width: "12%",
      render: (row) => renderImportanceBadge(row.importance, "sm"),
    },
    {
      key: "required",
      header: "Required",
      sortable: true,
      width: "10%",
      render: (row) => renderBooleanBadge(row.required, "sm", "success-danger"),
    },
    {
      key: "is_active",
      header: "Active",
      sortable: true,
      width: "10%",
      render: (row) =>
        renderBooleanBadge(row.is_active, "sm", "success-danger"),
    },
  ];

  const handleEditClick = useCallback((row: AssessmentItemRow) => {
    setSelectedItemForEdit(row);
    setEditDialogOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedItemForEdit(null);
  }, []);

  const handleEditSuccessWithRefresh = useCallback(async () => {
    setEditDialogOpen(false);
    setSelectedItemForEdit(null);
    await fetchItems();
  }, [fetchItems]);

  const handleDeleteClick = useCallback((row: AssessmentItemRow) => {
    setSelectedItemForDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedItemForDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedItemForDelete) return;

    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("assessment_items")
        .delete()
        .eq("id", selectedItemForDelete.id);

      if (deleteError) {
        console.error("Error deleting assessment item:", deleteError);
        setError(deleteError.message || "Failed to delete assessment item");
        setDeleteLoading(false);
        return;
      }

      // Close dialog and refresh items
      setDeleteDialogOpen(false);
      setSelectedItemForDelete(null);
      await fetchItems();
    } catch (err) {
      console.error("Error deleting assessment item:", err);
      setError("Failed to delete assessment item");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedItemForDelete, fetchItems]);

  // Default handlers
  const handleEdit = onEdit || handleEditClick;
  const handleDelete = onDelete || handleDeleteClick;

  const handleViewDetails = useCallback((row: AssessmentItemRow) => {
    setSelectedItemForView(row);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setSelectedItemForView(null);
  }, []);

  // Custom actions renderer for view details icon
  const renderCustomActions = useCallback(
    (row: AssessmentItemRow) => {
      return (
        <>
          <Tooltip text="View Details" position="top">
            <button
              onClick={() => handleViewDetails(row)}
              className="p-1.5 cursor-pointer rounded-lg hover:bg-blue-light transition-colors text-brand hover:text-brand"
              aria-label="View Details"
            >
              <Info size={16} />
            </button>
          </Tooltip>
        </>
      );
    },
    [handleViewDetails]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-secondary">
        Loading assessment items...
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
      <EditAssessmentItemModal
        isOpen={editDialogOpen}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccessWithRefresh}
        item={selectedItemForEdit}
      />
      <DeleteAssessmentItem
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        item={selectedItemForDelete}
        loading={deleteLoading}
      />
      <AssessmentItemDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        item={selectedItemForView}
      />
    </>
  );
};

export default AssessmentItemsTable;
