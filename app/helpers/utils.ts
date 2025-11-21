import { UserRole } from "../types/user.types";

export const formatUserRole = (role: UserRole | ""): string => {
	switch (role) {
		case "super_admin":
			return "Super Admin";
		case "tenant_admin":
			return "Tenant Admin";
		case "tenant_user":
			return "Tenant User";
		default:
			return role;
	}
};