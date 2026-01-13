"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModalWrapper from "@/app/components/modal-wrapper";
import type { TablesInsert, Tables } from "@/app/types/database.types";
import { CustomSelect, SelectOption } from "@/app/components/custom-select";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { toast } from "react-toastify";
import { capitalizeString } from "../helpers/utils";

type AssessmentInsert = TablesInsert<"assessment_catalog">;
type AssessmentStatus = Tables<"assessment_statuses">;

interface CreateNewAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateNewAssessmentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateNewAssessmentModalProps) {
  const [auth] = useAuthContext();
  const [formData, setFormData] = useState({
    name: "",
    version: "",
    status: "",
    description: "",
    notes: "",
  });
  const [statuses, setStatuses] = useState<AssessmentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  // Fetch statuses on mount
  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        version: "",
        status: "",
        description: "",
        notes: "",
      });
      setError(null);
    }
  }, [isOpen]);

  const fetchStatuses = async () => {
    try {
      setLoadingStatuses(true);
      const { data, error } = await supabase
        .from("assessment_statuses")
        .select("*");

      if (error) {
        console.error("Error fetching assessment statuses:", error);
        setError("Failed to load assessment statuses");
        return;
      }

      if (data) {
        setStatuses(data);
      }
    } catch (err) {
      console.error("Unexpected error fetching statuses:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoadingStatuses(false);
    }
  };

  // Convert statuses to SelectOption format
  const statusOptions: SelectOption[] = useMemo(() => {
    return statuses.map((status) => ({
      value: status.id.toString(),
      label: capitalizeString(status.name),
    }));
  }, [statuses]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.version.trim()) {
      setError("Version is required");
      return;
    }

    if (!formData.status) {
      setError("Status is required");
      return;
    }

    // Check if user is logged in
    if (!auth.userData?.id) {
      setError("You must be logged in to create an assessment");
      return;
    }

    setLoading(true);

    try {
      const assessmentData: AssessmentInsert = {
        name: formData.name.trim(),
        version: formData.version.trim(),
        status: parseInt(formData.status),
        created_by: auth.userData.id,
        description: formData.description.trim() || null,
        notes: formData.notes.trim() || null,
        tenant_id: null, // Can be set later if needed
      };

      const { error: insertError } = await supabase
        .from("assessment_catalog")
        .insert(assessmentData);

      if (insertError) {
        console.error("Error creating assessment:", insertError);
        setError(insertError.message || "Failed to create assessment");
        setLoading(false);
        return;
      }

      // Show success toast
      toast.success("Assessment created successfully");

      // Reset form
      setFormData({
        name: "",
        version: "",
        status: "",
        description: "",
        notes: "",
      });
      setError(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Create assessment error:", err);
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

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value || "",
    }));
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">
          Create New Assessment
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

      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
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
            placeholder="Enter assessment name"
          />
        </div>

        {/* Version Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="version"
            className="text-sm font-medium text-text-primary"
          >
            Version <span className="text-failure">*</span>
          </label>
          <input
            type="text"
            id="version"
            name="version"
            value={formData.version}
            onChange={handleChange}
            required
            className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
            placeholder="Enter version (e.g., 1.0.0)"
          />
        </div>

        {/* Status Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="status"
            className="text-sm font-medium text-text-primary"
          >
            Status <span className="text-failure">*</span>
          </label>
          <CustomSelect
            options={statusOptions}
            value={formData.status}
            onChange={handleStatusChange}
            placeholder="Select status"
            isDisabled={loadingStatuses}
          />
        </div>

        {/* Description Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="description"
            className="text-sm font-medium text-text-primary"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
            placeholder="Enter description (optional)"
          />
        </div>

        {/* Notes Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="notes"
            className="text-sm font-medium text-text-primary"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
            placeholder="Enter notes (optional)"
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
            {loading ? "Creating..." : "Create Assessment"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
