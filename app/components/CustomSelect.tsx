"use client";

import React from "react";
import Select, { StylesConfig, GroupBase, SingleValue, ActionMeta } from "react-select";

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

const customStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: "var(--input)",
    borderColor: state.isFocused ? "var(--brand)" : "var(--border-hr)",
    borderRadius: "0.5rem",
    padding: "0.25rem 0.5rem",
    minHeight: "2.5rem",
    fontSize: "0.875rem",
    color: "var(--text-primary)",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    opacity: state.isDisabled ? 0.5 : 1,
    boxShadow: state.isFocused
      ? "0 0 0 2px var(--brand)"
      : "none",
    "&:hover": {
      borderColor: state.isFocused ? "var(--brand)" : "var(--border-hr)",
    },
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "var(--bg-inner)",
    border: "1px solid var(--border-hr)",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    zIndex: 9999,
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected
      ? "var(--brand)"
      : state.isFocused
      ? "var(--sidebar-sub-item-hover)"
      : "transparent",
    color: state.isSelected
      ? "var(--text-contrast)"
      : "var(--text-primary)",
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
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: "var(--text-primary)",
    fontSize: "0.875rem",
  }),
  input: (baseStyles) => ({
    ...baseStyles,
    color: "var(--text-primary)",
    fontSize: "0.875rem",
  }),
  indicatorsContainer: (baseStyles) => ({
    ...baseStyles,
    color: "var(--text-secondary)",
  }),
  indicatorSeparator: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "var(--border-hr)",
  }),
  dropdownIndicator: (baseStyles) => ({
    ...baseStyles,
    color: "var(--text-secondary)",
    "&:hover": {
      color: "var(--text-primary)",
    },
  }),
  clearIndicator: (baseStyles) => ({
    ...baseStyles,
    color: "var(--text-secondary)",
    "&:hover": {
      color: "var(--text-primary)",
    },
  }),
};

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
  const selectedOption = options.find((option) => option.value === value) || null;

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
    <Select<SelectOption, false, GroupBase<SelectOption>>
      id={id}
      name={name}
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable={!isRequired}
      styles={customStyles}
      classNamePrefix="custom-select"
    />
  );
};

export default CustomSelect;

