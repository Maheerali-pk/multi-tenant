"use client";

import React from "react";
import Select, {
  StylesConfig,
  GroupBase,
  SingleValue,
  ActionMeta,
} from "react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  name?: string;
  id?: string;
}
const MemoizedSelect = React.memo(
  Select<SelectOption, false, GroupBase<SelectOption>>
);

const getCustomStyles = (
  isDisabled: boolean
): StylesConfig<SelectOption, false, GroupBase<SelectOption>> => ({
  control: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: isDisabled ? "var(--input-disabled-bg)" : "var(--input)",
    borderColor: isDisabled
      ? "var(--input-disabled-border)"
      : state.isFocused
      ? "var(--brand)"
      : "var(--border-hr)",
    borderRadius: "0.5rem",
    padding: 0,
    minHeight: "auto",
    height: "auto",
    fontSize: "0.875rem",
    color: isDisabled ? "var(--input-disabled-text)" : "var(--text-primary)",
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: 1,
    boxShadow: "none",
    borderWidth: "1px",
    transition: "border-color 0.15s ease-in-out",
    "&:hover": {
      borderColor: isDisabled
        ? "var(--input-disabled-border)"
        : state.isFocused
        ? "var(--brand)"
        : "var(--border-hr)",
    },
  }),
  valueContainer: (baseStyles) => ({
    ...baseStyles,
    padding: "0.5rem 0.75rem",
  }),
  input: (baseStyles) => ({
    ...baseStyles,
    margin: 0,
    padding: 0,
    color: isDisabled ? "var(--input-disabled-text)" : "var(--text-primary)",
    fontSize: "0.875rem",
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "var(--bg-inner)",
    border: "1px solid var(--border-hr)",
    borderRadius: "0.5rem",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    zIndex: 9999,
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected
      ? "var(--brand)"
      : state.isFocused
      ? "var(--sidebar-sub-item-hover)"
      : "transparent",
    color: state.isSelected ? "var(--text-contrast)" : "var(--text-primary)",
    fontSize: "0.875rem",
    padding: "0.5rem 0.75rem",
    cursor: "pointer",
    "&:active": {
      backgroundColor: state.isSelected
        ? "var(--brand)"
        : "var(--sidebar-sub-item-hover)",
    },
  }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    color: isDisabled ? "var(--input-disabled-text)" : "var(--text-secondary)",
    fontSize: "0.875rem",
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: isDisabled ? "var(--input-disabled-text)" : "var(--text-primary)",
    fontSize: "0.875rem",
    margin: 0,
  }),
  indicatorsContainer: (baseStyles) => ({
    ...baseStyles,
    color: isDisabled ? "var(--input-disabled-text)" : "var(--text-secondary)",
    padding: 0,
    paddingRight: "0.5rem",
  }),
  indicatorSeparator: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: isDisabled
      ? "var(--input-disabled-border)"
      : "var(--border-hr)",
  }),
  dropdownIndicator: (baseStyles) => ({
    ...baseStyles,
    color: isDisabled ? "var(--input-disabled-text)" : "var(--text-secondary)",
    "&:hover": {
      color: isDisabled ? "var(--input-disabled-text)" : "var(--text-primary)",
    },
  }),
  clearIndicator: (baseStyles) => ({
    ...baseStyles,
    color: isDisabled ? "var(--input-disabled-text)" : "var(--text-secondary)",
    "&:hover": {
      color: isDisabled ? "var(--input-disabled-text)" : "var(--text-primary)",
    },
  }),
});

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isDisabled = false,
  isRequired = false,
  name,
  id,
}) => {
  const selectedOption =
    options.find((option) => option.value === value) || null;

  const handleChange = (
    newValue: SingleValue<SelectOption>,
    actionMeta: ActionMeta<SelectOption>
  ) => {
    if (newValue) {
      onChange(newValue.value);
    } else {
      onChange("");
    }
  };

  return (
    <MemoizedSelect
      id={id}
      name={name}
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable={!isRequired}
      styles={getCustomStyles(isDisabled)}
      classNamePrefix="custom-select"
    />
  );
};

export default CustomSelect;
