"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModalWrapper from "@/app/components/modal-wrapper";
import type { TablesUpdate } from "@/app/types/database.types";
import { CustomSelect, SelectOption } from "@/app/components/custom-select";
import type { UserRow } from "@/app/components/users-table";

type UserUpdate = TablesUpdate<"users">;

interface EditUserModalForTenantAdminProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: UserRow | null;
}

export default function EditUserModalForTenantAdmin({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalForTenantAdminProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Fetch user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoadingUser(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user:", userError);
        setError("Failed to load user data");
        setLoadingUser(false);
        return;
      }

      if (userData) {
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          title: userData.title || "",
          role: userData.role || "",
        });
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Failed to load user data");
    } finally {
      setLoadingUser(false);
    }
  };

  // Role options - tenant_admin and tenant_user only
  const roleOptions: SelectOption[] = useMemo(
    () => [
      { value: "tenant_admin", label: "Tenant Admin" },
      { value: "tenant_user", label: "Tenant User" },
    ],
    []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("User not found");
      return;
    }

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.role) {
      setError("Role is required");
      return;
    }

    setLoading(true);

    try {
      const userData: UserUpdate = {
        name: formData.name.trim(),
        title: formData.title.trim() || null,
        role: formData.role || "",
        // Don't update tenant_id - keep it as is
      };

      const { error: updateError } = await supabase
        .from("users")
        .update(userData)
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating user:", updateError);
        setError(updateError.message || "Failed to update user");
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      setError("An unexpected error occurred");
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">Edit User</h2>
        <button
          onClick={onClose}
          disabled={loading}
          className="p-2 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X size={20} className="text-text-secondary" />
        </button>
      </div>

      {loadingUser ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-text-secondary">Loading user data...</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
              {error}
            </div>
          )}

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
                disabled
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary disabled:opacity-60 disabled:cursor-not-allowed"
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
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      )}
    </ModalWrapper>
  );
}
