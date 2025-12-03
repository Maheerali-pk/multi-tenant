import { AssetField } from "../types/assets.types";
import { IRoute } from "../types/routes.types";
import { allIcons } from "./icons";
import {
  LayoutGrid,
  Network,
  Cloud,
  Database,
  FileText,
  Shield,
  ClipboardList,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Video,
} from "lucide-react";

export interface SidebarSubItem {
  name: string;
  href: IRoute;
  icon: React.ReactNode;
}

export interface SidebarItem {
  name: string;
  href?: IRoute;
  icon: React.ReactNode;
  subItems: SidebarSubItem[];
}
export const formatSingleRoutePathWord = (word: string): string => {
  return word
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};
export const getRouteTitle = (route: IRoute): string => {
  const routeParts = route.split("/");
  return routeParts
    .filter((part) => part.trim() !== "")
    .filter((part) => part !== "dashboard")

    .map((part) => formatSingleRoutePathWord(part))
    .join(" / ");
};

export const SidebarItems: SidebarItem[] = [
  {
    name: "Asset Management",
    icon: allIcons.sidebar.assetManagement(32, 32),
    subItems: [
      {
        icon: <LayoutGrid size={16} />,
        name: "Applications",
        href: "/dashboard/asset-management/applications",
      },
      {
        icon: <Network size={16} />,
        name: "Network & Infrastructure",
        href: "/dashboard/asset-management/network-and-infrastructure",
      },
      {
        icon: <Cloud size={16} />,
        name: "Cloud Assets",
        href: "/dashboard/asset-management/cloud-assets",
      },
      {
        icon: <Database size={16} />,
        name: "Data and Information",
        href: "/dashboard/asset-management/data-and-information",
      },
    ],
  },
  {
    name: "Policy Management",
    icon: allIcons.sidebar.policyManagement(32, 32),
    subItems: [
      {
        icon: <Shield size={16} />,
        name: "Security Policies",
        href: "/dashboard/policy/security-policies",
      },
      {
        icon: <ClipboardList size={16} />,
        name: "Compliance Standards",
        href: "/dashboard/policy/compliance-standards",
      },
      {
        icon: <FileCheck size={16} />,
        name: "Policy Templates",
        href: "/dashboard/policy/templates",
      },
    ],
  },
  {
    name: "Risk Management",
    icon: allIcons.sidebar.riskManagement(32, 32),
    subItems: [
      {
        icon: <AlertTriangle size={16} />,
        name: "Risk Assessment",
        href: "/dashboard/risk/assessment",
      },
      {
        icon: <TrendingUp size={16} />,
        name: "Risk Monitoring",
        href: "/dashboard/risk/monitoring",
      },
      {
        icon: <BarChart3 size={16} />,
        name: "Risk Analytics",
        href: "/dashboard/risk/analytics",
      },
      {
        icon: <Shield size={16} />,
        name: "Mitigation Strategies",
        href: "/dashboard/risk/mitigation",
      },
      {
        icon: <FileText size={16} />,
        name: "Risk Reports",
        href: "/dashboard/risk/reports",
      },
      {
        icon: <Users size={16} />,
        name: "Risk Owners",
        href: "/dashboard/risk/owners",
      },
    ],
  },
  {
    name: "Awareness Program",
    icon: allIcons.sidebar.awarenessProgram(32, 32),
    subItems: [
      {
        icon: <GraduationCap size={16} />,
        name: "Training Modules",
        href: "/dashboard/awareness/training",
      },
      {
        icon: <BookOpen size={16} />,
        name: "Resources",
        href: "/dashboard/awareness/resources",
      },
      {
        icon: <Video size={16} />,
        name: "Video Library",
        href: "/dashboard/awareness/videos",
      },
    ],
  },
];

export const assetTypes: string[] = [
  "Web Application",
  "Mobile Application",
  "Desktop Application",
  "API",
  "Other Applications",
  "Endpoints",
  "Servers & VMs",
  "Devices",
  "IoT & Peripheral Devices",
  "Other Network & Infra",
  "Cloud Applications (SaaS)",
  "Cloud Infrastructure (IaaS/PaaS)",
  "Customer Data",
  "Internal & Business Data",
  "Source Code & IP",
  "Other Data",
];

export const commonAssetFields: AssetField[] = [
  "name",
  "subcategory_id",
  "classification_id",
  "exposure_id",
  "lifecycle_status_id",
  "location",
  "description",
  "owner_team_id",
  "owner_user_id",
  "reviewer_team_id",
  "reviewer_user_id",
];
