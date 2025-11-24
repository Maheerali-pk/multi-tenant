"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./Table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import EditUserModal from "@/app/modals/EditUserModal";
import { FilterValues } from "./TableFilter";

type User = Tables<"users">;
type Tenant = Tables<"tenants">;

export interface UserRow extends User {
  tenant_name?: string | null;
}

interface UsersTableProps {
  onEdit?: (row: UserRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  refreshTrigger?: number;
}

const UsersTable: React.FC<UsersTableProps> = ({
  searchValue = "",
  filterValues = {},
  refreshTrigger,
  onEdit,
}) => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] =
    useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users with tenant information (exclude tenant_user role)
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .in("role", ["superadmin", "tenant_admin"])
        .order("created_at", { ascending: false });

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
  }, []);

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

  // Default handler
  const handleEdit = onEdit || handleEditClick;

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
        getRowKey={(row) => row.id}
        itemsPerPage={10}
      />
      <EditUserModal
        isOpen={editDialogOpen}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccessWithRefresh}
        user={selectedUserForEdit}
      />
    </>
  );
};

export default UsersTable;
