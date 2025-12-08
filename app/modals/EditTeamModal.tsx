"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TablesUpdate } from "@/app/types/database.types";
import type { TeamRow } from "@/app/components/TeamsTable";
import ModalWrapper from "@/app/components/ModalWrapper";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

type TeamUpdate = TablesUpdate<"teams">;

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  team: TeamRow | null;
}

export default function EditTeamModal({
  isOpen,
  onClose,
  onSuccess,
  team,
}: EditTeamModalProps) {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Fetch team data when modal opens
  useEffect(() => {
    if (isOpen && team) {
      fetchTeamData();
    }
  }, [isOpen, team]);

  const fetchTeamData = async () => {
    if (!team) return;

    setLoadingTeam(true);
    try {
      const isSuperAdmin = auth.userData?.role === "superadmin";
      const tenantId = isSuperAdmin
        ? state.selectedTenantId
        : auth.userData?.tenant_id;
      if (!tenantId) {
        setError(
          isSuperAdmin ? "Please select a tenant" : "User tenant not found"
        );
        setLoadingTeam(false);
        return;
      }

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", team.id)
        .eq("tenant_id", tenantId)
        .single();

      if (teamError) {
        console.error("Error fetching team:", teamError);
        setError("Failed to load team data");
        setLoadingTeam(false);
        return;
      }

      if (teamData) {
        // Prefill form with existing data
        setFormData({
          name: teamData.name || "",
          email: teamData.email || "",
        });
      }
    } catch (err) {
      console.error("Error fetching team:", err);
      setError("Failed to load team data");
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!team) {
      setError("Team not found");
      return;
    }

    setLoading(true);

    try {
      const teamData: TeamUpdate = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
      };

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

      const { error: updateError } = await supabase
        .from("teams")
        .update(teamData)
        .eq("id", team.id)
        .eq("tenant_id", tenantId);

      if (updateError) {
        setError(updateError.message || "Failed to update team");
        setLoading(false);
        return;
      }

      setError(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Update team error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">Edit Team</h2>
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

      {loadingTeam && (
        <div className="mb-4 p-3 rounded-lg bg-sidebar-sub-item-hover text-text-secondary text-sm">
          Loading team data...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="name"
            className="text-sm font-medium text-text-primary"
          >
            Name <span className="text-failure">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loadingTeam}
            className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary disabled:opacity-50"
            placeholder="Enter team name"
          />
        </div>

        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-text-primary"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loadingTeam}
            className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary disabled:opacity-50"
            placeholder="Enter team email (optional)"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || loadingTeam}
            className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingTeam}
            className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Updating..." : "Update Team"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

