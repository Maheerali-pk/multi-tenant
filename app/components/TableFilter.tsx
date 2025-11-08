"use client";

import { useState } from "react";
import { X, Filter } from "lucide-react";

export type AssetFilterKey =
  | "name"
  | "subcategory"
  | "sensitivity"
  | "exposure"
  | "status";

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
  sensitivity?: string;
  exposure?: string;
  status?: string;
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
      sensitivity: "",
      exposure: "",
      status: "",
    };
    onChange(clearedValues);
    onClear?.();
  };

  const handleClearSingle = (key: AssetFilterKey) => {
    handleFilterChange(key, "");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
            hasActiveFilters
              ? "bg-brand text-text-contrast border-brand"
              : "bg-bg-inner text-text-primary border-border-main hover:bg-sidebar-sub-item-hover"
          }`}
        >
          <Filter size={14} />
          <span className="text-xs font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-text-contrast text-brand rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
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
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sidebar-sub-item-hover border border-border-hr"
                >
                  <span className="text-[10px] text-text-secondary font-medium">
                    {filter.label}:
                  </span>
                  <span className="text-[10px] text-text-primary font-medium">
                    {displayValue}
                  </span>
                  <button
                    onClick={() => handleClearSingle(filter.key)}
                    className="p-0.5 hover:bg-bg-inner rounded transition-colors cursor-pointer"
                    aria-label={`Clear ${filter.label} filter`}
                  >
                    <X size={10} className="text-text-secondary" />
                  </button>
                </div>
              );
            })}

            {/* Clear All Button */}
            <button
              onClick={handleClear}
              className="px-2 py-1 text-[10px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Expanded Filter Panel - Absolute positioned, opens to the left */}
      {isExpanded && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />
          <div className="absolute top-full right-0 mt-2 z-50 flex flex-col gap-3 p-4 rounded-xl bg-bg-inner border border-table-border shadow-2xl min-w-[450px] max-w-[600px]">
            {/* Header with close button */}
            <div className="flex items-center justify-between pb-2 border-b border-border-hr">
              <h3 className="text-sm font-semibold text-text-primary">
                Filter Options
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 hover:bg-sidebar-sub-item-hover rounded-lg transition-colors cursor-pointer"
                aria-label="Close filters"
              >
                <X size={16} className="text-text-secondary" />
              </button>
            </div>

            {/* Filter inputs */}
            <div className="flex flex-wrap gap-4">
              {filters.map((filter) => (
                <div
                  key={filter.key}
                  className="flex flex-col gap-2 min-w-[200px] flex-1"
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
                      className="px-3 py-2.5 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                    />
                  ) : filter.type === "select" ? (
                    <select
                      value={values[filter.key] || ""}
                      onChange={(e) =>
                        handleFilterChange(filter.key, e.target.value)
                      }
                      className="px-3 py-2.5 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors cursor-pointer"
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
          </div>
        </>
      )}
    </div>
  );
}

export default TableFilter;
