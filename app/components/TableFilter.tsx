"use client";

import { useState } from "react";
import { X, Filter } from "lucide-react";

export type AssetFilterKey = "name" | "subcategory";

export interface FilterOption {
  key: AssetFilterKey;
  label: string;
  type: "text" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[]; // For select type
}

export interface FilterValues {
  name?: string;
  subcategory?: string;
}

interface TableFilterProps {
  filters: FilterOption[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onClear?: () => void;
}

function TableFilter({ filters, values, onChange, onClear }: TableFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters = Object.values(values).some(
    (value) => value && value.trim() !== ""
  );

  const handleFilterChange = (key: AssetFilterKey, value: string) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  const handleClear = () => {
    const clearedValues: FilterValues = {
      name: "",
      subcategory: "",
    };
    onChange(clearedValues);
    onClear?.();
  };

  const handleClearSingle = (key: AssetFilterKey) => {
    handleFilterChange(key, "");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors cursor-pointer ${
            hasActiveFilters
              ? "bg-brand text-text-contrast border-brand"
              : "bg-bg-inner text-text-primary border-border-main hover:bg-sidebar-sub-item-hover"
          }`}
        >
          <Filter size={16} />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-text-contrast text-brand rounded-full px-2 py-0.5 text-xs font-semibold">
              {Object.values(values).filter((v) => v && v.trim() !== "").length}
            </span>
          )}
        </button>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <>
            {filters.map((filter) => {
              const value = values[filter.key];
              if (!value || value.trim() === "") return null;

              let displayValue = value;
              if (filter.type === "select" && filter.options) {
                const option = filter.options.find(
                  (opt) => opt.value === value
                );
                displayValue = option?.label || value;
              }

              return (
                <div
                  key={filter.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sidebar-sub-item-hover border border-border-hr"
                >
                  <span className="text-xs text-text-secondary font-medium">
                    {filter.label}:
                  </span>
                  <span className="text-xs text-text-primary font-medium">
                    {displayValue}
                  </span>
                  <button
                    onClick={() => handleClearSingle(filter.key)}
                    className="p-0.5 hover:bg-bg-inner rounded transition-colors cursor-pointer"
                    aria-label={`Clear ${filter.label} filter`}
                  >
                    <X size={12} className="text-text-secondary" />
                  </button>
                </div>
              );
            })}

            {/* Clear All Button */}
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-bg-inner border border-border-hr">
          {filters.map((filter) => (
            <div
              key={filter.key}
              className="flex flex-col gap-1.5 min-w-[200px]"
            >
              <label className="text-xs font-medium text-text-secondary">
                {filter.label}
              </label>
              {filter.type === "text" ? (
                <input
                  type="text"
                  placeholder={
                    filter.placeholder || `Filter by ${filter.label}`
                  }
                  value={values[filter.key] || ""}
                  onChange={(e) =>
                    handleFilterChange(filter.key, e.target.value)
                  }
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                />
              ) : filter.type === "select" ? (
                <select
                  value={values[filter.key] || ""}
                  onChange={(e) =>
                    handleFilterChange(filter.key, e.target.value)
                  }
                  className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors cursor-pointer"
                >
                  <option value="">All {filter.label}</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TableFilter;
