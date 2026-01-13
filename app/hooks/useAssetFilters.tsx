"use client";

import { useState, useMemo, useEffect } from "react";
import { FilterOption, FilterValues } from "@/app/components/table-filter";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

interface SubcategoryOption {
  id: number;
  name: string;
  category_id: number;
}

interface UseAssetFiltersOptions {
  includeFilters?: {
    name?: boolean;
    subcategory?: boolean;
    sensitivity?: boolean;
    exposure?: boolean;
    status?: boolean;
    owner?: boolean;
    reviewer?: boolean;
  };
  categoryId?: number; // Category ID to filter subcategories
}

export const useAssetFilters = ({
  includeFilters = {
    name: true,
    subcategory: true,
    sensitivity: true,
    exposure: true,
    status: true,
    owner: true,
    reviewer: true,
  },
  categoryId,
}: UseAssetFiltersOptions = {}) => {
  const [auth] = useAuthContext();
  const [state] = useGlobalContext();
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [classifications, setClassifications] = useState<
    { id: number; name: string }[]
  >([]);
  const [exposures, setExposures] = useState<{ id: number; name: string }[]>(
    []
  );
  const [lifecycleStatuses, setLifecycleStatuses] = useState<
    { id: number; name: string }[]
  >([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoadingCategories(true);

        // For superadmin, use selectedTenantId from GlobalContext
        // For other users, use their tenant_id from user data
        const isSuperAdmin = auth.userData?.role === "superadmin";
        const tenantId = isSuperAdmin
          ? state.selectedTenantId
          : auth.userData?.tenant_id;

        // Fetch all filter data in parallel
        const [
          subcategoriesResult,
          classificationsResult,
          exposuresResult,
          lifecycleStatusesResult,
          teamsResult,
          usersResult,
        ] = await Promise.all([
          supabase
            .from("asset_subcategories")
            .select("id, name, category_id")
            .order("name"),
          includeFilters.sensitivity
            ? supabase
                .from("asset_classifications")
                .select("id, name")
                .order("name")
            : Promise.resolve({ data: [], error: null }),
          includeFilters.exposure
            ? supabase.from("asset_exposures").select("id, name").order("name")
            : Promise.resolve({ data: [], error: null }),
          includeFilters.status
            ? supabase
                .from("asset_lifecycle_statuses")
                .select("id, name")
                .order("name")
            : Promise.resolve({ data: [], error: null }),
          includeFilters.owner || includeFilters.reviewer
            ? tenantId
              ? supabase
                  .from("teams")
                  .select("id, name")
                  .eq("tenant_id", tenantId)
                  .order("name")
              : Promise.resolve({ data: [], error: null })
            : Promise.resolve({ data: [], error: null }),
          includeFilters.owner || includeFilters.reviewer
            ? tenantId
              ? supabase
                  .from("users")
                  .select("id, name")
                  .eq("tenant_id", tenantId)
                  .order("name")
              : Promise.resolve({ data: [], error: null })
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (subcategoriesResult.error) {
          console.error(
            "Error fetching subcategories for filters:",
            subcategoriesResult.error
          );
        } else {
          setSubcategories(subcategoriesResult.data || []);
        }

        if (classificationsResult.error) {
          console.error(
            "Error fetching classifications for filters:",
            classificationsResult.error
          );
        } else {
          setClassifications(classificationsResult.data || []);
        }

        if (exposuresResult.error) {
          console.error(
            "Error fetching exposures for filters:",
            exposuresResult.error
          );
        } else {
          setExposures(exposuresResult.data || []);
        }

        if (lifecycleStatusesResult.error) {
          console.error(
            "Error fetching lifecycle statuses for filters:",
            lifecycleStatusesResult.error
          );
        } else {
          setLifecycleStatuses(lifecycleStatusesResult.data || []);
        }

        if (teamsResult.error) {
          console.error("Error fetching teams for filters:", teamsResult.error);
        } else {
          setTeams(teamsResult.data || []);
        }

        if (usersResult.error) {
          console.error("Error fetching users for filters:", usersResult.error);
        } else {
          setUsers(usersResult.data || []);
        }
      } catch (err) {
        console.error("Error fetching filter data:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchFilterData();
  }, [
    includeFilters.sensitivity,
    includeFilters.exposure,
    includeFilters.status,
    includeFilters.owner,
    includeFilters.reviewer,
    auth.userData?.role,
    auth.userData?.tenant_id,
    state.selectedTenantId,
  ]);

  // Get subcategories filtered by categoryId
  const filteredSubcategories = useMemo(() => {
    if (!categoryId) {
      return [];
    }
    return subcategories
      .filter((sub) => sub.category_id === categoryId)
      .map((sub) => ({ value: sub.id.toString(), label: sub.name }));
  }, [subcategories, categoryId]);

  // Build filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    const options: FilterOption[] = [];

    if (includeFilters.name) {
      options.push({
        key: "name",
        label: "Name",
        type: "text",
        placeholder: "Search by name...",
      });
    }

    if (
      includeFilters.subcategory &&
      categoryId &&
      filteredSubcategories.length > 0
    ) {
      options.push({
        key: "subcategory",
        label: "Subcategory",
        type: "select",
        options: filteredSubcategories,
      });
    }

    if (includeFilters.sensitivity && classifications.length > 0) {
      options.push({
        key: "sensitivity",
        label: "Sensitivity",
        type: "select",
        options: classifications.map((cls) => ({
          value: cls.name,
          label: cls.name,
        })),
      });
    }

    if (includeFilters.exposure && exposures.length > 0) {
      options.push({
        key: "exposure",
        label: "Exposure",
        type: "select",
        options: exposures.map((exp) => ({
          value: exp.name,
          label: exp.name,
        })),
      });
    }

    if (includeFilters.status && lifecycleStatuses.length > 0) {
      options.push({
        key: "status",
        label: "Status",
        type: "select",
        options: lifecycleStatuses.map((status) => ({
          value: status.name,
          label: status.name,
        })),
      });
    }

    if (includeFilters.owner && (teams.length > 0 || users.length > 0)) {
      // Combine teams and users for owner filter
      const ownerOptions: { value: string; label: string }[] = [];
      teams.forEach((team) => {
        ownerOptions.push({ value: team.name, label: team.name });
      });
      users.forEach((user) => {
        // Only add if not already in the list (avoid duplicates)
        if (!ownerOptions.find((opt) => opt.value === user.name)) {
          ownerOptions.push({ value: user.name, label: user.name });
        }
      });

      if (ownerOptions.length > 0) {
        options.push({
          key: "owner",
          label: "Owner",
          type: "select",
          options: ownerOptions.sort((a, b) => a.label.localeCompare(b.label)),
        });
      }
    }

    if (includeFilters.reviewer && (teams.length > 0 || users.length > 0)) {
      // Combine teams and users for reviewer filter
      const reviewerOptions: { value: string; label: string }[] = [];
      teams.forEach((team) => {
        reviewerOptions.push({ value: team.name, label: team.name });
      });
      users.forEach((user) => {
        // Only add if not already in the list (avoid duplicates)
        if (!reviewerOptions.find((opt) => opt.value === user.name)) {
          reviewerOptions.push({ value: user.name, label: user.name });
        }
      });

      if (reviewerOptions.length > 0) {
        options.push({
          key: "reviewer",
          label: "Reviewer",
          type: "select",
          options: reviewerOptions.sort((a, b) =>
            a.label.localeCompare(b.label)
          ),
        });
      }
    }

    return options;
  }, [
    includeFilters,
    categoryId,
    filteredSubcategories,
    classifications,
    exposures,
    lifecycleStatuses,
    teams,
    users,
  ]);

  // Reset subcategory when categoryId changes
  useEffect(() => {
    if (categoryId && filterValues.subcategory) {
      // Check if the selected subcategory belongs to the current categoryId
      const subcategoryId = parseInt(filterValues.subcategory);
      const subcategory = subcategories.find((sub) => sub.id === subcategoryId);

      if (subcategory && subcategory.category_id !== categoryId) {
        // Subcategory doesn't belong to current category, reset it
        setFilterValues((prev) => ({
          ...prev,
          subcategory: "",
        }));
      }
    } else if (!categoryId && filterValues.subcategory) {
      // Category cleared, clear subcategory too
      setFilterValues((prev) => ({
        ...prev,
        subcategory: "",
      }));
    }
  }, [categoryId, subcategories, filterValues.subcategory]);

  return {
    filterValues,
    setFilterValues,
    filterOptions,
    loadingCategories,
  };
};
