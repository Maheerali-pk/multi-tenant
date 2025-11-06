"use client";
import { useMemo } from "react";
import Table, { TableColumn } from "./Table";
import { ExampleTable1, ExampleTable1Row } from "../helpers/data";
import { FilterValues } from "./TableFilter";

interface AssetsTableProps {
  data?: ExampleTable1Row[];
  onEdit?: (row: ExampleTable1Row) => void;
  onDelete?: (row: ExampleTable1Row) => void;
  filterValues?: FilterValues;
  searchValue?: string; // Keep search for backward compatibility
}

// Example usage - you can customize columns and data as needed
const AssetsTable: React.FC<AssetsTableProps> = ({
  data,
  onEdit,
  onDelete,
  filterValues = {},
  searchValue = "",
}) => {
  // Example columns - customize based on your data structure
  const columns: TableColumn<ExampleTable1Row>[] = [
    {
      key: "name",
      header: "Name",
    },
    {
      key: "type",
      header: "Type",
    },
    {
      key: "owner",
      header: "Owner",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "Active"
              ? "bg-success-light text-success"
              : row.status === "Rejected"
              ? "bg-failure-light text-failure"
              : "bg-blue-light text-blue"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  // Use provided data or fallback to ExampleTable1
  const tableData = data && data.length > 0 ? data : ExampleTable1;

  // Default handlers - placeholder functions if not provided
  const handleEdit =
    onEdit ||
    ((row: ExampleTable1Row) => {
      console.log("Edit action triggered for:", row);
      // TODO: Implement edit functionality
    });

  const handleDelete =
    onDelete ||
    ((row: ExampleTable1Row) => {
      console.log("Delete action triggered for:", row);
      // TODO: Implement delete functionality
    });

  // Apply filters
  const filteredData = useMemo(() => {
    let result = [...tableData];

    // Apply search (name filter)
    const searchFilter = filterValues.name || searchValue;
    if (searchFilter && searchFilter.trim() !== "") {
      result = result.filter((row) =>
        row.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Apply type filter
    if (filterValues.type && filterValues.type.trim() !== "") {
      result = result.filter((row) => row.type === filterValues.type);
    }

    // Apply owner filter
    if (filterValues.owner && filterValues.owner.trim() !== "") {
      result = result.filter((row) =>
        row.owner.toLowerCase().includes(filterValues.owner!.toLowerCase())
      );
    }

    // Apply status filter
    if (filterValues.status && filterValues.status.trim() !== "") {
      result = result.filter((row) => row.status === filterValues.status);
    }

    // Apply exposure filter
    if (filterValues.exposure && filterValues.exposure.trim() !== "") {
      result = result.filter((row) => row.exposure === filterValues.exposure);
    }

    // Apply location filter
    if (filterValues.location && filterValues.location.trim() !== "") {
      result = result.filter((row) =>
        row.location?.toLowerCase().includes(filterValues.location!.toLowerCase())
      );
    }

    return result;
  }, [tableData, filterValues, searchValue]);

  return (
    <Table
      columns={columns}
      rows={filteredData}
      onEdit={handleEdit}
      onDelete={handleDelete}
      getRowKey={(row) => row.id}
    />
  );
};

export default AssetsTable;
