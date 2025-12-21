import React from "react";

// Helper function to format status name to display format
// e.g., "under-review" -> "User Review", "changes-required" -> "Changes Required"
export const formatStatusForDisplay = (status: string | null): string => {
  if (!status) return "-";

  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to get status badge styles
export const getStatusBadgeStyles = (
  status: string | null
): React.CSSProperties => {
  if (!status) {
    return {
      backgroundColor: "rgba(100, 116, 139, 0.15)",
      color: "#475569",
    };
  }

  // Use exact database status names
  switch (status) {
    case "draft":
      return {
        backgroundColor: "rgba(100, 116, 139, 0.15)",
        color: "#475569",
      };
    case "under-review":
      return {
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        color: "#2563eb",
      };
    case "changes-required":
      return {
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        color: "#d97706",
      };
    case "waiting-approval":
      return {
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        color: "#2563eb",
      };
    case "approved":
      return {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#059669",
      };
    case "published":
      return {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#059669",
      };
    case "retired":
      return {
        backgroundColor: "rgba(100, 116, 139, 0.15)",
        color: "#475569",
      };
    default:
      return {
        backgroundColor: "rgba(100, 116, 139, 0.15)",
        color: "#475569",
      };
  }
};

// Helper function to render status badge
export const renderStatusBadge = (
  status: string | null,
  size: "sm" | "md" | "lg" = "sm"
) => {
  if (!status) return "-";

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-full font-medium inline-flex items-center gap-1`}
      style={getStatusBadgeStyles(status)}
    >
      {formatStatusForDisplay(status)}
    </span>
  );
};
