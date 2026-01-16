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

// Helper function to get check method badge styles
export const getCheckMethodBadgeStyles = (
  checkMethod: string | null
): React.CSSProperties => {
  if (!checkMethod) {
    return {
      backgroundColor: "rgba(100, 116, 139, 0.15)",
      color: "#475569",
    };
  }

  const method = checkMethod.toLowerCase();
  switch (method) {
    case "manual":
      return {
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        color: "#2563eb",
      };
    case "attestation":
      return {
        backgroundColor: "rgba(168, 85, 247, 0.15)",
        color: "#9333ea",
      };
    case "automated":
      return {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#059669",
      };
    default:
      return {
        backgroundColor: "rgba(100, 116, 139, 0.15)",
        color: "#475569",
      };
  }
};

// Helper function to format check method for display
export const formatCheckMethodForDisplay = (
  checkMethod: string | null
): string => {
  if (!checkMethod) return "-";
  return checkMethod.charAt(0).toUpperCase() + checkMethod.slice(1);
};

// Helper function to render check method badge
export const renderCheckMethodBadge = (
  checkMethod: string | null,
  size: "sm" | "md" | "lg" = "sm"
) => {
  if (!checkMethod) return "-";

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-full font-medium inline-flex items-center gap-1`}
      style={getCheckMethodBadgeStyles(checkMethod)}
    >
      {formatCheckMethodForDisplay(checkMethod)}
    </span>
  );
};

// Helper function to get boolean badge styles (for required/active)
export const getBooleanBadgeStyles = (
  value: boolean | null | undefined,
  type: "success-danger" | "success-gray" = "success-danger"
): React.CSSProperties => {
  if (value === null || value === undefined) {
    return {
      backgroundColor: "rgba(100, 116, 139, 0.15)",
      color: "#475569",
    };
  }

  if (value) {
    // Success (green)
    return {
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      color: "#059669",
    };
  } else {
    // Danger (red) or Gray based on type
    if (type === "success-danger") {
      return {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        color: "#dc2626",
      };
    } else {
      return {
        backgroundColor: "rgba(100, 116, 139, 0.15)",
        color: "#475569",
      };
    }
  }
};

// Helper function to render boolean badge (for required/active)
export const renderBooleanBadge = (
  value: boolean | null | undefined,
  size: "sm" | "md" | "lg" = "sm",
  type: "success-danger" | "success-gray" = "success-danger"
) => {
  if (value === null || value === undefined) return "-";

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-full font-medium inline-flex items-center gap-1`}
      style={getBooleanBadgeStyles(value, type)}
    >
      {value ? "Yes" : "No"}
    </span>
  );
};

// Helper function to get importance badge styles
export const getImportanceBadgeStyles = (
  importance: string | null
): React.CSSProperties => {
  if (!importance) {
    return {
      backgroundColor: "rgba(100, 116, 139, 0.15)",
      color: "#475569",
    };
  }

  const importanceLower = importance.toLowerCase();
  switch (importanceLower) {
    case "low":
      return {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#059669",
      };
    case "medium":
      return {
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        color: "#d97706",
      };
    case "high":
      return {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        color: "#dc2626",
      };
    default:
      return {
        backgroundColor: "rgba(100, 116, 139, 0.15)",
        color: "#475569",
      };
  }
};

// Helper function to format importance for display
export const formatImportanceForDisplay = (
  importance: string | null
): string => {
  if (!importance) return "-";
  return importance.charAt(0).toUpperCase() + importance.slice(1);
};

// Helper function to render importance badge
export const renderImportanceBadge = (
  importance: string | null,
  size: "sm" | "md" | "lg" = "sm"
) => {
  if (!importance) return "-";

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-full font-medium inline-flex items-center gap-1`}
      style={getImportanceBadgeStyles(importance)}
    >
      {formatImportanceForDisplay(importance)}
    </span>
  );
};
