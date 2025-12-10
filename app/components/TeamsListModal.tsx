"use client";

import { X } from "lucide-react";
import ModalWrapper from "./ModalWrapper";

interface TeamsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: string[];
}

export default function TeamsListModal({
  isOpen,
  onClose,
  teams,
}: TeamsListModalProps) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-text-dark">
          All Teams ({teams.length})
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} className="text-text-secondary" />
        </button>
      </div>

      <div className="space-y-2">
        {teams.length === 0 ? (
          <div className="text-text-secondary text-center py-4">
            No teams found
          </div>
        ) : (
          teams.map((team, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-sidebar-sub-item-hover text-text-primary"
            >
              {team}
            </div>
          ))
        )}
      </div>
    </ModalWrapper>
  );
}
