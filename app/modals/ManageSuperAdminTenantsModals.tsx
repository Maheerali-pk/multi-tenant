"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/app/types/database.types";
import type { UserRow } from "@/app/components/UsersTable";
import ModalWrapper from "@/app/components/ModalWrapper";

type Tenant = Tables<"tenants">;

// Type definition for internal_user_tenant_access table
type UserTenantAccess = {
  user_id: string;
  tenant_id: string;
};

interface ManageSuperAdminTenantsModalsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: UserRow | null;
}

export default function ManageSuperAdminTenantsModals({
  isOpen,
  onClose,
  onSuccess,
  user,
}: ManageSuperAdminTenantsModalsProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(
    new Set()
  );
  const [existingAccess, setExistingAccess] = useState<UserTenantAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTenantIds(new Set());
      setExistingAccess([]);
      setError(null);
    }
  }, [isOpen]);

  // Fetch tenants and existing access when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchTenants();
      fetchExistingAccess();
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
        setTenants((data as Tenant[]) || []);
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to load tenants");
    } finally {
      setLoadingTenants(false);
    }
  };

  const fetchExistingAccess = async () => {
    if (!user) return;

    setLoadingAccess(true);
    try {
      const { data, error: accessError } = await supabase
        .from("internal_user_tenant_access")
        .select("user_id, tenant_id")
        .eq("user_id", user.id);

      if (accessError) {
        console.error("Error fetching existing access:", accessError);
        setError("Failed to load existing tenant access");
      } else {
        const access = (data as UserTenantAccess[]) || [];
        setExistingAccess(access);
        // Pre-select tenants that the user already has access to
        const existingTenantIds = new Set(access.map((a) => a.tenant_id));
        setSelectedTenantIds(existingTenantIds);
      }
    } catch (err) {
      console.error("Error fetching existing access:", err);
      setError("Failed to load existing tenant access");
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleTenantToggle = (tenantId: string) => {
    setSelectedTenantIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId);
      } else {
        newSet.add(tenantId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTenantIds.size === tenants.length) {
      // Deselect all
      setSelectedTenantIds(new Set());
    } else {
      // Select all
      setSelectedTenantIds(new Set(tenants.map((tenant) => tenant.id)));
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedIds = Array.from(selectedTenantIds);
      const existingIds = existingAccess.map((a) => a.tenant_id);

      // Find tenants to add (in selected but not in existing)
      const toAdd = selectedIds.filter((id) => !existingIds.includes(id));

      // Find tenants to remove (in existing but not in selected)
      const toRemove = existingIds.filter((id) => !selectedIds.includes(id));

      // Remove access for deselected tenants
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("internal_user_tenant_access")
          .delete()
          .eq("user_id", user.id)
          .in("tenant_id", toRemove);

        if (deleteError) {
          console.error("Error removing tenant access:", deleteError);
          setError("Failed to remove tenant access");
          setLoading(false);
          return;
        }
      }

      // Add access for newly selected tenants
      if (toAdd.length > 0) {
        const newAccess = toAdd.map((tenantId) => ({
          user_id: user.id,
          tenant_id: tenantId,
        }));

        const { error: insertError } = await supabase
          .from("internal_user_tenant_access")
          .insert(newAccess);

        if (insertError) {
          console.error("Error adding tenant access:", insertError);
          setError("Failed to add tenant access");
          setLoading(false);
          return;
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error saving tenants:", err);
      setError("Failed to save tenants");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-text-dark">
              Manage Super Admin Tenants
            </h2>
            {user && (
              <p className="text-sm text-text-secondary mt-1">
                Managing access for: {user.name || user.email}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

        {loadingTenants || loadingAccess ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-text-secondary">
              {loadingTenants
                ? "Loading tenants..."
                : "Loading existing access..."}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Option */}
            {tenants.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border-hr hover:bg-sidebar-sub-item-hover transition-colors">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={
                    tenants.length > 0 &&
                    selectedTenantIds.size === tenants.length
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-border-hr text-brand focus:ring-brand focus:ring-2 cursor-pointer"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium text-text-primary cursor-pointer flex-1"
                >
                  Select All
                </label>
                <span className="text-xs text-text-secondary">
                  {selectedTenantIds.size} of {tenants.length} selected
                </span>
              </div>
            )}

            {/* Tenants List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tenants.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  No tenants found
                </div>
              ) : (
                tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border-hr hover:bg-sidebar-sub-item-hover transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`tenant-${tenant.id}`}
                      checked={selectedTenantIds.has(tenant.id)}
                      onChange={() => handleTenantToggle(tenant.id)}
                      className="w-4 h-4 rounded border-border-hr text-brand focus:ring-brand focus:ring-2 cursor-pointer"
                    />
                    <label
                      htmlFor={`tenant-${tenant.id}`}
                      className="text-sm text-text-primary cursor-pointer flex-1"
                    >
                      {tenant.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-border-hr">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-lg border border-border-hr bg-bg-outer text-text-primary font-medium text-sm hover:bg-sidebar-sub-item-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || loadingTenants}
            className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
    </ModalWrapper>
  );
}
