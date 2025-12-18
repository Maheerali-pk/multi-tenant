"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModalWrapper from "@/app/components/ModalWrapper";
import Tabs, { Tab } from "@/app/components/Tabs";
import { CustomSelect, SelectOption } from "@/app/components/CustomSelect";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import type { Tables, TablesUpdate } from "@/app/types/database.types";
import PolicyComment from "@/app/components/PolicyComment";
import RichTextEditor from "@/app/components/RichTextEditor";

type Team = Tables<"teams">;
type User = Tables<"users">;
type Policy = Tables<"policies">;
type DocumentLifecycleStatus = Tables<"document_lifecycle_statuses">;
type DocumentType = Tables<"document_types">;
type AssetClassification = Tables<"asset_classifications">;

interface PolicyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  policyId: string | null;
}

export default function PolicyEditModal({
  isOpen,
  onClose,
  onSuccess,
  policyId,
}: PolicyEditModalProps) {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [activeTab, setActiveTab] = useState<string>("tab1");
  const [formData, setFormData] = useState({
    title: "",
    owner: "",
    reviewer: "",
    documentType: "Policy",
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [classifications, setClassifications] = useState<AssetClassification[]>(
    []
  );
  const [documentLifecycleStatuses, setDocumentLifecycleStatuses] = useState<
    DocumentLifecycleStatus[]
  >([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<
    Array<{
      id: string;
      text: string;
      user_id: string;
      user_name: string;
      created_at: string;
      isNew?: boolean; // Track if comment is new (not saved to DB yet)
    }>
  >([]);
  const [newComment, setNewComment] = useState("");

  const tabs: Tab[] = [
    { id: "tab1", label: "Policy Document" },
    { id: "tab2", label: "Content" },
    { id: "tab3", label: "Comments" },
  ];

  // Fetch policy data and all dropdown data when modal opens
  useEffect(() => {
    if (isOpen && policyId) {
      fetchAllData();
      fetchPolicyData();
      fetchComments();
    }
  }, [isOpen, policyId]);

  // Set document type to "Policy" whenever document types are loaded
  useEffect(() => {
    if (documentTypes.length > 0) {
      const policyType = documentTypes.find(
        (type) => type.name.toLowerCase() === "policy"
      );
      if (policyType) {
        setFormData((prev) => ({
          ...prev,
          documentType: policyType.id.toString(),
        }));
      }
    }
  }, [documentTypes]);

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

  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      setError(null);

      const isSuperAdmin = auth.userData?.role === "superadmin";
      const tenantId = isSuperAdmin
        ? state.selectedTenantId
        : auth.userData?.tenant_id;

      if (!tenantId) {
        setError(
          isSuperAdmin ? "Please select a tenant" : "User tenant not found"
        );
        setLoadingData(false);
        return;
      }

      // Fetch all dropdown data in parallel
      const [
        teamsResult,
        usersResult,
        classificationsResult,
        documentLifecycleStatusesResult,
        documentTypesResult,
      ] = await Promise.all([
        supabase
          .from("teams")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("name"),
        supabase
          .from("users")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("name"),
        supabase.from("asset_classifications").select("*").order("name"),
        supabase.from("document_lifecycle_statuses").select("*").order("name"),
        supabase.from("document_types").select("*").order("name"),
      ]);

      if (teamsResult.error) {
        console.error("Error fetching teams:", teamsResult.error);
      }
      if (usersResult.error) {
        console.error("Error fetching users:", usersResult.error);
      }
      if (classificationsResult.error) {
        console.error(
          "Error fetching classifications:",
          classificationsResult.error
        );
      }
      if (documentLifecycleStatusesResult.error) {
        console.error(
          "Error fetching document lifecycle statuses:",
          documentLifecycleStatusesResult.error
        );
      }
      if (documentTypesResult.error) {
        console.error(
          "Error fetching document types:",
          documentTypesResult.error
        );
      }

      setTeams(teamsResult.data || []);
      setUsers(usersResult.data || []);
      setClassifications(classificationsResult.data || []);
      setDocumentLifecycleStatuses(documentLifecycleStatusesResult.data || []);
      setDocumentTypes(documentTypesResult.data || []);

      // Set document type to "Policy" if available
      if (documentTypesResult.data && documentTypesResult.data.length > 0) {
        const policyType = documentTypesResult.data.find(
          (type) => type.name.toLowerCase() === "policy"
        );
        if (policyType) {
          setFormData((prev) => ({
            ...prev,
            documentType: policyType.id.toString(),
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPolicyData = async () => {
    if (!policyId) return;

    try {
      setLoadingData(true);
      setError(null);

      // Fetch policy data
      const { data: policy, error: policyError } = await supabase
        .from("policies")
        .select("*")
        .eq("id", policyId)
        .single();

      if (policyError) {
        console.error("Error fetching policy:", policyError);
        setError("Failed to load policy data");
        setLoadingData(false);
        return;
      }

      if (!policy) {
        setError("Policy not found");
        setLoadingData(false);
        return;
      }

      // Fetch creator name
      let creatorName = "";
      if (policy.created_by) {
        const { data: creator } = await supabase
          .from("users")
          .select("name")
          .eq("id", policy.created_by)
          .single();
        creatorName = creator?.name || "";
      }

      // Determine owner value
      let ownerValue = "";
      if (policy.policy_owner_team_id) {
        ownerValue = `team:${policy.policy_owner_team_id}`;
      } else if (policy.policy_owner_user_id) {
        ownerValue = `user:${policy.policy_owner_user_id}`;
      }

      // Determine reviewer value
      let reviewerValue = "";
      if (policy.reviewer_team_id) {
        reviewerValue = `team:${policy.reviewer_team_id}`;
      } else if (policy.reviewer_user_id) {
        reviewerValue = `user:${policy.reviewer_user_id}`;
      }

      // Format dates
      const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        try {
          return new Date(dateString).toLocaleDateString();
        } catch {
          return dateString;
        }
      };

      const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        } catch {
          return "";
        }
      };

      // Populate form data using new table structure
      // Note: documentType will be set to "Policy" by useEffect when documentTypes are loaded
      setFormData({
        title: policy.title || "",
        owner: ownerValue,
        reviewer: reviewerValue,
        documentType: "", // Will be set to "Policy" by useEffect
        status: policy.status_id?.toString() || "",
        classification: policy.classification_id?.toString() || "",
        version: policy.version || "",
        createdBy: creatorName,
        createdOn: formatDate(policy.created_at),
        reviewedBy: "",
        reviewedOn: formatDate(policy.reviewed_at),
        approvedBy: "",
        approvedOn: formatDate(policy.approved_at),
        effectiveDate: formatDateForInput(policy.effective_date),
        nextReviewDate: formatDateForInput(policy.next_review_date),
        purpose: policy.objective || "",
        scope: policy.scope || "",
        requirements:
          typeof policy.requirements === "string"
            ? policy.requirements
            : JSON.stringify(policy.requirements) || "",
      });
    } catch (err) {
      console.error("Error fetching policy data:", err);
      setError("Failed to load policy data");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchComments = async () => {
    if (!policyId) return;

    try {
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("policy_comments")
        .select("*")
        .eq("policy_id", policyId)
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        return;
      }

      if (commentsData && commentsData.length > 0) {
        // Get unique user IDs
        const userIds = [
          ...new Set(
            commentsData
              .map((comment) => comment.user_id)
              .filter((id): id is string => id !== null)
          ),
        ];

        // Fetch user names
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name")
          .in("id", userIds);

        // Create user map
        const userMap = new Map(
          (usersData || []).map((user) => [user.id, user.name])
        );

        // Transform comments to match our structure
        const transformedComments = commentsData.map((comment) => ({
          id: `db-${comment.policy_id}-${comment.created_at}`,
          text: comment.text,
          user_id: comment.user_id,
          user_name: userMap.get(comment.user_id) || "Unknown User",
          created_at: comment.created_at,
          isNew: false,
        }));

        setComments(transformedComments);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
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
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
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
                  isDisabled={loadingData}
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
                  isDisabled={loadingData}
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
                  isDisabled={true}
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
                  isDisabled={false}
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
                  isDisabled={loadingData}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="version"
                  className="text-sm font-medium text-text-primary"
                >
                  Version
                </label>
                <input
                  type="text"
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
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
                <input
                  type="text"
                  id="createdBy"
                  name="createdBy"
                  value={formData.createdBy}
                  disabled
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none opacity-50 cursor-not-allowed"
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
                <input
                  type="text"
                  id="createdOn"
                  name="createdOn"
                  value={formData.createdOn}
                  disabled
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none opacity-50 cursor-not-allowed"
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
                <input
                  type="text"
                  id="reviewedBy"
                  name="reviewedBy"
                  value={formData.reviewedBy}
                  disabled
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none opacity-50 cursor-not-allowed"
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
                <input
                  type="text"
                  id="reviewedOn"
                  name="reviewedOn"
                  value={formData.reviewedOn}
                  disabled
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none opacity-50 cursor-not-allowed"
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
                <input
                  type="text"
                  id="approvedBy"
                  name="approvedBy"
                  value={formData.approvedBy}
                  disabled
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none opacity-50 cursor-not-allowed"
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
                <input
                  type="text"
                  id="approvedOn"
                  name="approvedOn"
                  value={formData.approvedOn}
                  disabled
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none opacity-50 cursor-not-allowed"
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
                <input
                  type="text"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  disabled
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none opacity-50 cursor-not-allowed"
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
                <input
                  type="date"
                  id="nextReviewDate"
                  name="nextReviewDate"
                  value={formData.nextReviewDate}
                  onChange={handleChange}
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
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
              <input
                type="text"
                id="title-tab2"
                name="title-tab2"
                value={formData.title}
                disabled
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none opacity-50 cursor-not-allowed"
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
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
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
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
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
              />
            </div>
          </div>
        );
      case "tab3":
        return (
          <div className="py-4 space-y-6">
            {/* Comments List */}
            <div className="space-y-4">
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
              <button
                type="button"
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
                className="self-start px-4 py-2 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Add Comment
              </button>
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

  const handleSubmitForReview = () => {
    // Submit for review logic - to be implemented
    console.log("Submit for review clicked", formData);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      className="flex flex-col "
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">Edit Policy</h2>
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
      <div className="mt-6 overflow-y-auto">
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
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || loadingData}
          className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={handleSubmitForReview}
          disabled={loading || loadingData}
          className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Submit for Review
        </button>
      </div>
    </ModalWrapper>
  );
}
