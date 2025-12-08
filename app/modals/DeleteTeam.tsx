"use client";

import { X, AlertTriangle } from "lucide-react";
import type { TeamRow } from "@/app/components/TeamsTable";
import ModalWrapper from "@/app/components/ModalWrapper";

interface DeleteTeamProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  team: TeamRow | null;
  loading?: boolean;
}

export default function DeleteTeam({
  isOpen,
  onClose,
  onConfirm,
  team,
  loading = false,
}: DeleteTeamProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-failure-light">
            <AlertTriangle size={24} className="text-failure" />
          </div>
          <h2 className="text-xl font-semibold text-text-dark">
            Delete Team
          </h2>
        </div>
        <button
          onClick={onClose}
          disabled={loading}
          className="p-2 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X size={20} className="text-text-secondary" />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-sm text-text-secondary mb-2">
          Are you sure you want to delete this team? This action cannot be
          undone.
        </p>
        {team && (
          <div className="p-3 rounded-lg bg-sidebar-sub-item-hover border border-table-border">
            <p className="text-sm font-medium text-text-primary">
              {team.name}
            </p>
            {team.email && (
              <p className="text-xs text-text-secondary mt-1">
                Email: {team.email}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 py-2.5 px-4 rounded-lg bg-failure text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-failure focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </ModalWrapper>
  );
}

