"use client";

import { ReactNode } from "react";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | string;
  className?: string;
}

const maxWidthClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
};

export default function ModalWrapper({
  isOpen,
  onClose,
  children,
  maxWidth = "md",
  className = "",
}: ModalWrapperProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[6px] transition-opacity `}
    >
      <div
        className={`bg-bg-inner rounded-3xl p-6 shadow-2xl w-full ${
          maxWidthClasses[maxWidth] || maxWidth
        } max-h-[90vh] overflow-y-auto border border-border-hr transform transition-all ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
