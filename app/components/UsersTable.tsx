"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./Table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import EditUserModal from "@/app/modals/EditUserModal";
import EditUserModalForTenantAdmin from "@/app/modals/EditUserModalForTenantAdmin";
import DeleteUser from "@/app/modals/DeleteUser";
import ManageSuperAdminTenantsModals from "@/app/modals/ManageSuperAdminTenantsModals";
import { FilterValues } from "./TableFilter";
import { toast } from "react-toastify";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { Settings } from "lucide-react";
import TenantListModal from "./TenantListModal";
import { useGlobalContext } from "../contexts/GlobalContext";

type User = Tables<"users">;
type Tenant = Tables<"tenants">;

export interface UserRow extends User {
  tenant_name?: string | null;
  tenant_names?: string[]; // For superadmin users - list of tenant names
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
  const [manageTenantsDialogOpen, setManageTenantsDialogOpen] = useState(false);
  const [selectedUserForManageTenants, setSelectedUserForManageTenants] =
    useState<UserRow | null>(null);
  const [tenantListModalOpen, setTenantListModalOpen] = useState(false);
  const [tenantsToShow, setTenantsToShow] = useState<string[]>([]);
  const [state] = useGlobalContext();

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
        const tenantId =
          auth.userData?.role === "tenant_admin"
            ? auth.userData?.tenant_id
            : state.selectedTenantId;
        if (
          (auth.userData!.role === "tenant_admin" && !tenantId) ||
          (auth.userData!.role === "superadmin" && !tenantId)
        ) {
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

      // Separate superadmin users from others
      const superadminUsers = usersData.filter(
        (user) => user.role === "superadmin"
      );
      const otherUsers = usersData.filter((user) => user.role !== "superadmin");

      // Get unique tenant IDs for non-superadmin users
      const tenantIds = [
        ...new Set(
          otherUsers
            .map((user) => user.tenant_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      // Fetch tenants for non-superadmin users
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

      // Fetch tenant access for superadmin users
      const superadminUserIds = superadminUsers.map((user) => user.id);
      let superadminTenantsMap = new Map<string, string[]>();

      if (superadminUserIds.length > 0) {
        // Fetch tenant access records
        const { data: accessData, error: accessError } = await supabase
          .from("internal_user_tenant_access")
          .select("user_id, tenant_id")
          .in("user_id", superadminUserIds);

        if (!accessError && accessData) {
          // Get unique tenant IDs from access records
          const superadminTenantIds = [
            ...new Set(accessData.map((a) => a.tenant_id)),
          ];

          // Fetch tenant names
          if (superadminTenantIds.length > 0) {
            const { data: tenantsData, error: tenantsError } = await supabase
              .from("tenants")
              .select("id, name")
              .in("id", superadminTenantIds);

            if (!tenantsError && tenantsData) {
              const tenantNameMap = new Map(
                tenantsData.map((tenant) => [tenant.id, tenant.name])
              );

              // Group tenants by user_id
              accessData.forEach((access) => {
                const tenantName = tenantNameMap.get(access.tenant_id);
                if (tenantName) {
                  const existing =
                    superadminTenantsMap.get(access.user_id) || [];
                  superadminTenantsMap.set(access.user_id, [
                    ...existing,
                    tenantName,
                  ]);
                }
              });
            }
          }
        }
      }

      // Combine user data with tenant names
      const usersWithTenants: UserRow[] = usersData.map((user) => {
        if (user.role === "superadmin") {
          const tenantNames = superadminTenantsMap.get(user.id) || [];
          return {
            ...user,
            tenant_name: null,
            tenant_names: tenantNames,
          };
        } else {
          return {
            ...user,
            tenant_name: user.tenant_id
              ? tenantsMap.get(user.tenant_id) || null
              : null,
            tenant_names: undefined,
          };
        }
      });

      setUsers(usersWithTenants);
    } catch (err) {
      console.error("Unexpected error fetching users:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [mode, auth.userData?.tenant_id, state.selectedTenantId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshTrigger]);

  // Helper function to get role badge styles
  const getRoleBadgeStyles = (role: string | null): React.CSSProperties => {
    if (!role) {
      return {
        backgroundColor: "rgba(100, 116, 139, 0.2)",
        color: "#475569",
      };
    }

    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case "superadmin":
        return {
          backgroundColor: "rgba(139, 92, 246, 0.15)",
          color: "#7c3aed",
        };
      case "tenant_admin":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          color: "#2563eb",
        };
      case "tenant_user":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          color: "#059669",
        };
      default:
        return {
          backgroundColor: "rgba(100, 116, 139, 0.2)",
          color: "#475569",
        };
    }
  };

  // Helper function to render role badge
  const renderRoleBadge = (role: string | null) => {
    if (!role) return "-";

    const roleDisplay = role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1"
        style={getRoleBadgeStyles(role)}
      >
        {roleDisplay}
      </span>
    );
  };

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

  const handleManageTenantsClick = useCallback((row: UserRow) => {
    setSelectedUserForManageTenants(row);
    setManageTenantsDialogOpen(true);
  }, []);

  const handleManageTenantsCancel = useCallback(() => {
    setManageTenantsDialogOpen(false);
    setSelectedUserForManageTenants(null);
  }, []);

  const handleManageTenantsSuccess = useCallback(async () => {
    setManageTenantsDialogOpen(false);
    setSelectedUserForManageTenants(null);
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
            row.tenant_name.toLowerCase().includes(searchLower)) ||
          (row.tenant_names &&
            row.tenant_names.some((name) =>
              name.toLowerCase().includes(searchLower)
            ))
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
      render: (row) => renderRoleBadge(row.role),
    },
    {
      key: "tenant_name",
      header: "Tenant",
      sortable: true,
      width: "20%",
      render: (row) => {
        // For superadmin users, show list of tenants
        if (row.role === "superadmin" && row.tenant_names) {
          if (row.tenant_names.length === 0) {
            return "-";
          }

          const displayTenants = row.tenant_names.slice(0, 3);
          const remainingCount = row.tenant_names.length - 3;

          const handleShowMore = (e: React.MouseEvent) => {
            e.stopPropagation();
            setTenantsToShow(row.tenant_names || []);
            setTenantListModalOpen(true);
          };

          return (
            <span>
              {displayTenants.join(", ")}
              {remainingCount > 0 && (
                <button
                  onClick={handleShowMore}
                  className="ml-1 text-brand font-semibold  transition-colors cursor-pointer"
                  aria-label={`Show ${remainingCount} more tenants`}
                >
                  + {remainingCount} more
                </button>
              )}
            </span>
          );
        }

        // For other users, show single tenant name
        return row.tenant_name || "-";
      },
    },
  ];

  // Default handlers
  const handleEdit = onEdit || handleEditClick;
  const handleDelete = onDelete || handleDeleteClick;

  // Custom actions for superadmin users
  const renderCustomActions = useCallback(
    (row: UserRow) => {
      // Only show manage tenants button for superadmin users when mode is superadmin
      if (mode === "superadmin" && row.role === "superadmin") {
        return (
          <button
            onClick={() => handleManageTenantsClick(row)}
            className="p-1.5 cursor-pointer rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors text-[#7c3aed] hover:text-[#6d28d9]"
            aria-label="Manage Tenants"
            title="Manage Tenants"
          >
            <Settings size={16} />
          </button>
        );
      }
      return null;
    },
    [mode, handleManageTenantsClick]
  );

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
        customActions={renderCustomActions}
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
      <ManageSuperAdminTenantsModals
        isOpen={manageTenantsDialogOpen}
        onClose={handleManageTenantsCancel}
        onSuccess={handleManageTenantsSuccess}
        user={selectedUserForManageTenants}
      />
      <TenantListModal
        isOpen={tenantListModalOpen}
        onClose={() => setTenantListModalOpen(false)}
        tenants={tenantsToShow}
      />
    </>
  );
};

export default UsersTable;
