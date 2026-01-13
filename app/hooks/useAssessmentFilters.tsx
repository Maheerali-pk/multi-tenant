"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { FilterValues, FilterOption } from "@/app/components/table-filter";
import { Tables } from "@/app/types/database.types";

type AssessmentStatus = Tables<"assessment_statuses">;
type Tenant = Tables<"tenants">;

interface UseAssessmentFiltersProps {
  includeFilters?: {
    name?: boolean;
    status?: boolean;
    tenant?: boolean;
    version?: boolean;
  };
}

export const useAssessmentFilters = ({
  includeFilters = {
    name: true,
    status: true,
    tenant: true,
    version: true,
  },
}: UseAssessmentFiltersProps = {}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [statusOptions, setStatusOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [tenantOptions, setTenantOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Fetch status options
  const fetchStatusOptions = useCallback(async () => {
    const { data, error } = await supabase
      .from("assessment_statuses")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching assessment statuses:", error);
      return;
    }

    if (data) {
      setStatusOptions(
        data.map((status) => ({
          value: status.name,
          label: status.name,
        }))
      );
    }
  }, []);

  // Fetch tenant options
  const fetchTenantOptions = useCallback(async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching tenants:", error);
      return;
    }

    if (data) {
      setTenantOptions(
        data.map((tenant) => ({
          value: tenant.id,
          label: tenant.name,
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (includeFilters.status) {
      fetchStatusOptions();
    }
    if (includeFilters.tenant) {
      fetchTenantOptions();
    }
  }, [
    includeFilters.status,
    includeFilters.tenant,
    fetchStatusOptions,
    fetchTenantOptions,
  ]);

  const filterOptions: FilterOption[] = [];

  if (includeFilters.name) {
    filterOptions.push({
      key: "name",
      label: "Name",
      type: "text",
      placeholder: "Filter by name",
    });
  }

  if (includeFilters.status) {
    filterOptions.push({
      key: "status",
      label: "Status",
      type: "select",
      options: statusOptions,
    });
  }

  if (includeFilters.tenant) {
    filterOptions.push({
      key: "tenant",
      label: "Tenant",
      type: "select",
      options: tenantOptions,
    });
  }

  if (includeFilters.version) {
    filterOptions.push({
      key: "version",
      label: "Version",
      type: "text",
      placeholder: "Filter by version",
    });
  }

  return {
    filterValues,
    setFilterValues,
    filterOptions,
  };
};
