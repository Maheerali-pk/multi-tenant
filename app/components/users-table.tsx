"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import EditUserModal from "@/app/modals/edit-user-modal";
import EditUserModalForTenantAdmin from "@/app/modals/edit-user-modal-for-tenant-admin";
import DeleteUser from "@/app/modals/delete-user";
import InviteUser from "@/app/modals/invite-user";
import ManageSuperAdminTenantsModals from "@/app/modals/manage-super-admin-tenants-modals";
import { FilterValues } from "./table-filter";
import { toast } from "react-toastify";
import { useAuthContext } from "@/app/contexts/AuthContext";
import {
  Settings,
  Users,
  Mail,
  MailCheck,
  ChevronRight,
  Building2,
  Plus,
} from "lucide-react";
import Tooltip from "./tooltip";
import TenantListModal from "./tenant-list-modal";
import TenantListTooltip from "./tenant-list-tooltip";
import TeamListModal from "./manage-user-teams-modal";
import TeamsListModal from "./teams-list-modal";
import { useGlobalContext } from "../contexts/GlobalContext";
import { formatRelativeTime } from "../helpers/formatRelativeTime";
import {
  getInvitationStatus,
  type InvitationData,
} from "../helpers/invitationStatus";

type User = Tables<"users">;
type Tenant = Tables<"tenants">;

export interface UserRow extends User {
  tenant_name?: string | null;
  tenant_names?: string[]; // For superadmin users - list of tenant names
  team_names?: string[]; // For tenant_admin mode - list of team names
  invitation?: InvitationData | null; // Invitation data from user_invites table
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
  const [teamListModalOpen, setTeamListModalOpen] = useState(false);
  const [selectedUserForManageTeams, setSelectedUserForManageTeams] =
    useState<UserRow | null>(null);
  const [teamsListModalOpen, setTeamsListModalOpen] = useState(false);
  const [teamsToShow, setTeamsToShow] = useState<string[]>([]);
  const [inviteUserDialogOpen, setInviteUserDialogOpen] = useState(false);
  const [selectedUserForInvite, setSelectedUserForInvite] =
    useState<UserRow | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
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
          .in("role", ["tenant_admin", "tenant_user", "tenant_employee"]);
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

      // Fetch team mappings for tenant_admin mode
      let userTeamsMap = new Map<string, string[]>();
      if (mode === "tenant_admin" && otherUsers.length > 0) {
        const userIds = otherUsers.map((user) => user.id);
        const { data: userTeamsData, error: userTeamsError } = await supabase
          .from("user_teams")
          .select("user_id, team_id")
          .in("user_id", userIds);

        if (!userTeamsError && userTeamsData) {
          // Get unique team IDs
          const teamIds = [...new Set(userTeamsData.map((ut) => ut.team_id))];

          // Fetch team names
          if (teamIds.length > 0) {
            const { data: teamsData, error: teamsError } = await supabase
              .from("teams")
              .select("id, name")
              .in("id", teamIds);

            if (!teamsError && teamsData) {
              const teamNameMap = new Map(
                teamsData.map((team) => [team.id, team.name])
              );

              // Group teams by user_id
              userTeamsData.forEach((userTeam) => {
                const teamName = teamNameMap.get(userTeam.team_id);
                if (teamName) {
                  const existing = userTeamsMap.get(userTeam.user_id) || [];
                  userTeamsMap.set(userTeam.user_id, [...existing, teamName]);
                }
              });
            }
          }
        }
      }

      // Fetch invitation data for all users (only for users with auth accounts)
      const userEmails = usersData
        .filter((user) => user.role !== "tenant_employee" && user.email)
        .map((user) => user.email);
      let invitationsMap = new Map<string, InvitationData>();

      if (userEmails.length > 0) {
        const { data: invitationsData, error: invitationsError } =
          await supabase
            .from("user_invites")
            .select("*")
            .in("email", userEmails);

        if (!invitationsError && invitationsData) {
          invitationsData.forEach((invitation) => {
            invitationsMap.set(invitation.email, invitation);
          });
        }
      }

      // Combine user data with tenant names, team names, and invitation data
      const usersWithTenants: UserRow[] = usersData.map((user) => {
        const invitation = user.email
          ? invitationsMap.get(user.email) || null
          : null;

        if (user.role === "superadmin") {
          const tenantNames = superadminTenantsMap.get(user.id) || [];
          return {
            ...user,
            tenant_name: null,
            tenant_names: tenantNames,
            team_names: undefined,
            invitation,
          };
        } else {
          const teamNames = userTeamsMap.get(user.id) || [];
          return {
            ...user,
            tenant_name: user.tenant_id
              ? tenantsMap.get(user.tenant_id) || null
              : null,
            tenant_names: undefined,
            team_names: teamNames,
            invitation,
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
      case "tenant_employee":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          color: "#d97706",
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

  const handleManageTeamsClick = useCallback((row: UserRow) => {
    setSelectedUserForManageTeams(row);
    setTeamListModalOpen(true);
  }, []);

  const handleManageTeamsCancel = useCallback(() => {
    setTeamListModalOpen(false);
    setSelectedUserForManageTeams(null);
  }, []);

  const handleManageTeamsSuccess = useCallback(async () => {
    setTeamListModalOpen(false);
    setSelectedUserForManageTeams(null);
    await fetchUsers();
  }, [fetchUsers]);

  const handleInviteUserClick = useCallback((row: UserRow) => {
    setSelectedUserForInvite(row);
    setInviteUserDialogOpen(true);
  }, []);

  const handleInviteUserCancel = useCallback(() => {
    setInviteUserDialogOpen(false);
    setSelectedUserForInvite(null);
  }, []);

  const handleInviteUserConfirm = useCallback(async () => {
    if (!selectedUserForInvite) return;

    setInviteLoading(true);
    try {
      // Call API route to send invitation
      const response = await fetch("/api/send-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserForInvite.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error sending invitation:", data);
        setError(data.error || "Failed to send invitation");
        setInviteLoading(false);
        return;
      }

      // Show success toast
      const userName =
        selectedUserForInvite.name || selectedUserForInvite.email || "User";
      toast.success(`Invitation email sent to ${userName} successfully`);

      // Close dialog and refresh users
      setInviteUserDialogOpen(false);
      setSelectedUserForInvite(null);
      await fetchUsers();
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError("Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  }, [selectedUserForInvite, fetchUsers]);

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
            )) ||
          (row.team_names &&
            row.team_names.some((name) =>
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
      width: "15%",
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
      width: "20%",
      render: (row) => row.title || "-",
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      width: "140px",
      render: (row) => renderRoleBadge(row.role),
    },
    {
      key: "last_loggedin_at",
      header: "Last Logged In",
      sortable: true,
      width: "150px",
      render: (row) => formatRelativeTime(row.last_loggedin_at),
    },
    // Tenant column only shown in superadmin mode
    ...(mode === "superadmin"
      ? [
          {
            key: "tenant_name",
            header: "Tenant",
            sortable: true,
            width: "10%",
            render: (row) => {
              // For superadmin users, show tenant names with "+n" badge
              if (row.role === "superadmin" && row.tenant_names) {
                if (row.tenant_names.length === 0) {
                  return "-";
                }

                const handleShowTenants = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setTenantsToShow(row.tenant_names || []);
                  setTenantListModalOpen(true);
                };

                // Show up to 1 tenant name to ensure it fits completely, then show "+n" badge
                const maxVisible = 1;
                const visibleTenants = row.tenant_names.slice(0, maxVisible);
                const remainingCount = row.tenant_names.length - maxVisible;

                return (
                  <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                    {visibleTenants.map((tenantName, index) => (
                      <span
                        key={index}
                        className="text-sm text-text-primary whitespace-nowrap"
                      >
                        {tenantName}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <TenantListTooltip
                        tenants={row.tenant_names || []}
                        position="top"
                        delay={200}
                      >
                        <button
                          onClick={handleShowTenants}
                          className="flex relative items-center justify-center w-7 h-7 rounded-full bg-brand/10 text-brand font-semibold hover:bg-brand/20 transition-all cursor-pointer border border-brand/20 hover:border-brand/40 shrink-0 aspect-square"
                          aria-label={`View ${remainingCount} more tenant${
                            remainingCount !== 1 ? "s" : ""
                          }`}
                        >
                          <span className="flex items-baseline justify-center  relative leading-none gap-px">
                            <span className="text-xs">{remainingCount}</span>
                          </span>
                        </button>
                      </TenantListTooltip>
                    )}
                  </div>
                );
              }

              // For other users, show single tenant name
              return row.tenant_name || "-";
            },
          } as TableColumn<UserRow>,
        ]
      : []),
    // Add Teams column for tenant_admin mode (second last column, before actions)
    ...(mode === "tenant_admin"
      ? [
          {
            key: "team_names",
            header: "Teams",
            sortable: false,
            width: "10%",
            render: (row: UserRow) => {
              if (row.team_names && row.team_names.length > 0) {
                const handleShowTeams = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setTeamsToShow(row.team_names || []);
                  setTeamsListModalOpen(true);
                };

                return (
                  <Tooltip
                    text={`View ${row.team_names.length} team${
                      row.team_names.length !== 1 ? "s" : ""
                    }`}
                    position="top"
                  >
                    <button
                      onClick={handleShowTeams}
                      className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand/10 text-brand font-semibold text-sm hover:bg-brand/20 hover:shadow-sm transition-all cursor-pointer border border-brand/20 hover:border-brand/40"
                      aria-label={`View ${row.team_names.length} team${
                        row.team_names.length !== 1 ? "s" : ""
                      }`}
                    >
                      <Users size={14} className="text-brand" />
                      <span className="min-w-[1.25rem] text-center">
                        {row.team_names.length}
                      </span>
                      <ChevronRight
                        size={12}
                        className="text-brand/60 group-hover:text-brand group-hover:translate-x-0.5 transition-all"
                      />
                    </button>
                  </Tooltip>
                );
              }
              return "-";
            },
          } as TableColumn<UserRow>,
        ]
      : []),
  ];

  // Default handlers
  const handleEdit = onEdit || handleEditClick;
  const handleDelete = onDelete || handleDeleteClick;

  // Custom actions for superadmin users
  const renderCustomActions = useCallback(
    (row: UserRow) => {
      const actions = [];

      // Show manage tenants button for superadmin users when mode is superadmin
      if (mode === "superadmin" && row.role === "superadmin") {
        actions.push(
          <Tooltip
            key="manage-tenants-tooltip"
            text="Manage Tenants"
            position="top"
          >
            <button
              onClick={() => handleManageTenantsClick(row)}
              className="p-1.5 cursor-pointer rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors text-[#7c3aed] hover:text-[#6d28d9]"
              aria-label="Manage Tenants"
            >
              <Settings size={16} />
            </button>
          </Tooltip>
        );
      }

      // Show manage teams button for tenant_admin mode when role is superadmin or tenant_admin
      if (mode === "tenant_admin") {
        actions.push(
          <Tooltip
            key="manage-teams-tooltip"
            text="Manage Teams"
            position="top"
          >
            <button
              onClick={() => handleManageTeamsClick(row)}
              className="p-1.5 cursor-pointer rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors text-[#7c3aed] hover:text-[#6d28d9]"
              aria-label="Manage Teams"
            >
              <Settings size={16} />
            </button>
          </Tooltip>
        );
      }

      // Show invite user button if auth_created is false (at the end, after settings icon)
      // Don't show for tenant_employee as they don't have auth accounts
      // Don't show if auth_created is true (user has already accepted invitation)
      if (row.role !== "tenant_employee" && row.auth_created === false) {
        const invitationStatus = getInvitationStatus(row.invitation);
        const isPending = invitationStatus === "pending";
        const Icon = isPending ? MailCheck : Mail;
        const tooltipText = isPending
          ? "Invitation Pending"
          : "Send Invitation";

        actions.push(
          <Tooltip key="invite-user-tooltip" text={tooltipText} position="top">
            <button
              onClick={() => handleInviteUserClick(row)}
              className="p-1.5 cursor-pointer rounded-lg hover:bg-[rgba(16,185,129,0.15)] transition-colors text-[#059669] hover:text-[#047857]"
              aria-label={tooltipText}
            >
              <Icon size={16} />
            </button>
          </Tooltip>
        );
      }

      return actions.length > 0 ? <>{actions}</> : null;
    },
    [
      mode,
      handleManageTenantsClick,
      handleManageTeamsClick,
      handleInviteUserClick,
    ]
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
      <TeamListModal
        isOpen={teamListModalOpen}
        onClose={handleManageTeamsCancel}
        onSuccess={handleManageTeamsSuccess}
        user={selectedUserForManageTeams}
      />
      <TeamsListModal
        isOpen={teamsListModalOpen}
        onClose={() => setTeamsListModalOpen(false)}
        teams={teamsToShow}
      />
      <InviteUser
        isOpen={inviteUserDialogOpen}
        onClose={handleInviteUserCancel}
        onConfirm={handleInviteUserConfirm}
        user={selectedUserForInvite}
        loading={inviteLoading}
      />
    </>
  );
};

export default UsersTable;
