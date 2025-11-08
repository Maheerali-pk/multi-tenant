"use client";

import { useState, useMemo, useEffect } from "react";
import { FilterOption, FilterValues } from "@/app/components/TableFilter";
import { supabase } from "@/lib/supabase";

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
  },
  categoryId,
}: UseAssetFiltersOptions = {}) => {
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
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoadingCategories(true);

        // Fetch all filter data in parallel
        const [
          subcategoriesResult,
          classificationsResult,
          exposuresResult,
          lifecycleStatusesResult,
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

    return options;
  }, [
    includeFilters,
    categoryId,
    filteredSubcategories,
    classifications,
    exposures,
    lifecycleStatuses,
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
