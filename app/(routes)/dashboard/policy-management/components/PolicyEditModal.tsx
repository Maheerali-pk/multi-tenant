"use client";

import { useState, useEffect, useMemo } from "react";
import { X, FileText, FileEdit, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModalWrapper from "@/app/components/ModalWrapper";
import Tabs, { Tab } from "@/app/components/Tabs";
import { CustomSelect, SelectOption } from "@/app/components/CustomSelect";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import type { TablesUpdate } from "@/app/types/database.types";
import PolicyComment from "@/app/(routes)/dashboard/policy-management/components/PolicyComment";
import RichTextEditor from "@/app/components/RichTextEditor";
import Input from "@/app/components/Input";
import Button from "@/app/components/Button";
import { usePolicyDetails } from "@/app/hooks/usePolicyDetails";
import type { PolicyModalStatus } from "@/app/types/policy.types";

type PolicyFormField =
  | "title"
  | "owner"
  | "reviewer"
  | "documentType"
  | "status"
  | "classification"
  | "version"
  | "createdBy"
  | "createdOn"
  | "reviewedBy"
  | "reviewedOn"
  | "approvedBy"
  | "approvedOn"
  | "effectiveDate"
  | "nextReviewDate"
  | "purpose"
  | "scope"
  | "requirements";

interface PolicyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  policyId: string | null;
  status: PolicyModalStatus;
}

// Configuration object for different policy statuses
const POLICY_STATUS_CONFIG: Record<
  PolicyModalStatus,
  {
    modalTitle: string;
    enabledFields: readonly PolicyFormField[];
    actionButtons: {
      cancel?: { show: boolean; label: string; action: () => void };
      save?: { show: boolean; label: string; action: () => void };
      submitForReview?: { show: boolean; label: string; action: () => void };
      requestChanges?: { show: boolean; label: string; action: () => void };
      submitForApproval?: { show: boolean; label: string; action: () => void };
      approve?: { show: boolean; label: string; action: () => void };
      reject?: { show: boolean; label: string; action: () => void };
    };
  }
> = {
  draft: {
    modalTitle: "Edit Policy (Draft)",
    enabledFields: [
      "title",
      "owner",
      "reviewer",
      "classification",
      "version",
      "nextReviewDate",
      "purpose",
      "scope",
      "requirements",
    ] as const,
    actionButtons: {
      cancel: { show: true, label: "Cancel", action: () => {} },
      save: { show: true, label: "Save as Draft", action: () => {} },
      submitForReview: {
        show: true,
        label: "Submit for Review",
        action: () => {},
      },
    },
  },
  "under-review": {
    modalTitle: "Review Policy",
    enabledFields: [] as const,
    actionButtons: {
      cancel: { show: true, label: "Close", action: () => {} },
      requestChanges: {
        show: true,
        label: "Request Changes",
        action: () => {},
      },
      submitForApproval: {
        show: true,
        label: "Submit for Approval",
        action: () => {},
      },
    },
  },
  "changes-required": {
    modalTitle: "Edit Policy (Changes Required)",
    enabledFields: [
      "title",
      "owner",
      "reviewer",
      "classification",
      "version",
      "purpose",
      "scope",
      "requirements",
    ] as const,
    actionButtons: {
      cancel: { show: true, label: "Cancel", action: () => {} },
      save: { show: true, label: "Save Changes", action: () => {} },
      submitForReview: {
        show: true,
        label: "Resubmit for Review",
        action: () => {},
      },
    },
  },
  "waiting-approval": {
    modalTitle: "View Policy (Waiting for Approval)",
    enabledFields: [] as const,
    actionButtons: {
      cancel: { show: true, label: "Close", action: () => {} },
      approve: { show: true, label: "Approve", action: () => {} },
      reject: { show: true, label: "Request Changes", action: () => {} },
    },
  },
  approved: {
    modalTitle: "View Policy (Approved)",
    enabledFields: [] as const,
    actionButtons: {
      cancel: { show: true, label: "Close", action: () => {} },
    },
  },
};

export default function PolicyEditModal({
  isOpen,
  onClose,
  onSuccess,
  policyId,
  status,
}: PolicyEditModalProps) {
  // Get configuration for current status
  const config = POLICY_STATUS_CONFIG[status];
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [activeTab, setActiveTab] = useState<string>("tab1");

  // Use custom hook for data fetching
  const {
    teams,
    users,
    classifications,
    documentLifecycleStatuses,
    documentTypes,
    initialFormData,
    comments: fetchedComments,
    loadingData,
    error: dataError,
    policyTypeId,
  } = usePolicyDetails(policyId, isOpen);

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    owner: "",
    reviewer: "",
    documentType: "",
    status: "",
    classification: "",
    version: "",
    createdBy: "",
    createdOn: "",
    reviewedBy: "",
    reviewedOn: "",
    approvedBy: "",
    approvedOn: "",
    effectiveDate: "",
    nextReviewDate: "",
    purpose: "",
    scope: "",
    requirements: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState(fetchedComments);
  const [newComment, setNewComment] = useState("");

  const tabs: Tab[] = [
    { id: "tab1", label: "Policy Document", icon: <FileText size={16} /> },
    { id: "tab2", label: "Content", icon: <FileEdit size={16} /> },
    { id: "tab3", label: "Comments", icon: <MessageSquare size={16} /> },
  ];

  // Initialize form data when policy data is loaded
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
  }, [initialFormData]);

  // Set document type to "Policy" when policyTypeId is available
  useEffect(() => {
    if (policyTypeId && formData.documentType !== policyTypeId) {
      setFormData((prev) => ({
        ...prev,
        documentType: policyTypeId,
      }));
    }
  }, [policyTypeId, formData.documentType]);

  // Sync comments from hook
  useEffect(() => {
    setComments(fetchedComments);
  }, [fetchedComments]);

  // Sync error from hook
  useEffect(() => {
    if (dataError) {
      setError(dataError);
    }
  }, [dataError]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("tab1");
      setFormData({
        title: "",
        owner: "",
        reviewer: "",
        documentType: "",
        status: "",
        classification: "",
        version: "",
        createdBy: "",
        createdOn: "",
        reviewedBy: "",
        reviewedOn: "",
        approvedBy: "",
        approvedOn: "",
        effectiveDate: "",
        nextReviewDate: "",
        purpose: "",
        scope: "",
        requirements: "",
      });
      setComments([]);
      setNewComment("");
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Combined owner options (teams + users)
  const ownerOptions: SelectOption[] = useMemo(() => {
    const teamOptions: SelectOption[] = teams.map((team) => ({
      value: `team:${team.id}`,
      label: team.name,
    }));

    const userOptions: SelectOption[] = users.map((user) => ({
      value: `user:${user.id}`,
      label: user.name,
    }));

    return [...teamOptions, ...userOptions];
  }, [teams, users]);

  // Combined reviewer options (teams + users)
  const reviewerOptions: SelectOption[] = useMemo(() => {
    const teamOptions: SelectOption[] = teams.map((team) => ({
      value: `team:${team.id}`,
      label: team.name,
    }));

    const userOptions: SelectOption[] = users.map((user) => ({
      value: `user:${user.id}`,
      label: user.name,
    }));

    return [...teamOptions, ...userOptions];
  }, [teams, users]);

  // Document lifecycle status options
  const statusOptions: SelectOption[] = useMemo(
    () =>
      documentLifecycleStatuses.map((status) => ({
        value: status.id.toString(),
        label: status.name,
      })),
    [documentLifecycleStatuses]
  );

  // Document type options
  const documentTypeOptions: SelectOption[] = useMemo(
    () =>
      documentTypes.map((type) => ({
        value: type.id.toString(),
        label: type.name,
      })),
    [documentTypes]
  );

  // Classification options
  const classificationOptions: SelectOption[] = useMemo(
    () =>
      classifications.map((cls) => ({
        value: cls.id.toString(),
        label: cls.name,
      })),
    [classifications]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "tab1":
        return (
          <div className="py-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-text-primary"
                >
                  Title <span className="text-failure">*</span>
                </label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={!config.enabledFields.includes("title")}
                  placeholder="Enter policy title"
                />
              </div>

              {/* Owner */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="owner"
                  className="text-sm font-medium text-text-primary"
                >
                  Owner
                </label>
                <CustomSelect
                  id="owner"
                  name="owner"
                  options={ownerOptions}
                  value={formData.owner}
                  onChange={(value) => handleSelectChange("owner", value)}
                  placeholder="Select owner"
                  isDisabled={
                    loadingData || !config.enabledFields.includes("owner")
                  }
                />
              </div>

              {/* Reviewer */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reviewer"
                  className="text-sm font-medium text-text-primary"
                >
                  Reviewer
                </label>
                <CustomSelect
                  id="reviewer"
                  name="reviewer"
                  options={reviewerOptions}
                  value={formData.reviewer}
                  onChange={(value) => handleSelectChange("reviewer", value)}
                  placeholder="Select reviewer"
                  isDisabled={
                    loadingData || !config.enabledFields.includes("reviewer")
                  }
                />
              </div>

              {/* Document Type */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="documentType"
                  className="text-sm font-medium text-text-primary"
                >
                  Document Type
                </label>
                <CustomSelect
                  id="documentType"
                  name="documentType"
                  options={documentTypeOptions}
                  value={formData.documentType}
                  onChange={(value) =>
                    handleSelectChange("documentType", value)
                  }
                  placeholder="Select document type"
                  isDisabled={!config.enabledFields.includes("documentType")}
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="status"
                  className="text-sm font-medium text-text-primary"
                >
                  Status
                </label>
                <CustomSelect
                  id="status"
                  name="status"
                  options={statusOptions}
                  value={formData.status}
                  onChange={(value) => handleSelectChange("status", value)}
                  placeholder="Select status"
                  isDisabled={!config.enabledFields.includes("status")}
                />
              </div>

              {/* Classification */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="classification"
                  className="text-sm font-medium text-text-primary"
                >
                  Classification
                </label>
                <CustomSelect
                  id="classification"
                  name="classification"
                  options={classificationOptions}
                  value={formData.classification}
                  onChange={(value) =>
                    handleSelectChange("classification", value)
                  }
                  placeholder="Select classification"
                  isDisabled={
                    loadingData ||
                    !config.enabledFields.includes("classification")
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="version"
                  className="text-sm font-medium text-text-primary"
                >
                  Version
                </label>
                <Input
                  type="text"
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  disabled={!config.enabledFields.includes("version")}
                  placeholder="Enter version"
                />
              </div>

              {/* Created By */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="createdBy"
                  className="text-sm font-medium text-text-primary"
                >
                  Created By
                </label>
                <Input
                  type="text"
                  id="createdBy"
                  name="createdBy"
                  value={formData.createdBy}
                  disabled
                />
              </div>

              {/* Created On */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="createdOn"
                  className="text-sm font-medium text-text-primary"
                >
                  Created On
                </label>
                <Input
                  type="text"
                  id="createdOn"
                  name="createdOn"
                  value={formData.createdOn}
                  disabled
                />
              </div>

              {/* Reviewed By */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reviewedBy"
                  className="text-sm font-medium text-text-primary"
                >
                  Reviewed By
                </label>
                <Input
                  type="text"
                  id="reviewedBy"
                  name="reviewedBy"
                  value={formData.reviewedBy}
                  disabled
                />
              </div>

              {/* Reviewed On */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reviewedOn"
                  className="text-sm font-medium text-text-primary"
                >
                  Reviewed On
                </label>
                <Input
                  type="text"
                  id="reviewedOn"
                  name="reviewedOn"
                  value={formData.reviewedOn}
                  disabled
                />
              </div>

              {/* Approved By */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="approvedBy"
                  className="text-sm font-medium text-text-primary"
                >
                  Approved By
                </label>
                <Input
                  type="text"
                  id="approvedBy"
                  name="approvedBy"
                  value={formData.approvedBy}
                  disabled
                />
              </div>

              {/* Approved On */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="approvedOn"
                  className="text-sm font-medium text-text-primary"
                >
                  Approved On
                </label>
                <Input
                  type="text"
                  id="approvedOn"
                  name="approvedOn"
                  value={formData.approvedOn}
                  disabled
                />
              </div>

              {/* Effective Date */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="effectiveDate"
                  className="text-sm font-medium text-text-primary"
                >
                  Effective Date
                </label>
                <Input
                  type="text"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  disabled
                />
              </div>

              {/* Next Review Date */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="nextReviewDate"
                  className="text-sm font-medium text-text-primary"
                >
                  Next Review Date
                </label>
                <Input
                  type="date"
                  id="nextReviewDate"
                  name="nextReviewDate"
                  value={formData.nextReviewDate}
                  onChange={handleChange}
                  disabled={!config.enabledFields.includes("nextReviewDate")}
                />
              </div>
            </div>
          </div>
        );
      case "tab2":
        return (
          <div className="py-4 space-y-6">
            {/* Title - Disabled, synced with tab 1 */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="title-tab2"
                className="text-sm font-medium text-text-primary"
              >
                Title
              </label>
              <Input
                type="text"
                id="title-tab2"
                name="title-tab2"
                value={formData.title}
                disabled
              />
            </div>

            {/* Purpose */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="purpose"
                className="text-sm font-medium text-text-primary"
              >
                Purpose
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows={2}
                disabled={!config.enabledFields.includes("purpose")}
                className={`px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none ${
                  !config.enabledFields.includes("purpose")
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                placeholder="Enter purpose"
              />
            </div>

            {/* Scope */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="scope"
                className="text-sm font-medium text-text-primary"
              >
                Scope
              </label>
              <textarea
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleChange}
                rows={2}
                disabled={!config.enabledFields.includes("scope")}
                className={`px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none ${
                  !config.enabledFields.includes("scope")
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                placeholder="Enter scope"
              />
            </div>

            {/* Requirements */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="requirements"
                className="text-sm font-medium text-text-primary"
              >
                Requirements
              </label>
              <RichTextEditor
                value={formData.requirements}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, requirements: html }))
                }
                placeholder="Enter requirements"
                disabled={!config.enabledFields.includes("requirements")}
              />
            </div>
          </div>
        );
      case "tab3":
        return (
          <div className="py-4 space-y-6 flex flex-col h-full flex-1">
            {/* Comments List */}
            <div className="space-y-4 flex-1">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm">
                  No comments yet. Be the first to add a comment.
                </div>
              ) : (
                comments.map((comment) => (
                  <PolicyComment
                    key={comment.id}
                    text={comment.text}
                    userName={comment.user_name}
                    createdAt={comment.created_at}
                  />
                ))
              )}
            </div>

            {/* Add Comment Section */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border-hr">
              <label
                htmlFor="newComment"
                className="text-sm font-medium text-text-primary"
              >
                Add Comment
              </label>
              <textarea
                id="newComment"
                name="newComment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
                placeholder="Enter your comment..."
              />
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  if (newComment.trim()) {
                    const comment = {
                      id: `temp-${Date.now()}-${Math.random()}`,
                      text: newComment.trim(),
                      user_id: auth.userData?.id || "",
                      user_name: auth.userData?.name || "Unknown User",
                      created_at: new Date().toISOString(),
                      isNew: true,
                    };
                    setComments((prev) => [...prev, comment]);
                    setNewComment("");
                  }
                }}
                disabled={!newComment.trim()}
                className="self-start"
              >
                Add Comment
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSave = async () => {
    if (!policyId) return;

    setError(null);

    // Validate required fields
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    // Check if user is authenticated
    if (!auth.userData?.id) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      // Parse owner (format: "team:id" or "user:id")
      let ownerTeamId: string | null = null;
      let ownerUserId: string | null = null;
      if (formData.owner) {
        if (formData.owner.startsWith("team:")) {
          ownerTeamId = formData.owner.replace("team:", "");
        } else if (formData.owner.startsWith("user:")) {
          ownerUserId = formData.owner.replace("user:", "");
        }
      }

      // Parse reviewer (format: "team:id" or "user:id")
      let reviewerTeamId: string | null = null;
      let reviewerUserId: string | null = null;
      if (formData.reviewer) {
        if (formData.reviewer.startsWith("team:")) {
          reviewerTeamId = formData.reviewer.replace("team:", "");
        } else if (formData.reviewer.startsWith("user:")) {
          reviewerUserId = formData.reviewer.replace("user:", "");
        }
      }

      // Convert classification, status, and document type to numbers
      const classificationId = formData.classification
        ? parseInt(formData.classification)
        : null;
      const statusId = formData.status ? parseInt(formData.status) : null;
      const documentTypeId = formData.documentType
        ? parseInt(formData.documentType)
        : null;

      if (!documentTypeId) {
        setError("Document type is required");
        setLoading(false);
        return;
      }

      if (!statusId) {
        setError("Status is required");
        setLoading(false);
        return;
      }

      if (!classificationId) {
        setError("Classification is required");
        setLoading(false);
        return;
      }

      // Prepare policy update data using new table structure
      const policyUpdateData: TablesUpdate<"policies"> = {
        title: formData.title.trim(),
        policy_owner_team_id: ownerTeamId,
        policy_owner_user_id: ownerUserId,
        reviewer_team_id: reviewerTeamId,
        reviewer_user_id: reviewerUserId,
        classification_id: classificationId,
        status_id: statusId,
        document_type_id: documentTypeId,
        version: formData.version.trim() || undefined,
        objective: formData.purpose.trim() || null,
        scope: formData.scope.trim() || null,
        requirements: formData.requirements.trim() || null,
        next_review_date: formData.nextReviewDate || null,
      };

      // Update policy
      const { error: policyError } = await supabase
        .from("policies")
        .update(policyUpdateData)
        .eq("id", policyId);

      if (policyError) {
        console.error("Error updating policy:", policyError);
        setError(policyError.message || "Failed to update policy");
        setLoading(false);
        return;
      }

      // Save new comments (only those marked as new)
      const newComments = comments.filter((comment) => comment.isNew);
      if (newComments.length > 0) {
        const commentsData = newComments.map((comment) => ({
          policy_id: policyId,
          user_id: comment.user_id,
          text: comment.text,
          created_at: comment.created_at,
        }));

        const { error: commentsError } = await supabase
          .from("policy_comments")
          .insert(commentsData);

        if (commentsError) {
          console.error("Error saving comments:", commentsError);
          // Don't fail the whole operation if comments fail, just log it
        }
      }

      // Call onSuccess to refresh the table
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error("Error updating policy:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    // Submit for review logic
    if (!policyId) return;

    setError(null);

    // Validate required fields
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);

    try {
      // Update status to "under-review"
      // TODO: Replace with actual status ID from documentLifecycleStatuses
      const underReviewStatus = documentLifecycleStatuses.find(
        (s) => s.name.toLowerCase() === "under review"
      );
      const { error: statusError } = await supabase
        .from("policies")
        .update({ status_id: underReviewStatus?.id || null })
        .eq("id", policyId);

      if (statusError) {
        console.error("Error updating status:", statusError);
        setError("Failed to submit for review");
        setLoading(false);
        return;
      }

      // Call onSuccess to refresh the table
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error("Error submitting for review:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!policyId) return;

    setError(null);
    setLoading(true);

    try {
      // Update status to "approved"
      // TODO: Replace with actual status ID from documentLifecycleStatuses
      const approvedStatus = documentLifecycleStatuses.find(
        (s) => s.name.toLowerCase() === "approved"
      );
      const { error: statusError } = await supabase
        .from("policies")
        .update({ status_id: approvedStatus?.id || null })
        .eq("id", policyId);

      if (statusError) {
        console.error("Error approving policy:", statusError);
        setError("Failed to approve policy");
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      console.error("Error approving policy:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!policyId) return;

    setError(null);
    setLoading(true);

    try {
      // Update status to "changes-required"
      // TODO: Replace with actual status ID from documentLifecycleStatuses
      const changesRequiredStatus = documentLifecycleStatuses.find(
        (s) => s.name.toLowerCase() === "changes-required"
      );
      const { error: statusError } = await supabase
        .from("policies")
        .update({ status_id: changesRequiredStatus?.id || null })
        .eq("id", policyId);

      if (statusError) {
        console.error("Error rejecting policy:", statusError);
        setError("Failed to request changes");
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      console.error("Error rejecting policy:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      className="flex flex-col h-[80vh]"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">
          {config.modalTitle}
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

      {/* Tabs Component - Only handles headers */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content - Rendered outside Tabs component */}
      <div className="mt-6 overflow-y-auto flex-1">
        {loadingData ? (
          <div className="flex items-center justify-center py-8 text-text-secondary">
            Loading policy data...
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Action Buttons - Shared between tabs */}
      <div className="flex gap-3 pt-6 mt-6 border-t border-border-hr">
        {config.actionButtons.cancel?.show && (
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            {config.actionButtons.cancel.label}
          </Button>
        )}
        {config.actionButtons.save?.show && (
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={loading || loadingData}
            className="flex-1"
          >
            {loading ? "Saving..." : config.actionButtons.save.label}
          </Button>
        )}
        {config.actionButtons.submitForReview?.show && (
          <Button
            type="button"
            variant="success"
            onClick={handleSubmitForReview}
            disabled={loading || loadingData}
            className="flex-1"
          >
            {config.actionButtons.submitForReview.label}
          </Button>
        )}
        {config.actionButtons.requestChanges?.show && (
          <Button
            type="button"
            variant="primary"
            onClick={handleReject}
            disabled={loading || loadingData}
            className="flex-1"
          >
            {config.actionButtons.requestChanges.label}
          </Button>
        )}
        {config.actionButtons.submitForApproval?.show && (
          <Button
            type="button"
            variant="success"
            onClick={handleSubmitForReview}
            disabled={loading || loadingData}
            className="flex-1"
          >
            {config.actionButtons.submitForApproval.label}
          </Button>
        )}
        {config.actionButtons.approve?.show && (
          <Button
            type="button"
            variant="success"
            onClick={handleApprove}
            disabled={loading || loadingData}
            className="flex-1"
          >
            {config.actionButtons.approve.label}
          </Button>
        )}
        {config.actionButtons.reject?.show && (
          <Button
            type="button"
            variant="danger"
            onClick={handleReject}
            disabled={loading || loadingData}
            className="flex-1"
          >
            {config.actionButtons.reject.label}
          </Button>
        )}
      </div>
    </ModalWrapper>
  );
}
