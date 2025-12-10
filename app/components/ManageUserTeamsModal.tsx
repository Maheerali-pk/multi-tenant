"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/app/types/database.types";
import type { UserRow } from "@/app/components/UsersTable";
import ModalWrapper from "./ModalWrapper";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

type Team = Tables<"teams">;

// Type definition for user_teams table
type UserTeam = {
  team_id: string;
  user_id: string;
};

interface TeamListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: UserRow | null;
}

export default function ManageUserTeamsModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: TeamListModalProps) {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    new Set()
  );
  const [existingMappings, setExistingMappings] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTeamIds(new Set());
      setExistingMappings([]);
      setError(null);
    }
  }, [isOpen]);

  // Fetch teams and existing mappings when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchTeams();
      fetchExistingMappings();
    }
  }, [isOpen, user]);

  const fetchTeams = async () => {
    if (!user) return;

    setLoadingTeams(true);
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
        setLoadingTeams(false);
        return;
      }

      const { data, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, email")
        .eq("tenant_id", tenantId)
        .order("name");

      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
        setError("Failed to load teams");
      } else {
        setTeams((data as Team[]) || []);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError("Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchExistingMappings = async () => {
    if (!user) return;

    setLoadingMappings(true);
    try {
      const { data, error: mappingsError } = await supabase
        .from("user_teams")
        .select("team_id, user_id")
        .eq("user_id", user.id);

      if (mappingsError) {
        console.error("Error fetching existing mappings:", mappingsError);
        setError("Failed to load existing team mappings");
      } else {
        const mappings = (data as UserTeam[]) || [];
        setExistingMappings(mappings);
        // Pre-select teams that the user is already mapped to
        const existingTeamIds = new Set(mappings.map((m) => m.team_id));
        setSelectedTeamIds(existingTeamIds);
      }
    } catch (err) {
      console.error("Error fetching existing mappings:", err);
      setError("Failed to load existing team mappings");
    } finally {
      setLoadingMappings(false);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeamIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTeamIds.size === teams.length) {
      // Deselect all
      setSelectedTeamIds(new Set());
    } else {
      // Select all
      setSelectedTeamIds(new Set(teams.map((team) => team.id)));
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedIds = Array.from(selectedTeamIds);
      const existingIds = existingMappings.map((m) => m.team_id);

      // Find teams to add (in selected but not in existing)
      const toAdd = selectedIds.filter((id) => !existingIds.includes(id));

      // Find teams to remove (in existing but not in selected)
      const toRemove = existingIds.filter((id) => !selectedIds.includes(id));

      // Remove mappings for deselected teams
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_teams")
          .delete()
          .eq("user_id", user.id)
          .in("team_id", toRemove);

        if (deleteError) {
          console.error("Error removing team mappings:", deleteError);
          setError("Failed to remove team mappings");
          setLoading(false);
          return;
        }
      }

      // Add mappings for newly selected teams
      if (toAdd.length > 0) {
        const newMappings = toAdd.map((teamId) => ({
          user_id: user.id,
          team_id: teamId,
        }));

        const { error: insertError } = await supabase
          .from("user_teams")
          .insert(newMappings);

        if (insertError) {
          console.error("Error adding team mappings:", insertError);
          setError("Failed to add team mappings");
          setLoading(false);
          return;
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error saving teams:", err);
      setError("Failed to save teams");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-text-dark">
            Manage User Teams
          </h2>
          {user && (
            <p className="text-sm text-text-secondary mt-1">
              Managing teams for: {user.name || user.email}
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

      {loadingTeams || loadingMappings ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-text-secondary">
            {loadingTeams ? "Loading teams..." : "Loading existing mappings..."}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Option */}
          {teams.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border-hr hover:bg-sidebar-sub-item-hover transition-colors">
              <input
                type="checkbox"
                id="select-all"
                checked={
                  teams.length > 0 && selectedTeamIds.size === teams.length
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
                {selectedTeamIds.size} of {teams.length} selected
              </span>
            </div>
          )}

          {/* Teams List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {teams.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No teams found
              </div>
            ) : (
              teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border-hr hover:bg-sidebar-sub-item-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`team-${team.id}`}
                    checked={selectedTeamIds.has(team.id)}
                    onChange={() => handleTeamToggle(team.id)}
                    className="w-4 h-4 rounded border-border-hr text-brand focus:ring-brand focus:ring-2 cursor-pointer"
                  />
                  <label
                    htmlFor={`team-${team.id}`}
                    className="text-sm text-text-primary cursor-pointer flex-1"
                  >
                    {team.name}
                    {team.email && (
                      <span className="text-xs text-text-secondary ml-2">
                        ({team.email})
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
          disabled={loading || loadingTeams || loadingMappings}
          className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </ModalWrapper>
  );
}
