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
  };
  categoryId?: number; // Category ID to filter subcategories
}

export const useAssetFilters = ({
  includeFilters = {
    name: true,
    subcategory: true,
  },
  categoryId,
}: UseAssetFiltersOptions = {}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch subcategories
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoadingCategories(true);

        // Fetch all subcategories
        const { data: subcategoriesData, error: subcategoriesError } =
          await supabase
            .from("asset_subcategories")
            .select("id, name, category_id")
            .order("name");

        if (subcategoriesError) {
          console.error(
            "Error fetching subcategories for filters:",
            subcategoriesError
          );
        } else {
          setSubcategories(subcategoriesData || []);
        }
      } catch (err) {
        console.error("Error fetching filter data:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchFilterData();
  }, []);

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

    return options;
  }, [includeFilters, categoryId, filteredSubcategories]);

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
