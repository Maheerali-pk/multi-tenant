"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModalWrapper from "@/app/components/modal-wrapper";
import type { TablesInsert } from "@/app/types/database.types";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

type TeamInsert = TablesInsert<"teams">;

interface CreateTeamProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateTeam({
  isOpen,
  onClose,
  onSuccess,
}: CreateTeamProps) {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
      });
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    // For superadmin, check if tenant is selected
    const isSuperAdmin = auth.userData?.role === "superadmin";
    const tenantId = isSuperAdmin
      ? state.selectedTenantId
      : auth.userData?.tenant_id;

    if (!tenantId) {
      setError(
        isSuperAdmin ? "Please select a tenant" : "User tenant not found"
      );
      return;
    }

    setLoading(true);

    try {
      const teamData: TeamInsert = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        tenant_id: tenantId,
      };

      const { error: insertError } = await supabase
        .from("teams")
        .insert(teamData);

      if (insertError) {
        setError(insertError.message || "Failed to create team");
        setLoading(false);
        return;
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
      });
      setError(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Create team error:", err);
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
        <h2 className="text-2xl font-semibold text-text-dark">
          Create New Team
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer"
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
            className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
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
            className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
            placeholder="Enter team email (optional)"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Creating..." : "Create Team"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

