"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/app/types/database.types";
import { CustomSelect, SelectOption } from "@/app/components/CustomSelect";
import { toast } from "react-toastify";
import ModalWrapper from "@/app/components/ModalWrapper";

type Tenant = Tables<"tenants">;

interface CreateNewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateNewUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateNewUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    tenant_id: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        title: "",
        tenant_id: "",
        role: "",
      });
      setError(null);
    }
  }, [isOpen]);

  // Fetch tenants when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTenants();
    }
  }, [isOpen]);

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const { data, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");

      if (tenantsError) {
        console.error("Error fetching tenants:", tenantsError);
        setError("Failed to load tenants");
      } else {
        setTenants((data as Tenant[]) || []);
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to load tenants");
    } finally {
      setLoadingTenants(false);
    }
  };

  // Convert tenants to SelectOption format
  const tenantOptions: SelectOption[] = useMemo(() => {
    return tenants.map((tenant) => ({
      value: tenant.id,
      label: tenant.name,
    }));
  }, [tenants]);

  // Role options
  const roleOptions: SelectOption[] = useMemo(
    () => [
      { value: "superadmin", label: "Super Admin" },
      { value: "tenant_admin", label: "Tenant Admin" },
    ],
    []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.role) {
      setError("Role is required");
      return;
    }

    // If role is tenant_admin, tenant is required
    if (formData.role === "tenant_admin" && !formData.tenant_id) {
      setError("Tenant is required for Tenant Admin role");
      return;
    }

    setLoading(true);

    try {
      // Call the invite API endpoint
      const response = await fetch("/api/invite-from-super-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          full_name: formData.name.trim(),
          title: formData.title.trim() || undefined,
          tenant_id: formData.tenant_id || undefined,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error creating user:", data);
        setError(data.error || "Failed to create user");
        setLoading(false);
        return;
      }

      // Show success toast
      toast.success(
        `User added and invitation email sent to user ${formData.email.trim()}`
      );

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error creating user:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      // If role is changed to "superadmin", clear tenant_id
      if (name === "role" && value === "superadmin") {
        return {
          ...prev,
          [name]: value,
          tenant_id: "",
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">
          Create New User
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} className="text-text-secondary" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid Layout for Form Fields */}
        <div className="grid grid-cols-1 gap-6">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-sm font-medium text-text-primary"
            >
              Name <span className="text-failure">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
              placeholder="Enter user name"
            />
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-text-primary"
            >
              Email <span className="text-failure">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
              placeholder="Enter email address"
            />
          </div>

          {/* Title Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="title"
              className="text-sm font-medium text-text-primary"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
              placeholder="Enter title (optional)"
            />
          </div>

          {/* Role Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="role"
              className="text-sm font-medium text-text-primary"
            >
              Role <span className="text-failure">*</span>
            </label>
            <CustomSelect
              id="role"
              name="role"
              options={roleOptions}
              value={formData.role}
              onChange={(value) => handleSelectChange("role", value)}
              placeholder="Select role"
            />
          </div>

          {/* Tenant Field - Only show if role is not "superadmin" */}
          {formData.role !== "superadmin" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tenant_id"
                className="text-sm font-medium text-text-primary"
              >
                Tenant
                {formData.role === "tenant_admin" && (
                  <span className="text-failure"> *</span>
                )}
              </label>
              <CustomSelect
                id="tenant_id"
                name="tenant_id"
                options={tenantOptions}
                value={formData.tenant_id}
                onChange={(value) => handleSelectChange("tenant_id", value)}
                placeholder={
                  loadingTenants
                    ? "Loading tenants..."
                    : formData.role === "tenant_admin"
                    ? "Select tenant (required)"
                    : "Select tenant (optional)"
                }
                isDisabled={loadingTenants}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingTenants}
            className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
