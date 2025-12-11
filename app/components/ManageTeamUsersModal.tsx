"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/app/types/database.types";
import type { TeamRow } from "@/app/components/TeamsTable";
import ModalWrapper from "./ModalWrapper";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

type User = Tables<"users">;

// Type definition for user_teams table
type UserTeam = {
  team_id: string;
  user_id: string;
};

interface ManageTeamUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  team: TeamRow | null;
}

export default function ManageTeamUsersModal({
  isOpen,
  onClose,
  onSuccess,
  team,
}: ManageTeamUsersModalProps) {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [existingMappings, setExistingMappings] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUserIds(new Set());
      setExistingMappings([]);
      setError(null);
    }
  }, [isOpen]);

  // Fetch users and existing mappings when modal opens
  useEffect(() => {
    if (isOpen && team) {
      fetchUsers();
      fetchExistingMappings();
    }
  }, [isOpen, team]);

  const fetchUsers = async () => {
    if (!team) return;

    setLoadingUsers(true);
    try {
      // Determine tenant ID based on user role
      const isSuperAdmin = auth.userData?.role === "superadmin";
      const tenantId = isSuperAdmin
        ? state.selectedTenantId
        : auth.userData?.tenant_id;

      if (!tenantId) {
        setError(
          isSuperAdmin ? "Please select a tenant" : "User tenant not found"
        );
        setLoadingUsers(false);
        return;
      }

      // Fetch users from the same tenant
      // For tenant_admin mode, show tenant_admin and tenant_user roles
      // For superadmin mode, show tenant_admin and tenant_user roles
      const { data, error: usersError } = await supabase
        .from("users")
        .select("id, name, email, title, role")
        .eq("tenant_id", tenantId)
        .in("role", ["tenant_admin", "tenant_user"])
        .order("name");

      if (usersError) {
        console.error("Error fetching users:", usersError);
        setError("Failed to load users");
      } else {
        setUsers((data as User[]) || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchExistingMappings = async () => {
    if (!team) return;

    setLoadingMappings(true);
    try {
      const { data, error: mappingsError } = await supabase
        .from("user_teams")
        .select("team_id, user_id")
        .eq("team_id", team.id);

      if (mappingsError) {
        console.error("Error fetching existing mappings:", mappingsError);
        setError("Failed to load existing user mappings");
      } else {
        const mappings = (data as UserTeam[]) || [];
        setExistingMappings(mappings);
        // Pre-select users that are already mapped to this team
        const existingUserIds = new Set(mappings.map((m) => m.user_id));
        setSelectedUserIds(existingUserIds);
      }
    } catch (err) {
      console.error("Error fetching existing mappings:", err);
      setError("Failed to load existing user mappings");
    } finally {
      setLoadingMappings(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      // Deselect all
      setSelectedUserIds(new Set());
    } else {
      // Select all
      setSelectedUserIds(new Set(users.map((user) => user.id)));
    }
  };

  const handleSave = async () => {
    if (!team) {
      setError("Team not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedIds = Array.from(selectedUserIds);
      const existingIds = existingMappings.map((m) => m.user_id);

      // Find users to add (in selected but not in existing)
      const toAdd = selectedIds.filter((id) => !existingIds.includes(id));

      // Find users to remove (in existing but not in selected)
      const toRemove = existingIds.filter((id) => !selectedIds.includes(id));

      // Remove mappings for deselected users
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_teams")
          .delete()
          .eq("team_id", team.id)
          .in("user_id", toRemove);

        if (deleteError) {
          console.error("Error removing user mappings:", deleteError);
          setError("Failed to remove user mappings");
          setLoading(false);
          return;
        }
      }

      // Add mappings for newly selected users
      if (toAdd.length > 0) {
        const newMappings = toAdd.map((userId) => ({
          team_id: team.id,
          user_id: userId,
        }));

        const { error: insertError } = await supabase
          .from("user_teams")
          .insert(newMappings);

        if (insertError) {
          console.error("Error adding user mappings:", insertError);
          setError("Failed to add user mappings");
          setLoading(false);
          return;
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error saving users:", err);
      setError("Failed to save users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-text-dark">
            Manage Team Users
          </h2>
          {team && (
            <p className="text-sm text-text-secondary mt-1">
              Managing users for team: {team.name}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          disabled={loading}
          className="p-2 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X size={20} className="text-text-secondary" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
          {error}
        </div>
      )}

      {loadingUsers || loadingMappings ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-text-secondary">
            {loadingUsers ? "Loading users..." : "Loading existing mappings..."}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Option */}
          {users.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border-hr hover:bg-sidebar-sub-item-hover transition-colors">
              <input
                type="checkbox"
                id="select-all"
                checked={
                  users.length > 0 && selectedUserIds.size === users.length
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-border-hr text-brand focus:ring-brand focus:ring-2 cursor-pointer"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium text-text-primary cursor-pointer flex-1"
              >
                Select All
              </label>
              <span className="text-xs text-text-secondary">
                {selectedUserIds.size} of {users.length} selected
              </span>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {users.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No users found
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border-hr hover:bg-sidebar-sub-item-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedUserIds.has(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="w-4 h-4 rounded border-border-hr text-brand focus:ring-brand focus:ring-2 cursor-pointer"
                  />
                  <label
                    htmlFor={`user-${user.id}`}
                    className="text-sm text-text-primary cursor-pointer flex-1"
                  >
                    {user.name || user.email}
                    {user.email && user.name && (
                      <span className="text-xs text-text-secondary ml-2">
                        ({user.email})
                      </span>
                    )}
                    {user.title && (
                      <span className="text-xs text-text-secondary ml-2">
                        - {user.title}
                      </span>
                    )}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 mt-6 border-t border-border-hr">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || loadingUsers || loadingMappings}
          className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </ModalWrapper>
  );
}
