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
import type {
  PolicyModalStatus,
  DocumentLifecycleStatusName,
  PolicyUserRole,
} from "@/app/types/policy.types";
import EditModalButtons from "./edit-modal-buttons";

export type PolicyFormField =
  | "title"
  | "owner"
  | "reviewer"
  | "approver"
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

export type PolicyActionButtons = {
  cancel?: { show: boolean; label: string; action: () => void };
  save?: { show: boolean; label: string; action: () => void };
  submitForReview?: { show: boolean; label: string; action: () => void };
  requestChanges?: { show: boolean; label: string; action: () => void };
  submitForApproval?: { show: boolean; label: string; action: () => void };
  approve?: { show: boolean; label: string; action: () => void };
  reject?: { show: boolean; label: string; action: () => void };
};

interface PolicyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  policyId: string | null;
  status: PolicyModalStatus;
  userRolesForPolicy: PolicyUserRole[];
}

// Function to get policy configuration based on status and user role
const getPolicyConfig = (
  status: PolicyModalStatus,
  userRoles: PolicyUserRole[]
): {
  modalTitle: string;
  enabledFields: readonly PolicyFormField[];
  actionButtons: PolicyActionButtons;
} => {
  // Draft status - same for all roles
  if (status === "draft") {
    return {
      modalTitle: "Edit Policy (Draft)",
      enabledFields: [
        "title",
        "owner",
        "reviewer",
        "approver",
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
    };
  }

  // Under-review status - role-specific behavior
  if (status === "under-review") {
    if (userRoles.includes("reviewer")) {
      return {
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
      };
    }

    // Default for other roles (approver, owner, none)
    return {
      modalTitle: "View Policy (Under Review)",
      enabledFields: [] as const,
      actionButtons: {
        cancel: { show: true, label: "Close", action: () => {} },
      },
    };
  }

  // Changes-required status - same for all roles
  if (status === "changes-required") {
    if (userRoles.includes("creator")) {
      return {
        modalTitle: "Edit Policy",
        enabledFields: [
          "title",
          "owner",
          "reviewer",
          "approver",
          "classification",
          "version",
          "purpose",
          "scope",
          "requirements",
        ] as const,
        actionButtons: {
          cancel: { show: true, label: "Cancel", action: () => {} },
          save: { show: true, label: "Save as Draft", action: () => {} },
          submitForReview: {
            show: true,
            label: "Resubmit for Review",
            action: () => {},
          },
        },
      };
    }
    return {
      modalTitle: "View Policy (Changes Required)",
      enabledFields: [] as const,
      actionButtons: {
        cancel: { show: true, label: "Close", action: () => {} },
      },
    };
  }

  // Waiting-approval status - role-specific behavior
  if (status === "waiting-approval") {
    if (userRoles.includes("approver")) {
      return {
        modalTitle: "Approve Policy",
        enabledFields: [] as const,
        actionButtons: {
          cancel: { show: true, label: "Close", action: () => {} },
          approve: { show: true, label: "Approve", action: () => {} },
          requestChanges: {
            show: true,
            label: "Request Changes",
            action: () => {},
          },
        },
      };
    }

    // Default for other roles (creator, reviewer, owner, none)
    return {
      modalTitle: "View Policy (Waiting for Approval)",
      enabledFields: [] as const,
      actionButtons: {
        cancel: { show: true, label: "Close", action: () => {} },
      },
    };
  }

  // Approved status - same for all roles
  if (status === "approved") {
    return {
      modalTitle: "View Policy",
      enabledFields: [] as const,
      actionButtons: {
        cancel: { show: true, label: "Close", action: () => {} },
      },
    };
  }

  // Fallback (should never reach here, but TypeScript needs it)
  return {
    modalTitle: "Edit Policy",
    enabledFields: [] as const,
    actionButtons: {
      cancel: { show: true, label: "Close", action: () => {} },
    },
  };
};

export default function PolicyEditModal({
  isOpen,
  onClose,
  onSuccess,
  policyId,
  status,
  userRolesForPolicy,
}: PolicyEditModalProps) {
  // Get configuration for current status and role
  const config = getPolicyConfig(status, userRolesForPolicy);
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
    approver: "",
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
        approver: "",
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

  // Combined approver options (teams + users)
  const approverOptions: SelectOption[] = useMemo(() => {
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
          <div className="">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* First Row: Title */}
              <div className="flex flex-col gap-1">
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

              {/* Second Row: Owner, Approver, Reviewer */}
              <div className="grid grid-cols-[1fr_1fr_1fr_180px] gap-3">
                {/* Owner */}
                <div className="flex flex-col gap-1">
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

                {/* Approver */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="approver"
                    className="text-sm font-medium text-text-primary"
                  >
                    Approver
                  </label>
                  <CustomSelect
                    id="approver"
                    name="approver"
                    options={approverOptions}
                    value={formData.approver}
                    onChange={(value) => handleSelectChange("approver", value)}
                    placeholder="Select approver"
                    isDisabled={
                      loadingData || !config.enabledFields.includes("approver")
                    }
                  />
                </div>

                {/* Reviewer */}
                <div className="flex flex-col gap-1">
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

                {/* Empty space to align with Version column */}
                <div></div>
              </div>

              {/* Third Row: Document Type, Status, Classification, Version */}
              <div className="grid grid-cols-[1fr_1fr_1fr_180px] gap-3">
                {/* Document Type */}
                <div className="flex flex-col gap-1">
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
                <div className="flex flex-col gap-1">
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
                <div className="flex flex-col gap-1">
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

                {/* Version */}
                <div className="flex flex-col gap-1">
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
              </div>

              {/* Date fields and Metadata - Aligned with grid above */}
              <div className="grid grid-cols-[1fr_1fr_1fr_180px] gap-3 pt-1">
                {/* Effective Date - Aligned with Owner */}
                <div className="flex flex-col gap-1">
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

                {/* Next Review Date - Aligned with Approver */}
                <div className="flex flex-col gap-1">
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

                {/* Metadata fields - Spanning remaining columns */}
                <div className="col-span-2 flex flex-col gap-3 pl-4 border-l border-border-hr">
                  {/* First Row: Created and Reviewed */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Created */}
                    <div className="flex flex-col gap-1">
                      <div className="h-5"></div>
                      <div className="flex items-center gap-2 min-h-[40px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                              Created By:
                            </span>
                            <span className="text-sm text-text-secondary font-normal">
                              {formData.createdBy || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                              Created On:
                            </span>
                            <span className="text-sm text-text-secondary font-normal">
                              {formData.createdOn || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reviewed */}
                    <div className="flex flex-col gap-1">
                      <div className="h-5"></div>
                      <div className="flex items-center gap-2 min-h-[40px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                              Reviewed By:
                            </span>
                            <span className="text-sm text-text-secondary font-normal">
                              {formData.reviewedBy || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                              Reviewed On:
                            </span>
                            <span className="text-sm text-text-secondary font-normal">
                              {formData.reviewedOn || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second Row: Approved */}
                  <div className="flex flex-col gap-1">
                    <div className="h-5"></div>
                    <div className="flex items-center gap-2 min-h-[40px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                            Approved By:
                          </span>
                          <span className="text-sm text-text-secondary font-normal">
                            {formData.approvedBy || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                            Approved On:
                          </span>
                          <span className="text-sm text-text-secondary font-normal">
                            {formData.approvedOn || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

      // Parse approver (format: "team:id" or "user:id")
      let approverTeamId: string | null = null;
      let approverUserId: string | null = null;
      if (formData.approver) {
        if (formData.approver.startsWith("team:")) {
          approverTeamId = formData.approver.replace("team:", "");
        } else if (formData.approver.startsWith("user:")) {
          approverUserId = formData.approver.replace("user:", "");
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

      // Check if created_at exists in the database
      const { data: currentPolicy } = await supabase
        .from("policies")
        .select("created_at")
        .eq("id", policyId)
        .single();

      // Prepare policy update data using new table structure
      const policyUpdateData: TablesUpdate<"policies"> = {
        title: formData.title.trim(),
        policy_owner_team_id: ownerTeamId,
        policy_owner_user_id: ownerUserId,
        reviewer_team_id: reviewerTeamId,
        reviewer_user_id: reviewerUserId,
        approver_team_id: approverTeamId,
        approver_user_id: approverUserId,
        classification_id: classificationId,
        status_id: statusId,
        document_type_id: documentTypeId,
        version: formData.version.trim() || undefined,
        objective: formData.purpose.trim() || null,
        scope: formData.scope.trim() || null,
        requirements: formData.requirements.trim() || null,
        next_review_date: formData.nextReviewDate || null,
      };

      // If created_at is not present in database, set it to current date
      if (!currentPolicy?.created_at) {
        policyUpdateData.created_at = new Date().toISOString();
      }

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
      // Update status to "under-review" (stored as "under-review" in DB)
      const underReviewStatus = documentLifecycleStatuses.find(
        (s) => s.name === "under-review"
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
  const handleRequestChanges = async () => {
    if (!policyId) return;

    setError(null);
    setLoading(true);

    try {
      // Update status to "changes-required"
      const changesRequiredStatus = documentLifecycleStatuses.find(
        (s) => s.name === "changes-required"
      );
      const { error: statusError } = await supabase
        .from("policies")
        .update({ status_id: changesRequiredStatus?.id || null })
        .eq("id", policyId);

      if (statusError) {
        console.error("Error updating status:", statusError);
        setError("Failed to request changes");
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
      console.error("Error requesting changes:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!policyId) return;

    setError(null);
    setLoading(true);

    try {
      // Check if user is authenticated
      if (!auth.userData?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Update status to "waiting-approval" and set reviewed_by and reviewed_at
      const waitingApprovalStatus = documentLifecycleStatuses.find(
        (s) => s.name === "waiting-approval"
      );
      const { error: statusError } = await supabase
        .from("policies")
        .update({
          status_id: waitingApprovalStatus?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", policyId);

      if (statusError) {
        console.error("Error updating status:", statusError);
        setError("Failed to submit for approval");
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
      console.error("Error submitting for approval:", err);
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
      // Check if user is authenticated
      if (!auth.userData?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Update status to "approved" and set approved_by and approved_at
      const approvedStatus = documentLifecycleStatuses.find(
        (s) => s.name === "approved"
      );
      const { error: statusError } = await supabase
        .from("policies")
        .update({
          status_id: approvedStatus?.id || null,
          approved_at: new Date().toISOString(),
        })
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
      const changesRequiredStatus = documentLifecycleStatuses.find(
        (s) => s.name === "changes-required"
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
      maxWidth=" "
      className="flex flex-col !w-[80vw] h-[90vh] max-w-full "
    >
      <div className="flex justify-between items-center mb-3">
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
      <EditModalButtons
        actionButtons={config.actionButtons}
        loading={loading}
        loadingData={loadingData}
        onClose={onClose}
        onSave={handleSave}
        onSubmitForReview={handleSubmitForReview}
        onRequestChanges={handleRequestChanges}
        onSubmitForApproval={handleSubmitForApproval}
        onApprove={handleApprove}
        onReject={handleReject}
        saveLabel={config.actionButtons.save?.label}
      />
    </ModalWrapper>
  );
}
