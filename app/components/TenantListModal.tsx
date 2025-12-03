"use client";

import { X } from "lucide-react";

interface TenantListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: string[];
}

export default function TenantListModal({
  isOpen,
  onClose,
  tenants,
}: TenantListModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[6px] transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-bg-inner rounded-3xl p-6 shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-border-hr transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text-dark">
            All Tenants ({tenants.length})
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
          {tenants.length === 0 ? (
            <div className="text-text-secondary text-center py-4">
              No tenants found
            </div>
          ) : (
            tenants.map((tenant, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-sidebar-sub-item-hover text-text-primary"
              >
                {tenant}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
