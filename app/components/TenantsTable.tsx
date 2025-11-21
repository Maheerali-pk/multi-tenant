"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./Table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import DeleteTenant from "@/app/modals/DeleteTenant";
import EditTenantModal from "@/app/modals/EditTenantModal";
import { FilterValues } from "./TableFilter";

type Tenant = Tables<"tenants">;

export interface TenantRow extends Tenant {}

interface TenantsTableProps {
  onEdit?: (row: TenantRow) => void;
  onDelete?: (row: TenantRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  refreshTrigger?: number; // Increment this to trigger refresh
}

const TenantsTable: React.FC<TenantsTableProps> = ({
  searchValue = "",
  filterValues = {},
  refreshTrigger,
  onEdit,
  onDelete,
}) => {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTenantForEdit, setSelectedTenantForEdit] =
    useState<TenantRow | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching tenants:", fetchError);
        setError("Failed to load tenants");
        return;
      }

      setTenants(data || []);
    } catch (err) {
      console.error("Unexpected error fetching tenants:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants, refreshTrigger]);

  const handleEditClick = useCallback((row: TenantRow) => {
    setSelectedTenantForEdit(row);
    setEditDialogOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedTenantForEdit(null);
  }, []);

  const handleEditSuccessWithRefresh = useCallback(async () => {
    setEditDialogOpen(false);
    setSelectedTenantForEdit(null);
    await fetchTenants();
  }, [fetchTenants]);

  const handleDeleteClick = useCallback((row: TenantRow) => {
    setSelectedTenant(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedTenant(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedTenant) return;

    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("tenants")
        .delete()
        .eq("id", selectedTenant.id);

      if (deleteError) {
        console.error("Error deleting tenant:", deleteError);
        setError("Failed to delete tenant");
        setDeleteLoading(false);
        return;
      }

      // Close dialog and refresh tenants
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
      await fetchTenants();
    } catch (err) {
      console.error("Error deleting tenant:", err);
      setError("Failed to delete tenant");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedTenant, fetchTenants]);

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
    let result = [...tenants];

    // Apply search filter
    if (searchValue && searchValue.trim() !== "") {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(
        (row) =>
          row.name.toLowerCase().includes(searchLower) ||
          (row.contact_email &&
            row.contact_email.toLowerCase().includes(searchLower)) ||
          (row.contact_name &&
            row.contact_name.toLowerCase().includes(searchLower)) ||
          (row.country && row.country.toLowerCase().includes(searchLower)) ||
          (row.status && row.status.toLowerCase().includes(searchLower)) ||
          (row.slug && row.slug.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (filterValues.status && filterValues.status.trim() !== "") {
      result = result.filter((row) => row.status === filterValues.status);
    }

    // Apply country filter
    if (filterValues.country && filterValues.country.trim() !== "") {
      result = result.filter((row) => row.country === filterValues.country);
    }

    // Apply contact_name filter
    if (filterValues.contact_name && filterValues.contact_name.trim() !== "") {
      const contactNameFilter = filterValues.contact_name.toLowerCase();
      result = result.filter(
        (row) =>
          row.contact_name &&
          row.contact_name.toLowerCase().includes(contactNameFilter)
      );
    }

    return result;
  }, [tenants, searchValue, filterValues]);

  const columns: TableColumn<TenantRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      width: "20%",
    },
    {
      key: "contact_email",
      header: "Contact Email",
      sortable: true,
      width: "18%",
      render: (row) => row.contact_email || "-",
    },
    {
      key: "contact_name",
      header: "Contact Name",
      sortable: true,
      width: "15%",
      render: (row) => row.contact_name || "-",
    },
    {
      key: "country",
      header: "Country",
      sortable: true,
      width: "12%",
      render: (row) => row.country || "-",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "10%",
      render: (row) => row.status || "-",
    },
    {
      key: "created_at",
      header: "Created At",
      sortable: true,
      width: "15%",
      render: (row) => formatDate(row.created_at),
      customSort: (a, b, direction) => {
        const aDate = a ? new Date(a).getTime() : 0;
        const bDate = b ? new Date(b).getTime() : 0;
        return direction === "asc" ? aDate - bDate : bDate - aDate;
      },
    },
  ];

  // Default handlers
  const handleEdit = onEdit || handleEditClick;

  const handleDelete = onDelete || handleDeleteClick;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-secondary">
        Loading tenants...
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
        getRowKey={(row) => row.id}
        itemsPerPage={10}
      />
      <DeleteTenant
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        tenant={selectedTenant}
        loading={deleteLoading}
      />
      <EditTenantModal
        isOpen={editDialogOpen}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccessWithRefresh}
        tenant={selectedTenantForEdit}
      />
    </>
  );
};

export default TenantsTable;
