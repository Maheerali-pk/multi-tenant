
type AssetSubRoute =
	| "applications"
	| "network-and-infrastructure"
	| "cloud-assets"
	| "data-and-information";

type AssetRoute = `/dashboard/asset-management/${AssetSubRoute}`;

type PolicySubRoute =
	| "security-policies"
	| "compliance-standards"
	| "templates";

type PolicyRoute = `/dashboard/policy/${PolicySubRoute}`;

type RiskSubRoute =
	| "assessment"
	| "monitoring"
	| "analytics"
	| "mitigation"
	| "reports"
	| "owners";

type RiskRoute = `/dashboard/risk/${RiskSubRoute}`;

type AwarenessSubRoute = "training" | "resources" | "videos";

type AwarenessRoute = `/dashboard/awareness/${AwarenessSubRoute}`;

type SuperAdminSubRoute = "tenant-management" | "users-and-access";
type ISuperAdminRoutes = `/dashboard/settings/superadmin/${SuperAdminSubRoute}`;

type TenantAdminSubRoute = "tenant-profile" | "users-and-access";
type ITenantAdminRoutes =
	`/dashboard/settings/tenant-admin/${TenantAdminSubRoute}`;

type ProfileSettingsRoute = "/dashboard/profile-settings";
type ILogoutRoute = "/logout";

export type IRoute =
	| AssetRoute
	| PolicyRoute
	| RiskRoute
	| AwarenessRoute
	| ISuperAdminRoutes
	| ITenantAdminRoutes
	| ProfileSettingsRoute
	| ILogoutRoute;