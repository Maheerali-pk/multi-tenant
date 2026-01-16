"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FilterOption, FilterValues, AssetFilterKey } from "@/app/components/table-filter";

interface UseAssessmentItemFiltersProps {
  includeFilters?: {
    title?: boolean;
    category?: boolean;
    required?: boolean;
    is_active?: boolean;
  };
}

export const useAssessmentItemFilters = ({
  includeFilters = {
    title: true,
    category: true,
    required: true,
    is_active: true,
  },
}: UseAssessmentItemFiltersProps = {}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [categoryOptions, setCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Fetch unique categories from assessment items
  const fetchCategoryOptions = useCallback(async () => {
    const { data, error } = await supabase
      .from("assessment_items")
      .select("category")
      .not("category", "is", null);

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    if (data) {
      const uniqueCategories = [
        ...new Set(data.map((item) => item.category).filter(Boolean)),
      ];
      setCategoryOptions(
        uniqueCategories.map((cat) => ({
          value: cat as string,
          label: cat as string,
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (includeFilters.category) {
      fetchCategoryOptions();
    }
  }, [includeFilters.category, fetchCategoryOptions]);

  const filterOptions: FilterOption[] = [];

  if (includeFilters.title) {
    filterOptions.push({
      key: "title",
      label: "Title",
      type: "text",
      placeholder: "Filter by title",
    });
  }

  if (includeFilters.category) {
    filterOptions.push({
      key: "category",
      label: "Category",
      type: "select",
      options: categoryOptions,
    });
  }

  if (includeFilters.required) {
    filterOptions.push({
      key: "required",
      label: "Required",
      type: "select",
      options: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    });
  }

  if (includeFilters.is_active) {
    filterOptions.push({
      key: "is_active",
      label: "Active",
      type: "select",
      options: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    });
  }

  return {
    filterValues,
    setFilterValues,
    filterOptions,
  };
};
