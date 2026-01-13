"use client";

import { useState, useMemo, useEffect } from "react";
import { FilterOption, FilterValues } from "@/app/components/table-filter";
import { countries } from "@/app/helpers/countries";

interface UseTenantFiltersOptions {
  includeFilters?: {
    status?: boolean;
    country?: boolean;
    contact_name?: boolean;
  };
}

export const useTenantFilters = ({
  includeFilters = {
    status: true,
    country: true,
    contact_name: true,
  },
}: UseTenantFiltersOptions = {}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Build filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    const options: FilterOption[] = [];

    if (includeFilters.status) {
      options.push({
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "disabled", label: "Disabled" },
        ],
      });
    }

    if (includeFilters.country) {
      options.push({
        key: "country",
        label: "Country",
        type: "select",
        options: countries.map((country) => ({
          value: country.code,
          label: country.name,
        })),
      });
    }

    if (includeFilters.contact_name) {
      options.push({
        key: "contact_name",
        label: "Contact Name",
        type: "text",
        placeholder: "Search by contact name...",
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

