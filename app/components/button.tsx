"use client";

import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  children,
  ...props
}) => {
  // Base classes that apply to all buttons
  const baseClasses =
    "rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  // Size classes
  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs",
    md: "py-2.5 px-4 text-sm",
    lg: "py-3 px-5 text-base",
  };

  // Variant classes
  const variantClasses = {
    primary: "bg-brand text-text-contrast hover:opacity-90 focus:ring-brand",
    secondary:
      "border border-border-hr bg-bg-outer text-text-primary hover:bg-sidebar-sub-item-hover focus:ring-brand",
    success:
      "bg-success text-text-contrast hover:opacity-90 focus:ring-success",
    danger: "bg-failure text-text-contrast hover:opacity-90 focus:ring-brand",
    warning:
      "bg-[var(--status-inactive-text)] text-text-contrast hover:opacity-90 focus:ring-[var(--status-inactive-text)]",
  };

  const combinedClasses =
    `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim();

  return (
    <button {...props} disabled={disabled} className={combinedClasses}>
      {children}
    </button>
  );
};

export default Button;
