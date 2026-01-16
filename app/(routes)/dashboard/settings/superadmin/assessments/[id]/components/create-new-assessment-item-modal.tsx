"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModalWrapper from "@/app/components/modal-wrapper";
import type { TablesInsert } from "@/app/types/database.types";
import { toast } from "react-toastify";
import CustomSelect from "@/app/components/custom-select";
import {
  checkMethodOptions,
  importanceOptions,
} from "@/app/helpers/permenantTablesData";

type AssessmentItemInsert = TablesInsert<"assessment_items">;

interface CreateNewAssessmentItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  assessmentId: string;
}

export default function CreateNewAssessmentItemModal({
  isOpen,
  onClose,
  onSuccess,
  assessmentId,
}: CreateNewAssessmentItemModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    what_to_check: "",
    category: "",
    how_to_check: "",
    check_method: "",
    evidence_hint: "",
    how_it_helps: "",
    importance: "",
    required: false,
    is_active: true,
    sort_order: 0,
    integration_key: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        what_to_check: "",
        category: "",
        how_to_check: "",
        check_method: "",
        evidence_hint: "",
        how_it_helps: "",
        importance: "",
        required: false,
        is_active: true,
        sort_order: 0,
        integration_key: "",
        notes: "",
      });
      setError(null);
    }
  }, [isOpen]);

  // Fetch max sort_order when modal opens
  useEffect(() => {
    if (isOpen && assessmentId) {
      fetchMaxSortOrder();
    }
  }, [isOpen, assessmentId]);

  const fetchMaxSortOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("assessment_items")
        .select("sort_order")
        .eq("assessment_id", assessmentId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setFormData((prev) => ({
          ...prev,
          sort_order: (data.sort_order || 0) + 1,
        }));
      }
    } catch (err) {
      // If no items exist, start at 0
      setFormData((prev) => ({
        ...prev,
        sort_order: 0,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.what_to_check.trim()) {
      setError("What to Check is required");
      return;
    }

    setLoading(true);

    try {
      const itemData: AssessmentItemInsert = {
        assessment_id: assessmentId,
        title: formData.title.trim(),
        what_to_check: formData.what_to_check.trim(),
        category: formData.category.trim() || null,
        how_to_check: formData.how_to_check.trim() || null,
        check_method: formData.check_method.trim() || null,
        evidence_hint: formData.evidence_hint.trim() || null,
        how_it_helps: formData.how_it_helps.trim() || null,
        importance: formData.importance.trim() || null,
        required: formData.required,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
        integration_key: formData.integration_key.trim() || null,
        notes: formData.notes.trim() || null,
      };

      const { error: insertError } = await supabase
        .from("assessment_items")
        .insert(itemData);

      if (insertError) {
        console.error("Error creating assessment item:", insertError);
        setError(insertError.message || "Failed to create assessment item");
        setLoading(false);
        return;
      }

      // Show success toast
      toast.success("Assessment item created successfully");

      // Reset form
      setFormData({
        title: "",
        what_to_check: "",
        category: "",
        how_to_check: "",
        check_method: "",
        evidence_hint: "",
        how_it_helps: "",
        importance: "",
        required: false,
        is_active: true,
        sort_order: formData.sort_order + 1,
        integration_key: "",
        notes: "",
      });
      setError(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Create assessment item error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth=" "
      className="flex flex-col w-[80vw]! h-[90vh] max-w-full "
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">
          Create New Assessment Item
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

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="space-y-3 pb-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Title Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="title"
                className="text-sm font-medium text-text-primary"
              >
                Title <span className="text-failure">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                placeholder="Enter item title"
              />
            </div>

            {/* Category Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="category"
                className="text-sm font-medium text-text-primary"
              >
                Category
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                placeholder="Enter category (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* What to Check Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="what_to_check"
                className="text-sm font-medium text-text-primary"
              >
                What to Check <span className="text-failure">*</span>
              </label>
              <textarea
                id="what_to_check"
                name="what_to_check"
                value={formData.what_to_check}
                onChange={handleChange}
                required
                rows={2}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
                placeholder="Enter what to check"
              />
            </div>

            {/* How to Check Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="how_to_check"
                className="text-sm font-medium text-text-primary"
              >
                How to Check
              </label>
              <textarea
                id="how_to_check"
                name="how_to_check"
                value={formData.how_to_check}
                onChange={handleChange}
                rows={2}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
                placeholder="Enter how to check (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Check Method Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="check_method"
                className="text-sm font-medium text-text-primary"
              >
                Check Method
              </label>
              <CustomSelect
                id="check_method"
                name="check_method"
                options={checkMethodOptions}
                value={formData.check_method}
                onChange={(value) => handleSelectChange("check_method", value)}
                placeholder="Select check method (optional)"
              />
            </div>

            {/* Importance Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="importance"
                className="text-sm font-medium text-text-primary"
              >
                Importance
              </label>
              <CustomSelect
                id="importance"
                name="importance"
                options={importanceOptions}
                value={formData.importance}
                onChange={(value) => handleSelectChange("importance", value)}
                placeholder="Select importance (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Evidence Hint Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="evidence_hint"
                className="text-sm font-medium text-text-primary"
              >
                Evidence Hint
              </label>
              <textarea
                id="evidence_hint"
                name="evidence_hint"
                value={formData.evidence_hint}
                onChange={handleChange}
                rows={2}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
                placeholder="Enter evidence hint (optional)"
              />
            </div>

            {/* How It Helps Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="how_it_helps"
                className="text-sm font-medium text-text-primary"
              >
                How It Helps
              </label>
              <textarea
                id="how_it_helps"
                name="how_it_helps"
                value={formData.how_it_helps}
                onChange={handleChange}
                rows={2}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
                placeholder="Enter how it helps (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sort Order Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="sort_order"
                className="text-sm font-medium text-text-primary"
              >
                Sort Order
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleChange}
                min="0"
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                placeholder="Enter sort order"
              />
            </div>

            {/* Integration Key Field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="integration_key"
                className="text-sm font-medium text-text-primary"
              >
                Integration Key
              </label>
              <input
                type="text"
                id="integration_key"
                name="integration_key"
                value={formData.integration_key}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                placeholder="Enter integration key (optional)"
              />
            </div>
          </div>

          {/* Required and Active Checkboxes */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                name="required"
                checked={formData.required}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border-hr text-brand focus:ring-brand cursor-pointer"
              />
              <label
                htmlFor="required"
                className="text-sm font-medium text-text-primary cursor-pointer"
              >
                Required
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border-hr text-brand focus:ring-brand cursor-pointer"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-text-primary cursor-pointer"
              >
                Active
              </label>
            </div>
          </div>

          {/* Notes Field - Full Width */}
          <div className="flex flex-col gap-1">
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
              rows={2}
              className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
              placeholder="Enter notes (optional)"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 mt-auto border-t border-border-hr">
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
            {loading ? "Creating..." : "Create Item"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
