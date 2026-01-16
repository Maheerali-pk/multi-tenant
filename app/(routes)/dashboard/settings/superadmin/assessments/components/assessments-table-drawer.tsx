"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AssessmentRow } from "./assessments-table";
import { capitalizeString } from "@/app/helpers/utils";

interface AssessmentsTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentRow | null;
}

const AssessmentsTableDrawer: React.FC<AssessmentsTableDrawerProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  // Keep drawer mounted during closing animation
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle mounting and visibility
  useEffect(() => {
    if (assessment && isOpen) {
      setShouldRender(true);
      // Small delay to ensure initial closed state is rendered before opening
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setIsVisible(false);
      // Delay unmounting to allow closing animation
      if (!assessment) {
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [assessment, isOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Don't render if not needed
  if (!shouldRender || !assessment) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[6px] transition-opacity duration-300 ease-in-out ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-bg-inner border-l border-border-hr shadow-2xl transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-hr">
            <h2 className="text-xl font-semibold text-text-primary">
              Assessment Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 cursor-pointer rounded-lg hover:bg-sidebar-sub-item-hover transition-colors text-text-secondary hover:text-text-primary"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Name
                </h3>
                <p className="text-base text-text-secondary">{assessment.name}</p>
              </div>

              {/* Version */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Version
                </h3>
                <p className="text-base text-text-secondary">
                  {assessment.version}
                </p>
              </div>

              {/* Status */}
              {assessment.status_name && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Status
                  </h3>
                  <span
                    className="px-2 py-1 text-xs rounded-full font-medium inline-flex items-center gap-1"
                    style={{
                      backgroundColor:
                        assessment.status_name.toLowerCase() === "draft"
                          ? "rgba(100, 116, 139, 0.15)"
                          : assessment.status_name.toLowerCase() === "published"
                          ? "rgba(16, 185, 129, 0.15)"
                          : assessment.status_name.toLowerCase() === "retired"
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(100, 116, 139, 0.15)",
                      color:
                        assessment.status_name.toLowerCase() === "draft"
                          ? "#475569"
                          : assessment.status_name.toLowerCase() === "published"
                          ? "#059669"
                          : assessment.status_name.toLowerCase() === "retired"
                          ? "#dc2626"
                          : "#475569",
                    }}
                  >
                    {capitalizeString(assessment.status_name)}
                  </span>
                </div>
              )}

              {/* Tenant */}
              {assessment.tenant_name && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Tenant
                  </h3>
                  <p className="text-base text-text-secondary">
                    {assessment.tenant_name}
                  </p>
                </div>
              )}

              {/* Created By */}
              {assessment.created_by_name && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Created By
                  </h3>
                  <p className="text-base text-text-secondary">
                    {assessment.created_by_name}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Description
                </h3>
                <p className="text-base text-text-secondary whitespace-pre-wrap">
                  {assessment.description || (
                    <span className="text-text-secondary italic">
                      No description provided
                    </span>
                  )}
                </p>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Notes
                </h3>
                <p className="text-base text-text-secondary whitespace-pre-wrap">
                  {assessment.notes || (
                    <span className="text-text-secondary italic">
                      No notes provided
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssessmentsTableDrawer;
