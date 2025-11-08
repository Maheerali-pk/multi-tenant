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
  href: string;
  icon: React.ReactNode;
}

export interface SidebarItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  subItems: SidebarSubItem[];
}
export const SidebarItems: SidebarItem[] = [
  {
    name: "Assets Management",
    icon: allIcons.sidebar.assetManagement(32, 32),
    subItems: [
      {
        icon: <LayoutGrid size={16} />,
        name: "Applications",
        href: "/dashboard/assets/applications",
      },
      {
        icon: <Network size={16} />,
        name: "Network & Infrastructure",
        href: "/dashboard/assets/network-and-infrastructure",
      },
      {
        icon: <Cloud size={16} />,
        name: "Cloud Assets",
        href: "/dashboard/assets/cloud-assets",
      },
      {
        icon: <Database size={16} />,
        name: "Data and Information",
        href: "/dashboard/assets/data-and-information",
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

export interface ExampleTable1Row {
  id: number;
  name: string;
  type: string;
  owner: string;
  status: "Active" | "Rejected" | "Planned";
  url?: string;
  exposure?: string;
  location?: string;
}

export const ExampleTable1: ExampleTable1Row[] = [
  {
    id: 1,
    name: "GRC Platform (Lab)",
    type: "Desktop Application",
    owner: "Sales & Marketing Team",
    status: "Active",
    url: "https://make.PowerApps.com",
    exposure: "Internal",
    location: "Azure Cloud - PaaS",
  },
  {
    id: 2,
    name: "GRC Platform",
    type: "Web Application",
    owner: "Security Team",
    status: "Rejected",
    url: "-",
    exposure: "Confidential",
    location: "Cloud",
  },
  {
    id: 3,
    name: "QEATech Customers Portal",
    type: "Web Application",
    owner: "Sales & Marketing Team",
    status: "Active",
    url: "https://www.QeaTech.com",
    exposure: "External",
    location: "AWS",
  },
  {
    id: 4,
    name: "QEATech Platform for Mobile",
    type: "Mobile Application",
    owner: "Mansour Asrani",
    status: "Active",
    url: "-",
    exposure: "External",
    location: "-",
  },
  {
    id: 5,
    name: "Customer Management System",
    type: "Web Application",
    owner: "Sales & Marketing Team",
    status: "Active",
    url: "https://cms.example.com",
    exposure: "Internal",
    location: "Azure Cloud - PaaS",
  },
  {
    id: 6,
    name: "HR Management Portal",
    type: "Web Application",
    owner: "HR Department",
    status: "Active",
    url: "https://hr.example.com",
    exposure: "Internal",
    location: "AWS",
  },
  {
    id: 7,
    name: "Financial Reporting Dashboard",
    type: "Desktop Application",
    owner: "Finance Team",
    status: "Planned",
    url: "-",
    exposure: "Confidential",
    location: "Azure Cloud - PaaS",
  },
  {
    id: 8,
    name: "Inventory Management System",
    type: "Web Application",
    owner: "Operations Team",
    status: "Active",
    url: "https://inventory.example.com",
    exposure: "Internal",
    location: "Cloud",
  },
  {
    id: 9,
    name: "Employee Mobile App",
    type: "Mobile Application",
    owner: "IT Department",
    status: "Active",
    url: "-",
    exposure: "Internal",
    location: "AWS",
  },
  {
    id: 10,
    name: "Compliance Tracking System",
    type: "Web Application",
    owner: "Compliance Team",
    status: "Active",
    url: "https://compliance.example.com",
    exposure: "Confidential",
    location: "Azure Cloud - PaaS",
  },
  {
    id: 11,
    name: "Project Management Tool",
    type: "Web Application",
    owner: "Project Management Office",
    status: "Active",
    url: "https://pm.example.com",
    exposure: "Internal",
    location: "Cloud",
  },
  {
    id: 12,
    name: "Document Management System",
    type: "Web Application",
    owner: "IT Department",
    status: "Active",
    url: "https://docs.example.com",
    exposure: "Internal",
    location: "Azure Cloud - PaaS",
  },
  {
    id: 13,
    name: "Customer Support Portal",
    type: "Web Application",
    owner: "Customer Support Team",
    status: "Active",
    url: "https://support.example.com",
    exposure: "External",
    location: "AWS",
  },
  {
    id: 14,
    name: "Analytics Dashboard",
    type: "Desktop Application",
    owner: "Business Intelligence Team",
    status: "Planned",
    url: "-",
    exposure: "Confidential",
    location: "Cloud",
  },
  {
    id: 15,
    name: "API Gateway Management",
    type: "API",
    owner: "Development Team",
    status: "Active",
    url: "https://api.example.com",
    exposure: "Internal",
    location: "Azure Cloud - PaaS",
  },
  {
    id: 16,
    name: "Marketing Automation Platform",
    type: "Web Application",
    owner: "Sales & Marketing Team",
    status: "Active",
    url: "https://marketing.example.com",
    exposure: "External",
    location: "AWS",
  },
  {
    id: 17,
    name: "Quality Assurance Portal",
    type: "Web Application",
    owner: "QA Team",
    status: "Rejected",
    url: "-",
    exposure: "Internal",
    location: "Cloud",
  },
  {
    id: 18,
    name: "Training Management System",
    type: "Web Application",
    owner: "HR Department",
    status: "Active",
    url: "https://training.example.com",
    exposure: "Internal",
    location: "Azure Cloud - PaaS",
  },
  {
    id: 19,
    name: "Vendor Management Portal",
    type: "Web Application",
    owner: "Procurement Team",
    status: "Active",
    url: "https://vendor.example.com",
    exposure: "Internal",
    location: "AWS",
  },
  {
    id: 20,
    name: "Security Monitoring Dashboard",
    type: "Desktop Application",
    owner: "Security Team",
    status: "Active",
    url: "-",
    exposure: "Confidential",
    location: "Cloud",
  },
  {
    id: 21,
    name: "Client Portal",
    type: "Web Application",
    owner: "Sales & Marketing Team",
    status: "Active",
    url: "https://client.example.com",
    exposure: "External",
    location: "AWS",
  },
  {
    id: 22,
    name: "Internal Communication Hub",
    type: "Web Application",
    owner: "IT Department",
    status: "Active",
    url: "https://comm.example.com",
    exposure: "Internal",
    location: "Azure Cloud - PaaS",
  },
  {
    id: 23,
    name: "Performance Management System",
    type: "Web Application",
    owner: "HR Department",
    status: "Planned",
    url: "-",
    exposure: "Internal",
    location: "Cloud",
  },
  {
    id: 24,
    name: "Data Warehouse Interface",
    type: "Desktop Application",
    owner: "Business Intelligence Team",
    status: "Active",
    url: "-",
    exposure: "Confidential",
    location: "Azure Cloud - PaaS",
  },
];
