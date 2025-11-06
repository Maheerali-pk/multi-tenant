"use client";

import { useState, useMemo } from "react";
import { FilterOption, FilterValues } from "@/app/components/TableFilter";
import { ExampleTable1Row } from "@/app/helpers/data";

interface UseAssetsTableFilterOptions {
  data: ExampleTable1Row[];
  includeFilters?: {
    name?: boolean;
    type?: boolean;
    status?: boolean;
    owner?: boolean;
    exposure?: boolean;
    location?: boolean;
  };
}

export const useAssetsTableFilter = ({
  data,
  includeFilters = {
    name: true,
    type: true,
    status: true,
    owner: true,
    exposure: false,
    location: false,
  },
}: UseAssetsTableFilterOptions) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Get unique values for select options from the data
  const uniqueTypes = useMemo(() => {
    if (!includeFilters.type) return [];
    const types = new Set(data.map((row) => row.type));
    return Array.from(types)
      .sort()
      .map((type) => ({ value: type, label: type }));
  }, [data, includeFilters.type]);

  const uniqueStatuses = useMemo(() => {
    if (!includeFilters.status) return [];
    const statuses = new Set(data.map((row) => row.status));
    return Array.from(statuses)
      .sort()
      .map((status) => ({ value: status, label: status }));
  }, [data, includeFilters.status]);

  const uniqueExposures = useMemo(() => {
    if (!includeFilters.exposure) return [];
    const exposures = new Set(
      data.map((row) => row.exposure).filter((exp) => exp)
    );
    return Array.from(exposures)
      .sort()
      .map((exp) => ({ value: exp, label: exp }));
  }, [data, includeFilters.exposure]);

  const uniqueLocations = useMemo(() => {
    if (!includeFilters.location) return [];
    const locations = new Set(
      data.map((row) => row.location).filter((loc) => loc && loc !== "-")
    );
    return Array.from(locations)
      .sort()
      .map((loc) => ({ value: loc, label: loc }));
  }, [data, includeFilters.location]);

  // Build filter options based on what's included
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

    if (includeFilters.type && uniqueTypes.length > 0) {
      options.push({
        key: "type",
        label: "Type",
        type: "select",
        options: uniqueTypes,
      });
    }

    if (includeFilters.status && uniqueStatuses.length > 0) {
      options.push({
        key: "status",
        label: "Status",
        type: "select",
        options: uniqueStatuses,
      });
    }

    if (includeFilters.owner) {
      options.push({
        key: "owner",
        label: "Owner",
        type: "text",
        placeholder: "Filter by owner...",
      });
    }

    if (includeFilters.exposure && uniqueExposures.length > 0) {
      options.push({
        key: "exposure",
        label: "Exposure",
        type: "select",
      });
    }

    if (includeFilters.location && uniqueLocations.length > 0) {
      options.push({
        key: "location",
        label: "Location",
        type: "select",
      });
    }

    return options;
  }, [
    includeFilters,
    uniqueTypes,
    uniqueStatuses,
    uniqueExposures,
    uniqueLocations,
  ]);

  return {
    filterValues,
    setFilterValues,
    filterOptions,
  };
};
