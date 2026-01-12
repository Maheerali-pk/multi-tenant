"use client";

import { X, Mail, AlertCircle } from "lucide-react";
import type { UserRow } from "@/app/components/UsersTable";
import ModalWrapper from "@/app/components/ModalWrapper";
import {
  getInvitationStatus,
  isInvitationExpired,
} from "@/app/helpers/invitationStatus";

interface InviteUserProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: UserRow | null;
  loading?: boolean;
}

export default function InviteUser({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading = false,
}: InviteUserProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const invitationStatus = user ? getInvitationStatus(user.invitation) : "none";
  const isExpired =
    user?.invitation && isInvitationExpired(user.invitation.invited_at);
  const isPending = invitationStatus === "pending";

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isExpired ? "bg-failure-light" : "bg-brand/10"
            }`}
          >
            {isExpired ? (
              <AlertCircle size={24} className="text-failure" />
            ) : (
              <Mail size={24} className="text-brand" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-text-dark">
            {isExpired
              ? "Invitation Expired"
              : isPending
              ? "Invitation Pending"
              : "Send Invitation"}
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
        {isExpired ? (
          <div className="mb-4">
            <p className="text-sm text-failure mb-2 font-medium">
              This invitation has expired. You can resend the invitation to the
              user.
            </p>
          </div>
        ) : isPending ? (
          <div className="mb-4">
            <p className="text-sm text-text-secondary mb-2">
              An invitation has already been sent to this user and is still
              pending. You can resend the invitation if needed.
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-secondary mb-2">
            Are you sure you want to send an invitation email to this user? They
            will receive an email with instructions to set up their account.
          </p>
        )}
        {user && (
          <div className="p-3 rounded-lg bg-sidebar-sub-item-hover border border-table-border">
            <p className="text-sm font-medium text-text-primary">{user.name}</p>
            {user.email && (
              <p className="text-xs text-text-secondary mt-1">
                Email: {user.email}
              </p>
            )}
            {user.role && (
              <p className="text-xs text-text-secondary mt-1">
                Role:{" "}
                {user.role
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </p>
            )}
            {user.invitation && (
              <p className="text-xs text-text-secondary mt-1">
                Invited: {new Date(user.invitation.invited_at).toLocaleString()}
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
          className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading
            ? "Sending..."
            : isExpired || isPending
            ? "Resend Invitation"
            : "Send Invitation"}
        </button>
      </div>
    </ModalWrapper>
  );
}
