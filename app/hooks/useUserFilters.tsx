"use client";

import { useState, useMemo, useEffect } from "react";
import { FilterOption, FilterValues } from "@/app/components/table-filter";
import { supabase } from "@/lib/supabase";

interface UseUserFiltersOptions {
  includeFilters?: {
    role?: boolean;
    tenant?: boolean;
    title?: boolean;
  };
}

export const useUserFilters = ({
  includeFilters = {
    role: true,
    tenant: true,
    title: true,
  },
}: UseUserFiltersOptions = {}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoadingFilters(true);

        // Fetch tenants if tenant filter is included
        if (includeFilters.tenant) {
          const { data: tenantsData, error: tenantsError } = await supabase
            .from("tenants")
            .select("id, name")
            .order("name");

          if (tenantsError) {
            console.error("Error fetching tenants for filters:", tenantsError);
          } else {
            setTenants(tenantsData || []);
          }
        }
      } catch (err) {
        console.error("Error fetching filter data:", err);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilterData();
  }, [includeFilters.tenant]);

  // Build filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    const options: FilterOption[] = [];

    if (includeFilters.role) {
      options.push({
        key: "role",
        label: "Role",
        type: "select",
        options: [
          { value: "superadmin", label: "Super Admin" },
          { value: "tenant_admin", label: "Tenant Admin" },
          { value: "tenant_user", label: "Tenant User" },
        ],
      });
    }

    if (includeFilters.tenant && tenants.length > 0) {
      options.push({
        key: "tenant",
        label: "Tenant",
        type: "select",
        options: tenants.map((tenant) => ({
          value: tenant.id,
          label: tenant.name,
        })),
      });
    }

    if (includeFilters.title) {
      options.push({
        key: "title",
        label: "Title",
        type: "text",
        placeholder: "Search by title...",
      });
    }

    return options;
  }, [includeFilters, tenants]);

  return {
    filterValues,
    setFilterValues,
    filterOptions,
    loadingFilters,
  };
};
