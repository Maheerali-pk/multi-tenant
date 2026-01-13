"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModalWrapper from "@/app/components/modal-wrapper";
import type { Tables, TablesInsert } from "@/app/types/database.types";
import { CustomSelect, SelectOption } from "@/app/components/custom-select";
import { AssetField } from "../types/assets.types";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

type AssetSubcategory = Tables<"asset_subcategories">;
type AssetClassification = Tables<"asset_classifications">;
type AssetExposure = Tables<"asset_exposures">;
type AssetLifecycleStatus = Tables<"asset_lifecycle_statuses">;
type Team = Tables<"teams">;
type User = Tables<"users">;
type AssetInsert = TablesInsert<"assets">;

interface CreateAssetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  categoryId?: number;
  filedsToInlcude: AssetField[]; // Note: keeping typo to match ContentWrapper for now
}

export default function CreateAsset({
  isOpen,
  onClose,
  onSuccess,
  categoryId,
  filedsToInlcude,
}: CreateAssetProps) {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [formData, setFormData] = useState({
    name: "",
    subcategoryId: "",
    classificationId: "",
    exposureId: "",
    lifecycleStatusId: "",
    location: "",
    url: "",
    description: "",
    owner: "",
    reviewer: "",
    ip_address: "",
  });
  const [subcategories, setSubcategories] = useState<AssetSubcategory[]>([]);
  const [classifications, setClassifications] = useState<AssetClassification[]>(
    []
  );
  const [exposures, setExposures] = useState<AssetExposure[]>([]);
  const [lifecycleStatuses, setLifecycleStatuses] = useState<
    AssetLifecycleStatus[]
  >([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch all dropdown data on mount
  useEffect(() => {
    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen]);

  // Fetch subcategories when categoryId prop changes
  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategoryId: "" }));
    }
  }, [categoryId]);

  const fetchAllData = async () => {
    try {
      setLoadingCategories(true);
      setError(null);

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to view categories");
        setLoadingCategories(false);
        return;
      }

      // For superadmin, use selectedTenantId from GlobalContext
      // For other users, use their tenant_id from user data
      const isSuperAdmin = auth.userData?.role === "superadmin";
      const tenantId = isSuperAdmin
        ? state.selectedTenantId
        : auth.userData?.tenant_id;

      // Fetch all dropdown data in parallel (no need to fetch categories)
      const [
        classificationsResult,
        exposuresResult,
        lifecycleStatusesResult,
        teamsResult,
        usersResult,
      ] = await Promise.all([
        supabase.from("asset_classifications").select("*").order("name"),
        supabase.from("asset_exposures").select("*").order("name"),
        supabase.from("asset_lifecycle_statuses").select("*").order("name"),
        tenantId
          ? supabase
              .from("teams")
              .select("*")
              .eq("tenant_id", tenantId)
              .order("name")
          : Promise.resolve({ data: [], error: null }),
        tenantId
          ? supabase
              .from("users")
              .select("*")
              .eq("tenant_id", tenantId)
              .order("name")
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (classificationsResult.error) {
        console.error(
          "Error fetching classifications:",
          classificationsResult.error
        );
      }

      if (exposuresResult.error) {
        console.error("Error fetching exposures:", exposuresResult.error);
      }

      if (lifecycleStatusesResult.error) {
        console.error(
          "Error fetching lifecycle statuses:",
          lifecycleStatusesResult.error
        );
      }

      if (teamsResult.error) {
        console.error("Error fetching teams:", teamsResult.error);
      }

      if (usersResult.error) {
        console.error("Error fetching users:", usersResult.error);
      }

      setClassifications(classificationsResult.data || []);
      setExposures(exposuresResult.data || []);
      setLifecycleStatuses(lifecycleStatusesResult.data || []);
      setTeams(teamsResult.data || []);
      setUsers(usersResult.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubcategories = async (categoryId: number) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("asset_subcategories")
        .select("*")
        .eq("category_id", categoryId);

      if (fetchError) {
        console.error("Error fetching subcategories:", fetchError);
        setError(
          fetchError.message ||
            "Failed to load subcategories. Please check your permissions."
        );
        return;
      }

      setSubcategories(data || []);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setError("Failed to load subcategories");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!categoryId) {
      setError("Category is required");
      return;
    }

    if (!formData.subcategoryId) {
      setError("Type (Subcategory) is required");
      return;
    }

    if (!formData.classificationId) {
      setError("Sensitivity is required");
      return;
    }

    if (!formData.exposureId) {
      setError("Exposure is required");
      return;
    }

    if (!formData.lifecycleStatusId) {
      setError("Lifecycle Status is required");
      return;
    }

    if (!formData.owner) {
      setError("Owner is required");
      return;
    }

    if (!formData.reviewer) {
      setError("Reviewer is required");
      return;
    }

    // For superadmin, check if tenant is selected
    const isSuperAdmin = auth.userData?.role === "superadmin";
    const tenantId = isSuperAdmin
      ? state.selectedTenantId
      : auth.userData?.tenant_id;

    if (!tenantId) {
      setError(
        isSuperAdmin ? "Please select a tenant" : "User tenant not found"
      );
      return;
    }

    setLoading(true);

    try {
      // Parse owner (format: "team:id" or "user:id")
      let ownerTeamId: string | null = null;
      let ownerUserId: string | null = null;
      if (formData.owner) {
        const [type, id] = formData.owner.split(":");
        if (type === "team") {
          ownerTeamId = id;
        } else if (type === "user") {
          ownerUserId = id;
        }
      }

      // Parse reviewer (format: "team:id" or "user:id")
      let reviewerTeamId: string | null = null;
      let reviewerUserId: string | null = null;
      if (formData.reviewer) {
        const [type, id] = formData.reviewer.split(":");
        if (type === "team") {
          reviewerTeamId = id;
        } else if (type === "user") {
          reviewerUserId = id;
        }
      }

      const assetData: AssetInsert = {
        name: formData.name.trim(),
        category_id: categoryId,
        subcategory_id: formData.subcategoryId
          ? parseInt(formData.subcategoryId)
          : null,
        classification_id: formData.classificationId
          ? parseInt(formData.classificationId)
          : null,
        exposure_id: formData.exposureId ? parseInt(formData.exposureId) : null,
        lifecycle_status_id: formData.lifecycleStatusId
          ? parseInt(formData.lifecycleStatusId)
          : null,
        location: formData.location.trim() || null,
        url: formData.url.trim() || null,
        description: formData.description.trim() || null,
        ip_address: formData.ip_address.trim() || null,
        owner_team_id: ownerTeamId,
        owner_user_id: ownerUserId,
        reviewer_team_id: reviewerTeamId,
        reviewer_user_id: reviewerUserId,
        tenant_id: tenantId,
      };

      const { error: insertError } = await supabase
        .from("assets")
        .insert(assetData);

      if (insertError) {
        setError(insertError.message || "Failed to create asset");
        setLoading(false);
        return;
      }

      // Reset form
      setFormData({
        name: "",
        subcategoryId: "",
        classificationId: "",
        exposureId: "",
        lifecycleStatusId: "",
        location: "",
        url: "",
        description: "",
        owner: "",
        reviewer: "",
        ip_address: "",
      });
      setError(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Create asset error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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

  // Convert arrays to SelectOption format
  const subcategoryOptions: SelectOption[] = useMemo(
    () =>
      subcategories.map((sub) => ({
        value: sub.id.toString(),
        label: sub.name,
      })),
    [subcategories]
  );

  const classificationOptions: SelectOption[] = useMemo(
    () =>
      classifications.map((cls) => ({
        value: cls.id.toString(),
        label: cls.name,
      })),
    [classifications]
  );

  const exposureOptions: SelectOption[] = useMemo(
    () =>
      exposures.map((exp) => ({
        value: exp.id.toString(),
        label: exp.name,
      })),
    [exposures]
  );

  const lifecycleStatusOptions: SelectOption[] = useMemo(
    () =>
      lifecycleStatuses.map((status) => ({
        value: status.id.toString(),
        label: status.name,
      })),
    [lifecycleStatuses]
  );

  // Combined owner options (teams + users)
  const ownerOptions: SelectOption[] = useMemo(() => {
    const teamOptions: SelectOption[] = teams.map((team) => ({
      value: `team:${team.id}`,
      label: `${team.name}`,
    }));

    const userOptions: SelectOption[] = users.map((user) => ({
      value: `user:${user.id}`,
      label: `${user.name}`,
    }));

    return [...teamOptions, ...userOptions];
  }, [teams, users]);

  // Combined reviewer options (teams + users)
  const reviewerOptions: SelectOption[] = useMemo(() => {
    const teamOptions: SelectOption[] = teams.map((team) => ({
      value: `team:${team.id}`,
      label: `${team.name}`,
    }));

    const userOptions: SelectOption[] = users.map((user) => ({
      value: `user:${user.id}`,
      label: `${user.name}`,
    }));

    return [...teamOptions, ...userOptions];
  }, [teams, users]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">
          Create New Asset
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field - Full Width (always shown if in fieldsToInclude) */}
          {filedsToInlcude.includes("name") && (
            <div className="md:col-span-2 flex flex-col gap-1.5">
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
                placeholder="Enter asset name"
              />
            </div>
          )}

          {/* Type (Subcategory) Field */}
          {filedsToInlcude.includes("subcategory_id") && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="subcategoryId"
                className="text-sm font-medium text-text-primary"
              >
                Type <span className="text-failure">*</span>
              </label>
              <CustomSelect
                id="subcategoryId"
                name="subcategoryId"
                options={subcategoryOptions}
                value={formData.subcategoryId}
                onChange={(value) => handleSelectChange("subcategoryId", value)}
                placeholder={
                  !categoryId
                    ? "Category not set"
                    : subcategories.length === 0
                    ? "No subcategories available"
                    : "Select a subcategory"
                }
                isDisabled={!categoryId || subcategories.length === 0}
                isRequired
              />
            </div>
          )}

          {/* Sensitivity (Classification) Field */}
          {filedsToInlcude.includes("classification_id") && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="classificationId"
                className="text-sm font-medium text-text-primary"
              >
                Sensitivity <span className="text-failure">*</span>
              </label>
              <CustomSelect
                id="classificationId"
                name="classificationId"
                options={classificationOptions}
                value={formData.classificationId}
                onChange={(value) =>
                  handleSelectChange("classificationId", value)
                }
                placeholder="Select sensitivity"
                isDisabled={loadingCategories}
                isRequired
              />
            </div>
          )}

          {/* Exposure Field */}
          {filedsToInlcude.includes("exposure_id") && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="exposureId"
                className="text-sm font-medium text-text-primary"
              >
                Exposure <span className="text-failure">*</span>
              </label>
              <CustomSelect
                id="exposureId"
                name="exposureId"
                options={exposureOptions}
                value={formData.exposureId}
                onChange={(value) => handleSelectChange("exposureId", value)}
                placeholder="Select exposure"
                isDisabled={loadingCategories}
                isRequired
              />
            </div>
          )}

          {/* Lifecycle Status Field */}
          {filedsToInlcude.includes("lifecycle_status_id") && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="lifecycleStatusId"
                className="text-sm font-medium text-text-primary"
              >
                Lifecycle Status <span className="text-failure">*</span>
              </label>
              <CustomSelect
                id="lifecycleStatusId"
                name="lifecycleStatusId"
                options={lifecycleStatusOptions}
                value={formData.lifecycleStatusId}
                onChange={(value) =>
                  handleSelectChange("lifecycleStatusId", value)
                }
                placeholder="Select lifecycle status"
                isDisabled={loadingCategories}
                isRequired
              />
            </div>
          )}

          {/* Asset URL Field - Optional */}
          {filedsToInlcude.includes("url") && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="url"
                className="text-sm font-medium text-text-primary"
              >
                Asset URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                placeholder="https://example.com"
              />
            </div>
          )}

          {/* IP Address Field - Optional */}
          {filedsToInlcude.includes("ip_address") && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="ip_address"
                className="text-sm font-medium text-text-primary"
              >
                IP Address
              </label>
              <input
                type="text"
                id="ip_address"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                placeholder="192.168.1.1"
              />
            </div>
          )}

          {/* Owner Field */}
          {(filedsToInlcude.includes("owner_team_id") ||
            filedsToInlcude.includes("owner_user_id")) && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="owner"
                className="text-sm font-medium text-text-primary"
              >
                Owner <span className="text-failure">*</span>
              </label>
              <CustomSelect
                id="owner"
                name="owner"
                options={ownerOptions}
                value={formData.owner}
                onChange={(value) => handleSelectChange("owner", value)}
                placeholder="Select owner"
                isDisabled={loadingCategories}
                isRequired
              />
            </div>
          )}

          {/* Reviewer Field */}
          {(filedsToInlcude.includes("reviewer_team_id") ||
            filedsToInlcude.includes("reviewer_user_id")) && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reviewer"
                className="text-sm font-medium text-text-primary"
              >
                Reviewer <span className="text-failure">*</span>
              </label>
              <CustomSelect
                id="reviewer"
                name="reviewer"
                options={reviewerOptions}
                value={formData.reviewer}
                onChange={(value) => handleSelectChange("reviewer", value)}
                placeholder="Select reviewer"
                isDisabled={loadingCategories}
                isRequired
              />
            </div>
          )}

          {/* Location Field - Optional */}
          {filedsToInlcude.includes("location") && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="location"
                className="text-sm font-medium text-text-primary"
              >
                Location
              </label>
              <textarea
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                rows={3}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
                placeholder="Enter asset location"
              />
            </div>
          )}

          {/* Description Field - Optional */}
          {filedsToInlcude.includes("description") && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="description"
                className="text-sm font-medium text-text-primary"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary resize-none"
                placeholder="Enter asset description"
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
            disabled={loading || loadingCategories}
            className="flex-1 py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Creating..." : "Create Asset"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
