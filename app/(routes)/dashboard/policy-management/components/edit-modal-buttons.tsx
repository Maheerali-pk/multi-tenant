"use client";

import Button from "@/app/components/Button";
import type { PolicyActionButtons } from "./PolicyEditModal";

interface EditModalButtonsProps {
  actionButtons: PolicyActionButtons;
  loading: boolean;
  loadingData: boolean;
  onClose: () => void;
  onSave: () => void;
  onSubmitForReview: () => void;
  onRequestChanges: () => void;
  onSubmitForApproval: () => void;
  onApprove: () => void;
  onReject: () => void;
  saveLabel?: string;
}

export default function EditModalButtons({
  actionButtons,
  loading,
  loadingData,
  onClose,
  onSave,
  onSubmitForReview,
  onRequestChanges,
  onSubmitForApproval,
  onApprove,
  onReject,
  saveLabel,
}: EditModalButtonsProps) {
  return (
    <div className="flex gap-3 pt-6 mt-6 border-t border-border-hr">
      {actionButtons.cancel?.show && (
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          {actionButtons.cancel.label}
        </Button>
      )}
      {actionButtons.save?.show && (
        <Button
          type="button"
          variant="primary"
          onClick={onSave}
          disabled={loading || loadingData}
          className="flex-1"
        >
          {loading ? "Saving..." : saveLabel || actionButtons.save.label}
        </Button>
      )}
      {actionButtons.submitForReview?.show && (
        <Button
          type="button"
          variant="success"
          onClick={onSubmitForReview}
          disabled={loading || loadingData}
          className="flex-1"
        >
          {actionButtons.submitForReview.label}
        </Button>
      )}
      {actionButtons.requestChanges?.show && (
        <Button
          type="button"
          variant="primary"
          onClick={onRequestChanges}
          disabled={loading || loadingData}
          className="flex-1"
        >
          {actionButtons.requestChanges.label}
        </Button>
      )}
      {actionButtons.submitForApproval?.show && (
        <Button
          type="button"
          variant="success"
          onClick={onSubmitForApproval}
          disabled={loading || loadingData}
          className="flex-1"
        >
          {actionButtons.submitForApproval.label}
        </Button>
      )}
      {actionButtons.approve?.show && (
        <Button
          type="button"
          variant="success"
          onClick={onApprove}
          disabled={loading || loadingData}
          className="flex-1"
        >
          {actionButtons.approve.label}
        </Button>
      )}
      {actionButtons.reject?.show && (
        <Button
          type="button"
          variant="danger"
          onClick={onReject}
          disabled={loading || loadingData}
          className="flex-1"
        >
          {actionButtons.reject.label}
        </Button>
      )}
    </div>
  );
}
