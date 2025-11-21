"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/app/types/database.types";
import { CustomSelect, SelectOption } from "@/app/components/CustomSelect";
import type { UserRow } from "@/app/components/UsersTable";

type UserUpdate = TablesUpdate<"users">;
type Tenant = Tables<"tenants">;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: UserRow | null;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    tenant_id: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Fetch tenants when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTenants();
    }
  }, [isOpen]);

  // Fetch user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
    }
  }, [isOpen, user]);

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
        setTenants(data || []);
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to load tenants");
    } finally {
      setLoadingTenants(false);
    }
  };

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
          title: userData.title || "",
          tenant_id: userData.tenant_id || "",
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
      { value: "super_admin", label: "Super Admin" },
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

    setLoading(true);

    try {
      const userData: UserUpdate = {
        title: formData.title.trim() || null,
        tenant_id: formData.tenant_id || null,
        role: formData.role || null,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-bg-inner rounded-3xl p-6 shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text-dark">Edit User</h2>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
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
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors"
                  placeholder="Enter title"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="tenant_id"
                  className="text-sm font-medium text-text-primary"
                >
                  Tenant
                </label>
                <CustomSelect
                  id="tenant_id"
                  name="tenant_id"
                  options={tenantOptions}
                  value={formData.tenant_id}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, tenant_id: value }))
                  }
                  placeholder={
                    loadingTenants ? "Loading tenants..." : "Select tenant"
                  }
                  isDisabled={loadingTenants}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-text-primary"
                >
                  Role
                </label>
                <CustomSelect
                  id="role"
                  name="role"
                  options={roleOptions}
                  value={formData.role}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value }))
                  }
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
      </div>
    </div>
  );
}

