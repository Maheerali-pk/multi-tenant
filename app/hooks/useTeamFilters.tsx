"use client";

import { useState, useMemo } from "react";
import { FilterOption, FilterValues } from "@/app/components/TableFilter";

interface UseTeamFiltersOptions {
  includeFilters?: {
    email?: boolean;
  };
}

export const useTeamFilters = ({
  includeFilters = {
    email: true,
  },
}: UseTeamFiltersOptions = {}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Build filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    const options: FilterOption[] = [];

    if (includeFilters.email) {
      options.push({
        key: "email",
        label: "Email",
        type: "text",
        placeholder: "Search by email...",
      });
    }

    return options;
  }, [includeFilters]);

  return {
    filterValues,
    setFilterValues,
    filterOptions,
  };
};

