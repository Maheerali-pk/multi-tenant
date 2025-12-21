export type PolicyModalStatus = "draft" | "under-review" | "changes-required" | "waiting-approval" | "approved";

// Document lifecycle status names as stored in the database
export type DocumentLifecycleStatusName =
  | "draft"
  | "under-review"
  | "changes-required"
  | "approved"
  | "published"
  | "retired"
  | "waiting-approval";

// User role for a policy
export type PolicyUserRole = "creator" | "reviewer" | "approver" | "owner" | "none";