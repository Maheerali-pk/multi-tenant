"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./Table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import EditUserModal from "@/app/modals/EditUserModal";
import EditUserModalForTenantAdmin from "@/app/modals/EditUserModalForTenantAdmin";
import DeleteUser from "@/app/modals/DeleteUser";
import { FilterValues } from "./TableFilter";
import { toast } from "react-toastify";
import { useAuthContext } from "@/app/contexts/AuthContext";

type User = Tables<"users">;
type Tenant = Tables<"tenants">;

export interface UserRow extends User {
  tenant_name?: string | null;
}

type UserTableMode = "superadmin" | "tenant_admin";

interface UsersTableProps {
  mode?: UserTableMode;
  onEdit?: (row: UserRow) => void;
  onDelete?: (row: UserRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  refreshTrigger?: number;
}

const UsersTable: React.FC<UsersTableProps> = ({
  mode = "superadmin",
  searchValue = "",
  filterValues = {},
  refreshTrigger,
  onEdit,
  onDelete,
}) => {
  const [auth] = useAuthContext();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] =
    useState<UserRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] =
    useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("users").select("*");

      // Apply filters based on mode
      if (mode === "superadmin") {
        // Superadmin sees all superadmins and tenant_admins
        query = query.in("role", ["superadmin", "tenant_admin"]);
      } else if (mode === "tenant_admin") {
        // Tenant admin sees only users from their tenant
        const tenantId = auth.userData?.tenant_id;
        if (!tenantId) {
          setError("Tenant ID not found. Please contact support.");
          setLoading(false);
          return;
        }
        query = query
          .eq("tenant_id", tenantId)
          .in("role", ["tenant_admin", "tenant_user"]);
      }

      const { data: usersData, error: usersError } = await query.order(
        "created_at",
        { ascending: false }
      );

      if (usersError) {
        console.error("Error fetching users:", usersError);
        setError("Failed to load users");
        return;
      }

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        return;
      }

      // Get unique tenant IDs
      const tenantIds = [
        ...new Set(
          usersData
            .map((user) => user.tenant_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      // Fetch tenants
      let tenantsMap = new Map<string, string>();
      if (tenantIds.length > 0) {
        const { data: tenantsData, error: tenantsError } = await supabase
          .from("tenants")
          .select("id, name")
          .in("id", tenantIds);

        if (!tenantsError && tenantsData) {
          tenantsMap = new Map(
            tenantsData.map((tenant) => [tenant.id, tenant.name])
          );
        }
      }

      // Combine user data with tenant names
      const usersWithTenants: UserRow[] = usersData.map((user) => ({
        ...user,
        tenant_name: user.tenant_id
          ? tenantsMap.get(user.tenant_id) || null
          : null,
      }));

      setUsers(usersWithTenants);
    } catch (err) {
      console.error("Unexpected error fetching users:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [mode, auth.userData?.tenant_id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshTrigger]);

  const handleEditClick = useCallback((row: UserRow) => {
    setSelectedUserForEdit(row);
    setEditDialogOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedUserForEdit(null);
  }, []);

  const handleEditSuccessWithRefresh = useCallback(async () => {
    setEditDialogOpen(false);
    setSelectedUserForEdit(null);
    await fetchUsers();
  }, [fetchUsers]);

  const handleDeleteClick = useCallback((row: UserRow) => {
    setSelectedUserForDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedUserForDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedUserForDelete) return;

    setDeleteLoading(true);
    try {
      // Call API route to delete user (handles both auth and database deletion)
      const response = await fetch("/api/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserForDelete.id,
          authUserId: selectedUserForDelete.auth_user_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error deleting user:", data);
        setError(data.error || "Failed to delete user");
        setDeleteLoading(false);
        return;
      }

      // Show success toast
      const userName =
        selectedUserForDelete.name || selectedUserForDelete.email || "User";
      toast.success(`User ${userName} has been deleted successfully`);

      // Close dialog and refresh users
      setDeleteDialogOpen(false);
      setSelectedUserForDelete(null);
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedUserForDelete, fetchUsers]);

  // Apply search and filter values
  const filteredData = useMemo(() => {
    let result = [...users];

    // Apply search filter
    if (searchValue && searchValue.trim() !== "") {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(
        (row) =>
          row.name.toLowerCase().includes(searchLower) ||
          row.email.toLowerCase().includes(searchLower) ||
          (row.title && row.title.toLowerCase().includes(searchLower)) ||
          (row.role && row.role.toLowerCase().includes(searchLower)) ||
          (row.tenant_name &&
            row.tenant_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply role filter
    if (filterValues.role && filterValues.role.trim() !== "") {
      result = result.filter((row) => row.role === filterValues.role);
    }

    // Apply tenant filter
    if (filterValues.tenant && filterValues.tenant.trim() !== "") {
      result = result.filter((row) => row.tenant_id === filterValues.tenant);
    }

    // Apply title filter
    if (filterValues.title && filterValues.title.trim() !== "") {
      const titleFilter = filterValues.title.toLowerCase();
      result = result.filter(
        (row) => row.title && row.title.toLowerCase().includes(titleFilter)
      );
    }

    return result;
  }, [users, searchValue, filterValues]);

  const columns: TableColumn<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      width: "20%",
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      width: "20%",
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      width: "15%",
      render: (row) => row.title || "-",
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      width: "15%",
      render: (row) => {
        const role = row.role || "";
        const roleDisplay = role
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return roleDisplay || "-";
      },
    },
    {
      key: "tenant_name",
      header: "Tenant",
      sortable: true,
      width: "20%",
      render: (row) => row.tenant_name || "-",
    },
  ];

  // Default handlers
  const handleEdit = onEdit || handleEditClick;
  const handleDelete = onDelete || handleDeleteClick;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-secondary">
        Loading users...
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
      {mode === "tenant_admin" ? (
        <EditUserModalForTenantAdmin
          isOpen={editDialogOpen}
          onClose={handleEditCancel}
          onSuccess={handleEditSuccessWithRefresh}
          user={selectedUserForEdit}
        />
      ) : (
        <EditUserModal
          isOpen={editDialogOpen}
          onClose={handleEditCancel}
          onSuccess={handleEditSuccessWithRefresh}
          user={selectedUserForEdit}
        />
      )}
      <DeleteUser
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        user={selectedUserForDelete}
        loading={deleteLoading}
      />
    </>
  );
};

export default UsersTable;
