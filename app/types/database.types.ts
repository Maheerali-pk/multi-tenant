
export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "13.0.5"
	}
	public: {
		Tables: {
			asset_categories: {
				Row: {
					created_at: string
					id: number
					name: string
				}
				Insert: {
					created_at?: string
					id?: number
					name: string
				}
				Update: {
					created_at?: string
					id?: number
					name?: string
				}
				Relationships: []
			}
			asset_classifications: {
				Row: {
					created_at: string
					id: number
					name: string
				}
				Insert: {
					created_at?: string
					id?: number
					name: string
				}
				Update: {
					created_at?: string
					id?: number
					name?: string
				}
				Relationships: []
			}
			asset_exposures: {
				Row: {
					created_at: string
					id: number
					name: string
				}
				Insert: {
					created_at?: string
					id?: number
					name: string
				}
				Update: {
					created_at?: string
					id?: number
					name?: string
				}
				Relationships: []
			}
			asset_lifecycle_statuses: {
				Row: {
					created_at: string
					id: number
					name: string
				}
				Insert: {
					created_at?: string
					id?: number
					name: string
				}
				Update: {
					created_at?: string
					id?: number
					name?: string
				}
				Relationships: []
			}
			asset_subcategories: {
				Row: {
					category_id: number
					created_at: string
					id: number
					name: string
				}
				Insert: {
					category_id: number
					created_at?: string
					id?: number
					name: string
				}
				Update: {
					category_id?: number
					created_at?: string
					id?: number
					name?: string
				}
				Relationships: [
					{
						foreignKeyName: "AssetSubcategories_category_id_fkey"
						columns: ["category_id"]
						isOneToOne: false
						referencedRelation: "asset_categories"
						referencedColumns: ["id"]
					},
				]
			}
			assets: {
				Row: {
					category_id: number
					classification_id: number | null
					created_at: string
					created_by: string | null
					created_by_delegate: string | null
					description: string | null
					exposure_id: number | null
					id: string
					ip_address: string | null
					lifecycle_status_id: number | null
					location: string | null
					name: string
					owner_team_id: string | null
					owner_user_id: string | null
					reviewer_team_id: string | null
					reviewer_user_id: string | null
					subcategory_id: number | null
					tenant_id: string
					updated_at: string
					url: string | null
				}
				Insert: {
					category_id: number
					classification_id?: number | null
					created_at?: string
					created_by?: string | null
					created_by_delegate?: string | null
					description?: string | null
					exposure_id?: number | null
					id?: string
					ip_address?: string | null
					lifecycle_status_id?: number | null
					location?: string | null
					name: string
					owner_team_id?: string | null
					owner_user_id?: string | null
					reviewer_team_id?: string | null
					reviewer_user_id?: string | null
					subcategory_id?: number | null
					tenant_id: string
					updated_at?: string
					url?: string | null
				}
				Update: {
					category_id?: number
					classification_id?: number | null
					created_at?: string
					created_by?: string | null
					created_by_delegate?: string | null
					description?: string | null
					exposure_id?: number | null
					id?: string
					ip_address?: string | null
					lifecycle_status_id?: number | null
					location?: string | null
					name?: string
					owner_team_id?: string | null
					owner_user_id?: string | null
					reviewer_team_id?: string | null
					reviewer_user_id?: string | null
					subcategory_id?: number | null
					tenant_id?: string
					updated_at?: string
					url?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "assets_category_id_fkey"
						columns: ["category_id"]
						isOneToOne: false
						referencedRelation: "asset_categories"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_classification_id_fkey"
						columns: ["classification_id"]
						isOneToOne: false
						referencedRelation: "asset_classifications"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_created_by_delegate_fkey"
						columns: ["created_by_delegate"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_created_by_fkey"
						columns: ["created_by"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_exposure_id_fkey"
						columns: ["exposure_id"]
						isOneToOne: false
						referencedRelation: "asset_exposures"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_lifecycle_status_id_fkey"
						columns: ["lifecycle_status_id"]
						isOneToOne: false
						referencedRelation: "asset_lifecycle_statuses"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_owner_team_id_fkey"
						columns: ["owner_team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_owner_user_id_fkey"
						columns: ["owner_user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_reviewer_team_id_fkey"
						columns: ["reviewer_team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_reviewer_user_id_fkey"
						columns: ["reviewer_user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_subcategory_id_fkey"
						columns: ["subcategory_id"]
						isOneToOne: false
						referencedRelation: "asset_subcategories"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "assets_tenant_id_fkey"
						columns: ["tenant_id"]
						isOneToOne: false
						referencedRelation: "tenants"
						referencedColumns: ["id"]
					},
				]
			}
			document_lifecycle_statuses: {
				Row: {
					created_at: string
					id: number
					name: string
				}
				Insert: {
					created_at?: string
					id?: number
					name: string
				}
				Update: {
					created_at?: string
					id?: number
					name?: string
				}
				Relationships: []
			}
			document_types: {
				Row: {
					created_at: string
					id: number
					name: string
				}
				Insert: {
					created_at?: string
					id?: number
					name: string
				}
				Update: {
					created_at?: string
					id?: number
					name?: string
				}
				Relationships: []
			}
			internal_user_tenant_access: {
				Row: {
					tenant_id: string
					user_id: string
				}
				Insert: {
					tenant_id: string
					user_id: string
				}
				Update: {
					tenant_id?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "internal_user_tenant_access_tenant_id_fkey"
						columns: ["tenant_id"]
						isOneToOne: false
						referencedRelation: "tenants"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "internal_user_tenant_access_user_id_fkey"
						columns: ["user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
				]
			}
			policies: {
				Row: {
					approved_at: string | null
					approver_team_id: string | null
					approver_user_id: string | null
					classification_id: number
					created_at: string
					created_by: string | null
					document_type_id: number
					effective_date: string | null
					id: string
					next_review_date: string | null
					objective: string | null
					policy_owner_team_id: string | null
					policy_owner_user_id: string | null
					published_at: string | null
					requirements: Json
					reviewed_at: string | null
					reviewer_team_id: string | null
					reviewer_user_id: string | null
					scope: string | null
					status_id: number
					tenant_id: string
					title: string
					updated_at: string
					version: string
				}
				Insert: {
					approved_at?: string | null
					approver_team_id?: string | null
					approver_user_id?: string | null
					classification_id: number
					created_at?: string
					created_by?: string | null
					document_type_id: number
					effective_date?: string | null
					id?: string
					next_review_date?: string | null
					objective?: string | null
					policy_owner_team_id?: string | null
					policy_owner_user_id?: string | null
					published_at?: string | null
					requirements?: Json
					reviewed_at?: string | null
					reviewer_team_id?: string | null
					reviewer_user_id?: string | null
					scope?: string | null
					status_id: number
					tenant_id: string
					title: string
					updated_at?: string
					version?: string
				}
				Update: {
					approved_at?: string | null
					approver_team_id?: string | null
					approver_user_id?: string | null
					classification_id?: number
					created_at?: string
					created_by?: string | null
					document_type_id?: number
					effective_date?: string | null
					id?: string
					next_review_date?: string | null
					objective?: string | null
					policy_owner_team_id?: string | null
					policy_owner_user_id?: string | null
					published_at?: string | null
					requirements?: Json
					reviewed_at?: string | null
					reviewer_team_id?: string | null
					reviewer_user_id?: string | null
					scope?: string | null
					status_id?: number
					tenant_id?: string
					title?: string
					updated_at?: string
					version?: string
				}
				Relationships: [
					{
						foreignKeyName: "policies_approver_team_id_fkey1"
						columns: ["approver_team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_approver_user_id_fkey1"
						columns: ["approver_user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_classification_id_fkey1"
						columns: ["classification_id"]
						isOneToOne: false
						referencedRelation: "asset_classifications"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_created_by_fkey"
						columns: ["created_by"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_document_type_id_fkey"
						columns: ["document_type_id"]
						isOneToOne: false
						referencedRelation: "document_types"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_policy_owner_team_id_fkey"
						columns: ["policy_owner_team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_policy_owner_user_id_fkey"
						columns: ["policy_owner_user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_reviewer_team_id_fkey1"
						columns: ["reviewer_team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_reviewer_user_id_fkey1"
						columns: ["reviewer_user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_status_id_fkey"
						columns: ["status_id"]
						isOneToOne: false
						referencedRelation: "document_lifecycle_statuses"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_tenant_id_fkey1"
						columns: ["tenant_id"]
						isOneToOne: false
						referencedRelation: "tenants"
						referencedColumns: ["id"]
					},
				]
			}
			policies_toDelete: {
				Row: {
					approver_team_id: string | null
					approver_user_id: string | null
					classification_id: number | null
					created_at: string
					creator_id: string | null
					id: string
					name: string
					next_review_date: string | null
					owner_team_id: string | null
					owner_user_id: string | null
					purpose: string | null
					requirements: string | null
					reviewer_team_id: string | null
					reviewer_user_id: string | null
					scope: string | null
					status: number | null
					tenant_id: string
					version: string | null
				}
				Insert: {
					approver_team_id?: string | null
					approver_user_id?: string | null
					classification_id?: number | null
					created_at?: string
					creator_id?: string | null
					id?: string
					name: string
					next_review_date?: string | null
					owner_team_id?: string | null
					owner_user_id?: string | null
					purpose?: string | null
					requirements?: string | null
					reviewer_team_id?: string | null
					reviewer_user_id?: string | null
					scope?: string | null
					status?: number | null
					tenant_id: string
					version?: string | null
				}
				Update: {
					approver_team_id?: string | null
					approver_user_id?: string | null
					classification_id?: number | null
					created_at?: string
					creator_id?: string | null
					id?: string
					name?: string
					next_review_date?: string | null
					owner_team_id?: string | null
					owner_user_id?: string | null
					purpose?: string | null
					requirements?: string | null
					reviewer_team_id?: string | null
					reviewer_user_id?: string | null
					scope?: string | null
					status?: number | null
					tenant_id?: string
					version?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "policies_approver_team_id_fkey"
						columns: ["approver_team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_approver_user_id_fkey"
						columns: ["approver_user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_classification_id_fkey"
						columns: ["classification_id"]
						isOneToOne: false
						referencedRelation: "asset_classifications"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_creator_id_fkey"
						columns: ["creator_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_owner_team_id_fkey"
						columns: ["owner_team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_owner_user_id_fkey"
						columns: ["owner_user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_reviewer_team_id_fkey"
						columns: ["reviewer_team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_reviewer_user_id_fkey"
						columns: ["reviewer_user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_status_fkey"
						columns: ["status"]
						isOneToOne: false
						referencedRelation: "policy_lifecycle_statuses_todelete"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policies_tenant_id_fkey"
						columns: ["tenant_id"]
						isOneToOne: false
						referencedRelation: "tenants"
						referencedColumns: ["id"]
					},
				]
			}
			policy_comments: {
				Row: {
					created_at: string
					policy_id: string
					text: string
					user_id: string
				}
				Insert: {
					created_at?: string
					policy_id?: string
					text: string
					user_id?: string
				}
				Update: {
					created_at?: string
					policy_id?: string
					text?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "policy_comments_policy_id_fkey"
						columns: ["policy_id"]
						isOneToOne: false
						referencedRelation: "policies_toDelete"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "policy_comments_user_id_fkey"
						columns: ["user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
				]
			}
			policy_lifecycle_statuses_todelete: {
				Row: {
					created_at: string
					id: number
					name: string
				}
				Insert: {
					created_at?: string
					id?: number
					name: string
				}
				Update: {
					created_at?: string
					id?: number
					name?: string
				}
				Relationships: []
			}
			roles_todelete: {
				Row: {
					created_at: string | null
					description: string | null
					id: string
					name: string
				}
				Insert: {
					created_at?: string | null
					description?: string | null
					id?: string
					name: string
				}
				Update: {
					created_at?: string | null
					description?: string | null
					id?: string
					name?: string
				}
				Relationships: []
			}
			teams: {
				Row: {
					created_at: string | null
					email: string | null
					id: string
					name: string
					tenant_id: string
				}
				Insert: {
					created_at?: string | null
					email?: string | null
					id?: string
					name: string
					tenant_id: string
				}
				Update: {
					created_at?: string | null
					email?: string | null
					id?: string
					name?: string
					tenant_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "teams_tenant_id_fkey"
						columns: ["tenant_id"]
						isOneToOne: false
						referencedRelation: "tenants"
						referencedColumns: ["id"]
					},
				]
			}
			tenants: {
				Row: {
					address: string | null
					contact_email: string | null
					contact_name: string | null
					contact_number: string | null
					country: string | null
					created_at: string
					id: string
					last_login_date: string | null
					last_login_user: string | null
					logo: string | null
					name: string
					notes: string | null
					slug: string | null
					status: string | null
					updated_at: string | null
				}
				Insert: {
					address?: string | null
					contact_email?: string | null
					contact_name?: string | null
					contact_number?: string | null
					country?: string | null
					created_at?: string
					id?: string
					last_login_date?: string | null
					last_login_user?: string | null
					logo?: string | null
					name: string
					notes?: string | null
					slug?: string | null
					status?: string | null
					updated_at?: string | null
				}
				Update: {
					address?: string | null
					contact_email?: string | null
					contact_name?: string | null
					contact_number?: string | null
					country?: string | null
					created_at?: string
					id?: string
					last_login_date?: string | null
					last_login_user?: string | null
					logo?: string | null
					name?: string
					notes?: string | null
					slug?: string | null
					status?: string | null
					updated_at?: string | null
				}
				Relationships: []
			}
			user_roles_todelete: {
				Row: {
					role_id: string
					user_id: string
				}
				Insert: {
					role_id: string
					user_id: string
				}
				Update: {
					role_id?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "user_roles_role_id_fkey"
						columns: ["role_id"]
						isOneToOne: false
						referencedRelation: "roles_todelete"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "user_roles_user_id_fkey"
						columns: ["user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
				]
			}
			user_teams: {
				Row: {
					team_id: string
					user_id: string
				}
				Insert: {
					team_id: string
					user_id: string
				}
				Update: {
					team_id?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "user_teams_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "user_teams_user_id_fkey"
						columns: ["user_id"]
						isOneToOne: false
						referencedRelation: "users"
						referencedColumns: ["id"]
					},
				]
			}
			users: {
				Row: {
					auth_user_id: string | null
					created_at: string
					email: string
					id: string
					name: string
					role: string
					tenant_id: string | null
					title: string | null
				}
				Insert: {
					auth_user_id?: string | null
					created_at?: string
					email: string
					id: string
					name: string
					role?: string
					tenant_id?: string | null
					title?: string | null
				}
				Update: {
					auth_user_id?: string | null
					created_at?: string
					email?: string
					id?: string
					name?: string
					role?: string
					tenant_id?: string | null
					title?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "users_tenant_id_fkey"
						columns: ["tenant_id"]
						isOneToOne: false
						referencedRelation: "tenants"
						referencedColumns: ["id"]
					},
				]
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
	| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
	| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
	? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
		DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
	: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
		DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R
		}
	? R
	: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
		DefaultSchema["Views"])
	? (DefaultSchema["Tables"] &
		DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
			Row: infer R
		}
	? R
	: never
	: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
	| keyof DefaultSchema["Tables"]
	| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
	? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
	: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
		Insert: infer I
	}
	? I
	: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
	? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
		Insert: infer I
	}
	? I
	: never
	: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
	| keyof DefaultSchema["Tables"]
	| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
	? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
	: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
		Update: infer U
	}
	? U
	: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
	? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
		Update: infer U
	}
	? U
	: never
	: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
	| keyof DefaultSchema["Enums"]
	| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
	? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
	: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
	? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
	: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
	| keyof DefaultSchema["CompositeTypes"]
	| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
	? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
	: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
	? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
	: never

export const Constants = {
	public: {
		Enums: {},
	},
} as const
