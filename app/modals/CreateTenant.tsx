"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TablesInsert } from "@/app/types/database.types";
import { CustomSelect, SelectOption } from "@/app/components/CustomSelect";
import { countries } from "@/app/helpers/countries";

type TenantInsert = TablesInsert<"tenants">;

interface CreateTenantProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateTenant({
  isOpen,
  onClose,
  onSuccess,
}: CreateTenantProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    contact_name: "",
    contact_email: "",
    contact_number: "",
    country: "",
    address: "",
    status: "",
    notes: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        slug: "",
        contact_name: "",
        contact_email: "",
        contact_number: "",
        country: "",
        address: "",
        status: "",
        notes: "",
      });
      setLogoFile(null);
      setLogoPreview(null);
      setError(null);
    }
  }, [isOpen]);

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert countries to SelectOption format
  const countryOptions: SelectOption[] = useMemo(() => {
    return countries.map((country) => ({
      value: country.code, // ISO 2-letter code
      label: country.name, // Country name for display
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);

    try {
      const tenantData: TenantInsert = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || null,
        contact_name: formData.contact_name.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        country: formData.country.trim() || null,
        address: formData.address.trim() || null,
        status: formData.status.trim() || null,
        notes: formData.notes.trim() || null,
        logo: null, // Will be updated after upload
      };

      const { data: insertedTenant, error: insertError } = await supabase
        .from("tenants")
        .insert(tenantData)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating tenant:", insertError);
        setError(insertError.message || "Failed to create tenant");
        setLoading(false);
        return;
      }

      // Upload logo if provided
      if (logoFile && insertedTenant) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${insertedTenant.id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("tenant_logos")
          .upload(filePath, logoFile, {
            cacheControl: "3600",
            upsert: true, // Replace if exists
          });

        if (uploadError) {
          console.error("Error uploading logo:", uploadError);
          // Don't fail the entire operation, just log the error
          // Optionally, you could delete the tenant if logo upload fails
        } else {
          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("tenant_logos").getPublicUrl(filePath);

          // Update tenant with logo URL
          const { error: updateError } = await supabase
            .from("tenants")
            .update({ logo: publicUrl })
            .eq("id", insertedTenant.id);

          if (updateError) {
            console.error("Error updating tenant logo:", updateError);
          }
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error creating tenant:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-bg-inner rounded-3xl p-6 shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text-dark">
            Create New Tenant
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors"
                placeholder="Enter tenant name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="slug"
                className="text-sm font-medium text-text-primary"
              >
                Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors"
                placeholder="Enter slug"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact_name"
                className="text-sm font-medium text-text-primary"
              >
                Contact Name
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors"
                placeholder="Enter contact name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact_email"
                className="text-sm font-medium text-text-primary"
              >
                Contact Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors"
                placeholder="Enter contact email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact_number"
                className="text-sm font-medium text-text-primary"
              >
                Contact Number
              </label>
              <input
                type="text"
                id="contact_number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors"
                placeholder="Enter contact number"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="country"
                className="text-sm font-medium text-text-primary"
              >
                Country
              </label>
              <CustomSelect
                id="country"
                name="country"
                options={countryOptions}
                value={formData.country}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, country: value }))
                }
                placeholder="Select country"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="status"
                className="text-sm font-medium text-text-primary"
              >
                Status
              </label>
              <CustomSelect
                id="status"
                name="status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "disabled", label: "Disabled" },
                ]}
                value={formData.status}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
                placeholder="Select status"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="logo"
                className="text-sm font-medium text-text-primary"
              >
                Logo
              </label>
              <input
                type="file"
                id="logo"
                name="logo"
                accept="image/*"
                onChange={handleLogoChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand file:text-text-contrast file:cursor-pointer hover:file:opacity-90"
              />
              {logoPreview && (
                <div className="mt-2">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain border border-border-hr rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="address"
              className="text-sm font-medium text-text-primary"
            >
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors resize-none"
              placeholder="Enter address"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-sm font-medium text-text-primary"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors resize-none"
              placeholder="Enter notes"
            />
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
              {loading ? "Creating..." : "Create Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
