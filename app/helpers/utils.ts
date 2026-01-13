import { UserRole } from "../types/user.types";

export const formatUserRole = (role: UserRole | ""): string => {
	switch (role) {
		case "superadmin":
			return "Super Admin";
		case "tenant_admin":
			return "Tenant Admin";
		case "tenant_user":
			return "Tenant User";
		case "tenant_employee":
			return "Tenant Employee";
		default:
			return role;
	}
};
export const capitalizeString = (string: string): string => {
	return string.charAt(0).toUpperCase() + string.slice(1);
};