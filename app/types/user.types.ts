import { User } from "@supabase/supabase-js";
import { Tables } from "./database.types";

export type UserRole = "superadmin" | "tenant_admin" | "tenant_user";


export interface AuthUser {
	data: User | null;
	name: string;
}

export type UserData = Tables<"users"> | null;