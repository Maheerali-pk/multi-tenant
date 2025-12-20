"use client";

import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  className = "",
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary";

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "";

  const combinedClasses = `${baseClasses} ${disabledClasses} ${className}`.trim();

  return (
    <input
      {...props}
      disabled={disabled}
      className={combinedClasses}
    />
  );
};

export default Input;

