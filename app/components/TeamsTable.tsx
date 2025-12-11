"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./Table";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/app/types/database.types";
import DeleteTeam from "@/app/modals/DeleteTeam";
import EditTeamModal from "@/app/modals/EditTeamModal";
import { FilterValues } from "./TableFilter";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { Settings } from "lucide-react";
import ManageTeamUsersModal from "./ManageTeamUsersModal";

type Team = Tables<"teams">;

export interface TeamRow extends Team {}

interface TeamsTableProps {
  onEdit?: (row: TeamRow) => void;
  onDelete?: (row: TeamRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  refreshTrigger?: number; // Increment this to trigger refresh
}

const TeamsTable: React.FC<TeamsTableProps> = ({
  searchValue = "",
  filterValues = {},
  refreshTrigger,
  onEdit,
  onDelete,
}) => {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTeamForEdit, setSelectedTeamForEdit] =
    useState<TeamRow | null>(null);
  const [manageUsersDialogOpen, setManageUsersDialogOpen] = useState(false);
  const [selectedTeamForManageUsers, setSelectedTeamForManageUsers] =
    useState<TeamRow | null>(null);

  const fetchTeams = useCallback(async () => {
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

      const { data, error: fetchError } = await supabase
        .from("teams")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching teams:", fetchError);
        setError("Failed to load teams");
        return;
      }

      setTeams(data || []);
    } catch (err) {
      console.error("Unexpected error fetching teams:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [auth.userData?.role, auth.userData?.tenant_id, state.selectedTenantId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams, refreshTrigger]);

  const handleEditClick = useCallback((row: TeamRow) => {
    setSelectedTeamForEdit(row);
    setEditDialogOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedTeamForEdit(null);
  }, []);

  const handleEditSuccessWithRefresh = useCallback(async () => {
    setEditDialogOpen(false);
    setSelectedTeamForEdit(null);
    await fetchTeams();
  }, [fetchTeams]);

  const handleDeleteClick = useCallback((row: TeamRow) => {
    setSelectedTeam(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedTeam(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedTeam) return;

    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("teams")
        .delete()
        .eq("id", selectedTeam.id);

      if (deleteError) {
        console.error("Error deleting team:", deleteError);
        setError("Failed to delete team");
        setDeleteLoading(false);
        return;
      }

      // Close dialog and refresh teams
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
      await fetchTeams();
    } catch (err) {
      console.error("Error deleting team:", err);
      setError("Failed to delete team");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedTeam, fetchTeams]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Helper function to render role badge
  const renderRoleBadge = () => {
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1"
        style={{
          backgroundColor: "rgba(249, 115, 22, 0.15)", // orange-500 with opacity
          color: "#f97316", // orange-600
        }}
      >
        Tenant Team
      </span>
    );
  };

  // Apply search and filter values
  const filteredData = useMemo(() => {
    let result = [...teams];

    // Apply search filter
    if (searchValue && searchValue.trim() !== "") {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(
        (row) =>
          row.name.toLowerCase().includes(searchLower) ||
          (row.email && row.email.toLowerCase().includes(searchLower))
      );
    }

    // Apply email filter
    if (filterValues.email && filterValues.email.trim() !== "") {
      const emailFilter = filterValues.email.toLowerCase();
      result = result.filter(
        (row) => row.email && row.email.toLowerCase().includes(emailFilter)
      );
    }

    return result;
  }, [teams, searchValue, filterValues]);

  const columns: TableColumn<TeamRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      width: "25%",
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      width: "25%",
      render: (row) => row.email || "-",
    },
    {
      key: "role",
      header: "Role",
      sortable: false,
      width: "20%",
      render: () => renderRoleBadge(),
    },
    {
      key: "created_at",
      header: "Created At",
      sortable: true,
      width: "20%",
      render: (row) => formatDate(row.created_at),
      customSort: (a, b, direction) => {
        const aDate = a ? new Date(a).getTime() : 0;
        const bDate = b ? new Date(b).getTime() : 0;
        return direction === "asc" ? aDate - bDate : bDate - aDate;
      },
    },
  ];

  const handleManageUsersClick = useCallback((row: TeamRow) => {
    setSelectedTeamForManageUsers(row);
    setManageUsersDialogOpen(true);
  }, []);

  const handleManageUsersCancel = useCallback(() => {
    setManageUsersDialogOpen(false);
    setSelectedTeamForManageUsers(null);
  }, []);

  const handleManageUsersSuccess = useCallback(async () => {
    setManageUsersDialogOpen(false);
    setSelectedTeamForManageUsers(null);
    await fetchTeams();
  }, [fetchTeams]);

  // Custom actions for teams - add settings icon
  const renderCustomActions = useCallback(
    (row: TeamRow) => {
      return (
        <button
          onClick={() => handleManageUsersClick(row)}
          className="p-1.5 cursor-pointer rounded-lg hover:bg-blue-100 dark:hover:bg-purple-900/20 transition-colors text-[#7c3aed] hover:text-[#6d28d9]"
          aria-label="Manage Users"
          title="Manage Users"
        >
          <Settings size={16} />
        </button>
      );
    },
    [handleManageUsersClick]
  );

  // Default handlers
  const handleEdit = onEdit || handleEditClick;

  const handleDelete = onDelete || handleDeleteClick;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-secondary">
        Loading teams...
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
      <DeleteTeam
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        team={selectedTeam}
        loading={deleteLoading}
      />
      <EditTeamModal
        isOpen={editDialogOpen}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccessWithRefresh}
        team={selectedTeamForEdit}
      />
      <ManageTeamUsersModal
        isOpen={manageUsersDialogOpen}
        onClose={handleManageUsersCancel}
        onSuccess={handleManageUsersSuccess}
        team={selectedTeamForManageUsers}
      />
    </>
  );
};

export default TeamsTable;
