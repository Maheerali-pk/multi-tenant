"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AssessmentItemRow } from "./assessment-items-table";
import {
  renderCheckMethodBadge,
  renderBooleanBadge,
  renderImportanceBadge,
} from "@/app/utils/statusBadge";

interface AssessmentItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: AssessmentItemRow | null;
}

const AssessmentItemDrawer: React.FC<AssessmentItemDrawerProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  // Keep drawer mounted during closing animation
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle mounting and visibility
  useEffect(() => {
    if (item && isOpen) {
      setShouldRender(true);
      // Small delay to ensure initial closed state is rendered before opening
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setIsVisible(false);
      // Delay unmounting to allow closing animation
      if (!item) {
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [item, isOpen]);

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
  if (!shouldRender || !item) return null;

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
              Assessment Item Details
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
              {/* Title */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Title
                </h3>
                <p className="text-base text-text-secondary">{item.title}</p>
              </div>

              {/* Category */}
              {item.category && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Category
                  </h3>
                  <p className="text-base text-text-secondary">
                    {item.category}
                  </p>
                </div>
              )}

              {/* What to Check */}
              {item.what_to_check && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    What to Check
                  </h3>
                  <p className="text-base text-text-secondary whitespace-pre-wrap">
                    {item.what_to_check}
                  </p>
                </div>
              )}

              {/* How to Check */}
              {item.how_to_check && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    How to Check
                  </h3>
                  <p className="text-base text-text-secondary whitespace-pre-wrap">
                    {item.how_to_check}
                  </p>
                </div>
              )}

              {/* Check Method */}
              {item.check_method && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Check Method
                  </h3>
                  <div>{renderCheckMethodBadge(item.check_method, "sm")}</div>
                </div>
              )}

              {/* Evidence Hint */}
              {item.evidence_hint && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Evidence Hint
                  </h3>
                  <p className="text-base text-text-secondary whitespace-pre-wrap">
                    {item.evidence_hint}
                  </p>
                </div>
              )}

              {/* How It Helps */}
              {item.how_it_helps && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    How It Helps
                  </h3>
                  <p className="text-base text-text-secondary whitespace-pre-wrap">
                    {item.how_it_helps}
                  </p>
                </div>
              )}

              {/* Importance */}
              {item.importance && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Importance
                  </h3>
                  <div>{renderImportanceBadge(item.importance, "sm")}</div>
                </div>
              )}

              {/* Required and Active - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Required
                  </h3>
                  <div>
                    {renderBooleanBadge(item.required, "sm", "success-danger")}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Active
                  </h3>
                  <div>
                    {renderBooleanBadge(item.is_active, "sm", "success-danger")}
                  </div>
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Sort Order
                </h3>
                <p className="text-base text-text-secondary">
                  {item.sort_order}
                </p>
              </div>

              {/* Integration Key */}
              {item.integration_key && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Integration Key
                  </h3>
                  <p className="text-base text-text-secondary">
                    {item.integration_key}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Notes
                </h3>
                <p className="text-base text-text-secondary whitespace-pre-wrap">
                  {item.notes || (
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

export default AssessmentItemDrawer;
