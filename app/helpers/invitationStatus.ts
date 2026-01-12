/**
 * Helper functions for checking invitation status
 */

export type InvitationStatus = "pending" | "expired" | "accepted" | "none";

export interface InvitationData {
  email: string;
  invited_at: string;
  accepted_at: string | null;
}

/**
 * Check if an invitation is expired (24 hours have passed)
 */
export function isInvitationExpired(invitedAt: string): boolean {
  const invitedTime = new Date(invitedAt).getTime();
  const now = new Date().getTime();
  const hoursDiff = (now - invitedTime) / (1000 * 60 * 60);
  return hoursDiff >= 24;
}

/**
 * Get invitation status for a user
 */
export function getInvitationStatus(
  invitation: InvitationData | null | undefined
): InvitationStatus {
  if (!invitation) {
    return "none";
  }

  if (invitation.accepted_at) {
    return "accepted";
  }

  if (isInvitationExpired(invitation.invited_at)) {
    return "expired";
  }

  return "pending";
}
