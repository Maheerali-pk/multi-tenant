import { UserRole } from "./user.types";

export interface InviteFromSuperAdminRequest {
	email: string;
	full_name: string;
	title?: string;
	tenant_id?: string;
	role: UserRole;
}