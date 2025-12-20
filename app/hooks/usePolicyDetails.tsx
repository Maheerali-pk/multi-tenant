"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import type { Tables } from "@/app/types/database.types";

type Team = Tables<"teams">;
type User = Tables<"users">;
type Policy = Tables<"policies">;
type DocumentLifecycleStatus = Tables<"document_lifecycle_statuses">;
type DocumentType = Tables<"document_types">;
type AssetClassification = Tables<"asset_classifications">;

export interface PolicyFormData {
  title: string;
  owner: string;
  reviewer: string;
  documentType: string;
  status: string;
  classification: string;
  version: string;
  createdBy: string;
  createdOn: string;
  reviewedBy: string;
  reviewedOn: string;
  approvedBy: string;
  approvedOn: string;
  effectiveDate: string;
  nextReviewDate: string;
  purpose: string;
  scope: string;
  requirements: string;
}

export interface PolicyComment {
  id: string;
  text: string;
  user_id: string;
  user_name: string;
  created_at: string;
  isNew?: boolean;
}

interface UsePolicyDetailsReturn {
  // Data
  teams: Team[];
  users: User[];
  classifications: AssetClassification[];
  documentLifecycleStatuses: DocumentLifecycleStatus[];
  documentTypes: DocumentType[];
  initialFormData: PolicyFormData | null;
  comments: PolicyComment[];
  // State
  loadingData: boolean;
  error: string | null;
  // Helpers
  policyTypeId: string | null;
}

export const usePolicyDetails = (
  policyId: string | null,
  isOpen: boolean
): UsePolicyDetailsReturn => {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();

  // Data states
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [classifications, setClassifications] = useState<AssetClassification[]>(
    []
  );
  const [documentLifecycleStatuses, setDocumentLifecycleStatuses] = useState<
    DocumentLifecycleStatus[]
  >([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [initialFormData, setInitialFormData] = useState<PolicyFormData | null>(
    null
  );
  const [comments, setComments] = useState<PolicyComment[]>([]);

  // UI states
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: Get policy type ID
  const policyTypeId =
    documentTypes
      .find((type) => type.name.toLowerCase() === "policy")
      ?.id.toString() || null;

  // Fetch all dropdown data
  const fetchAllData = useCallback(async () => {
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
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  }, [auth.userData?.role, auth.userData?.tenant_id, state.selectedTenantId]);

  // Fetch policy data
  const fetchPolicyData = useCallback(async () => {
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

      // Populate form data
      const formData: PolicyFormData = {
        title: policy.title || "",
        owner: ownerValue,
        reviewer: reviewerValue,
        documentType: "", // Will be set when documentTypes are loaded
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
      };

      setInitialFormData(formData);
    } catch (err) {
      console.error("Error fetching policy data:", err);
      setError("Failed to load policy data");
    } finally {
      setLoadingData(false);
    }
  }, [policyId]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
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
        const transformedComments: PolicyComment[] = commentsData.map(
          (comment) => ({
            id: `db-${comment.policy_id}-${comment.created_at}`,
            text: comment.text,
            user_id: comment.user_id,
            user_name: userMap.get(comment.user_id) || "Unknown User",
            created_at: comment.created_at,
            isNew: false,
          })
        );

        setComments(transformedComments);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [policyId]);

  // Fetch all data when modal opens
  useEffect(() => {
    if (isOpen && policyId) {
      fetchAllData();
      fetchPolicyData();
      fetchComments();
    }
  }, [isOpen, policyId, fetchAllData, fetchPolicyData, fetchComments]);

  // Reset data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTeams([]);
      setUsers([]);
      setClassifications([]);
      setDocumentLifecycleStatuses([]);
      setDocumentTypes([]);
      setInitialFormData(null);
      setComments([]);
      setError(null);
      setLoadingData(true);
    }
  }, [isOpen]);

  return {
    teams,
    users,
    classifications,
    documentLifecycleStatuses,
    documentTypes,
    initialFormData,
    comments,
    loadingData,
    error,
    policyTypeId,
  };
};
