"use client";

import { useState, useEffect, useMemo } from "react";
import ContentWrapper from "@/app/components/content-wrapper";
import DashboardWrapper from "@/app/components/dashboard-wrapper";
import { getRouteTitle } from "@/app/helpers/data";
import { IRoute } from "@/app/types/routes.types";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import { supabase } from "@/lib/supabase";
import { CustomSelect, SelectOption } from "@/app/components/custom-select";
import { countries } from "@/app/helpers/countries";
import type { TablesUpdate } from "@/app/types/database.types";

type TenantUpdate = TablesUpdate<"tenants">;

interface CompanyProfileProps {}

const CompanyProfile: React.FC<CompanyProfileProps> = () => {
  const pathname = usePathname();
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();

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
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Determine tenant ID based on user role
  useEffect(() => {
    if (auth.userData?.role === "superadmin") {
      setTenantId(state.selectedTenantId || null);
    } else if (auth.userData?.role === "tenant_admin") {
      setTenantId(auth.userData?.tenant_id || null);
    } else {
      setTenantId(null);
    }
  }, [auth.userData?.role, auth.userData?.tenant_id, state.selectedTenantId]);

  // Fetch tenant data when tenant ID is available
  useEffect(() => {
    if (tenantId) {
      fetchTenantData();
    }
  }, [tenantId]);

  // Convert countries to SelectOption format
  const countryOptions: SelectOption[] = useMemo(() => {
    return countries.map((country) => ({
      value: country.code,
      label: country.name,
    }));
  }, []);

  const fetchTenantData = async () => {
    if (!tenantId) return;

    setLoadingTenant(true);
    setError(null);
    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      if (tenantError) {
        console.error("Error fetching tenant:", tenantError);
        setError("Failed to load tenant data");
        setLoadingTenant(false);
        return;
      }

      if (tenantData) {
        setFormData({
          name: tenantData.name || "",
          slug: tenantData.slug || "",
          contact_name: tenantData.contact_name || "",
          contact_email: tenantData.contact_email || "",
          contact_number: tenantData.contact_number || "",
          country: tenantData.country || "",
          address: tenantData.address || "",
          status: tenantData.status || "",
          notes: tenantData.notes || "",
        });
        setCurrentLogoUrl(tenantData.logo || null);
        setLogoPreview(tenantData.logo || null);
        setLogoFile(null);
      }
    } catch (err) {
      console.error("Error fetching tenant:", err);
      setError("Failed to load tenant data");
    } finally {
      setLoadingTenant(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!tenantId) {
      setError("Tenant ID not found");
      return;
    }

    setLoading(true);

    try {
      let logoUrl = currentLogoUrl;

      // Upload new logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${tenantId}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("tenant_logos")
          .upload(filePath, logoFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading logo:", uploadError);
          setError("Failed to upload logo. Please try again.");
          setLoading(false);
          return;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("tenant_logos").getPublicUrl(filePath);
        logoUrl = publicUrl;
      }

      const tenantData: TenantUpdate = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || null,
        contact_name: formData.contact_name.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        country: formData.country.trim() || null,
        address: formData.address.trim() || null,
        status: formData.status.trim() || null,
        notes: formData.notes.trim() || null,
        logo: logoUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("tenants")
        .update(tenantData)
        .eq("id", tenantId);

      if (updateError) {
        console.error("Error updating tenant:", updateError);
        setError(updateError.message || "Failed to update tenant");
        setLoading(false);
        return;
      }

      setSuccess("Tenant profile updated successfully!");
      setCurrentLogoUrl(logoUrl);
      setLogoFile(null);

      // Refresh tenant data to show updated logo
      await fetchTenantData();
    } catch (err) {
      console.error("Error updating tenant:", err);
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
      setError(null);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Show message if no tenant is selected (for super admin)
  if (auth.userData?.role === "superadmin" && !tenantId) {
    return (
      <DashboardWrapper>
        <ContentWrapper showWithoutTenant filedsToInlcude={[]}>
          <div className="flex flex-col rounded-3xl p-6 gap-3 min-h-0 flex-1">
            <div className="flex justify-between items-center shrink-0 gap-4">
              <div className="font-semibold text-xl items-center text-text-primary">
                {getRouteTitle(pathname as IRoute)}
              </div>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="text-text-secondary text-center">
                Please select a tenant to view and edit its profile.
              </div>
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <ContentWrapper filedsToInlcude={[]}>
        <div className="flex flex-col rounded-3xl p-6 overflow-auto gap-3 min-h-0 flex-1">
          <div className="flex justify-between items-center shrink-0 gap-4">
            <div className="font-semibold text-xl items-center text-text-primary">
              {getRouteTitle(pathname as IRoute)}
            </div>
          </div>

          {loadingTenant ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-text-secondary">Loading tenant data...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-success-light border border-success text-success text-sm">
                  {success}
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
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </ContentWrapper>
    </DashboardWrapper>
  );
};

export default CompanyProfile;
