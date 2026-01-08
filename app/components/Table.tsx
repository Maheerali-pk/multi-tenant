"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Tooltip from "./Tooltip";

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string; // Optional key to use for sorting if different from column key
  customSort?: (a: any, b: any, direction: "asc" | "desc") => number; // Custom sort function
  width?: string; // Optional width for the column (e.g., "200px", "20%", "1fr")
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  customActions?: (row: T) => React.ReactNode;
  getRowKey?: (row: T) => string | number;
  itemsPerPage?: number;
}

function Table<T extends Record<string, any>>({
  columns,
  rows,
  onEdit,
  onDelete,
  customActions,
  getRowKey,
  itemsPerPage = 10,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(itemsPerPage);
  const [dynamicRowsPerPage, setDynamicRowsPerPage] = useState<number | null>(
    null
  );
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);

  const hasActions =
    onEdit !== undefined ||
    onDelete !== undefined ||
    customActions !== undefined;

  // Calculate available height and determine rows per page dynamically
  const calculateRowsPerPage = useCallback(() => {
    if (
      !tableContainerRef.current ||
      !headerRef.current ||
      !paginationRef.current
    ) {
      return null;
    }

    const containerHeight = tableContainerRef.current.clientHeight;
    const headerHeight = headerRef.current.clientHeight;
    const paginationHeight = paginationRef.current.clientHeight;

    // Available height for rows = total container height - header - pagination
    const availableHeight = containerHeight - headerHeight - paginationHeight;

    // Measure row height if we have a reference row
    let rowHeight = 32; // Default estimated row height (py-1 = 4px top + 4px bottom + content)

    if (rowRef.current) {
      rowHeight = rowRef.current.clientHeight;
    } else if (tableBodyRef.current && tableBodyRef.current.rows.length > 0) {
      // Try to get height from first rendered row
      const firstRow = tableBodyRef.current.rows[0];
      if (firstRow) {
        rowHeight = firstRow.clientHeight;
      }
    }

    // Calculate how many rows can fit (with some buffer)
    const calculatedRows = Math.floor(availableHeight / rowHeight);

    // Ensure minimum of 1 row, but use calculated value if positive
    return calculatedRows > 0 ? calculatedRows : 1;
  }, []);

  // Update dynamic rows per page when container size changes
  useEffect(() => {
    const updateRowsPerPage = () => {
      const calculated = calculateRowsPerPage();
      if (calculated !== null) {
        setDynamicRowsPerPage(calculated);
      }
    };

    // Initial calculation
    updateRowsPerPage();

    // Use ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateRowsPerPage();
    });

    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
    }

    // Also listen to window resize
    window.addEventListener("resize", updateRowsPerPage);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateRowsPerPage);
    };
  }, [calculateRowsPerPage, rows.length]);

  // Use dynamic rows per page if available, otherwise use manual rowsPerPage
  const effectiveRowsPerPage = dynamicRowsPerPage ?? rowsPerPage;

  // Get raw value for sorting
  const getSortValue = useCallback((row: T, column: TableColumn<T>): any => {
    const sortColumnKey = column.sortKey || column.key;
    // Try to get the raw value from the row
    const rawValue = row[sortColumnKey];

    // If we have an accessor but need the raw value, try to get it
    // For now, we'll use the raw value from the row
    return rawValue;
  }, []);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortKey) {
      return rows;
    }

    const column = columns.find((col) => col.key === sortKey);
    if (!column) {
      return rows;
    }

    // Check if column is sortable (default to true if not specified)
    if (column.sortable === false) {
      return rows;
    }

    return [...rows].sort((a, b) => {
      const aValue = getSortValue(a, column);
      const bValue = getSortValue(b, column);

      // Use custom sort function if provided
      if (column.customSort) {
        return column.customSort(aValue, bValue, sortDirection);
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Handle strings
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (aString < bString) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aString > bString) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [rows, sortKey, sortDirection, columns, getSortValue]);

  // Calculate pagination based on sorted rows
  const hasPagination =
    effectiveRowsPerPage > 0 && sortedRows.length > effectiveRowsPerPage;
  const totalPages = hasPagination
    ? Math.ceil(sortedRows.length / effectiveRowsPerPage)
    : 1;

  // Reset to first page when rows per page changes or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveRowsPerPage, sortKey, sortDirection]);

  // Reset to first page if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Get paginated rows from sorted data
  const paginatedRows = useMemo(() => {
    if (!hasPagination) {
      return sortedRows;
    }
    const startIndex = (currentPage - 1) * effectiveRowsPerPage;
    const endIndex = startIndex + effectiveRowsPerPage;
    return sortedRows.slice(startIndex, endIndex);
  }, [sortedRows, currentPage, effectiveRowsPerPage, hasPagination]);

  // Default key getter - uses index if no key provided
  const getKey = (row: T, index: number): string | number => {
    if (getRowKey) {
      return getRowKey(row);
    }
    // Try to find an 'id' field, otherwise use index
    return row.id ?? row._id ?? index;
  };

  const getCellValue = (row: T, column: TableColumn<T>): React.ReactNode => {
    if (column.render) {
      return column.render(row);
    }
    if (column.accessor) {
      return column.accessor(row);
    }
    // Fallback to accessing the property directly
    return row[column.key] ?? "";
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      // Calculate start and end of middle pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start or end
      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push("...");
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setDynamicRowsPerPage(null); // Disable dynamic pagination when manually set
  };

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column || column.sortable === false) {
      return;
    }

    if (sortKey === columnKey) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column and default to ascending
      setSortKey(columnKey);
      setSortDirection("asc");
    }
  };

  const startItem = hasPagination
    ? (currentPage - 1) * effectiveRowsPerPage + 1
    : 1;
  const endItem = hasPagination
    ? Math.min(currentPage * effectiveRowsPerPage, sortedRows.length)
    : sortedRows.length;

  // Calculate column widths for fixed table layout
  // With table-layout: fixed, we need explicit widths to prevent resizing
  const totalDataColumns = columns.length;

  // Calculate width for columns without explicit width
  const getColumnWidth = (column: TableColumn<T>, index: number) => {
    if (column.width) {
      return column.width;
    }
    // For fixed table layout, calculate percentage based on remaining space
    // We'll use a simple approach: equal percentage distribution
    // Subtract some space for actions column if present, then divide by number of columns
    const remainingPercent = hasActions ? 95 : 100; // Leave some buffer for actions column
    const percentPerColumn = remainingPercent / totalDataColumns;
    return `${percentPerColumn}%`;
  };

  return (
    <div
      ref={tableContainerRef}
      className="w-full h-full flex flex-col rounded-xl bg-table-row border border-table-border overflow-hidden"
    >
      <div className="flex-1 overflow-hidden">
        <table className="w-full border-collapse table-fixed">
          <thead ref={headerRef} className="sticky top-0 z-10">
            <tr className="bg-table-header border-b border-table-border">
              {columns.map((column, index) => {
                const isSortable = column.sortable !== false;
                const isSorted = sortKey === column.key;
                const columnWidth = getColumnWidth(column, index);

                return (
                  <th
                    key={column.key}
                    onClick={() => isSortable && handleSort(column.key)}
                    style={{
                      width: columnWidth,
                      minWidth: columnWidth,
                      maxWidth: columnWidth,
                    }}
                    className={`px-3 py-1 text-left text-sm font-normal text-text-secondary bg-table-header ${
                      isSortable
                        ? "cursor-pointer hover:bg-sidebar-sub-item-hover transition-colors select-none"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {isSortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            size={14}
                            className={`transition-opacity ${
                              isSorted && sortDirection === "asc"
                                ? "opacity-100 text-brand"
                                : "opacity-30"
                            }`}
                          />
                          <ChevronDown
                            size={14}
                            className={`transition-opacity -mt-1.5 ${
                              isSorted && sortDirection === "desc"
                                ? "opacity-100 text-brand"
                                : "opacity-30"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
              {hasActions && (
                <th
                  style={{
                    width: "120px",
                    minWidth: "120px",
                    maxWidth: "120px",
                  }}
                  className="px-3 py-1 text-left text-sm font-normal text-text-secondary bg-table-header"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody ref={tableBodyRef}>
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-3 py-2 text-center text-sm text-text-secondary"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => (
                <tr
                  ref={index === 0 ? rowRef : null}
                  key={getKey(row, index)}
                  className="border-b border-table-border hover:bg-sidebar-sub-item-hover transition-colors"
                >
                  {columns.map((column, colIndex) => {
                    const columnWidth = getColumnWidth(column, colIndex);
                    return (
                      <td
                        key={column.key}
                        style={{
                          width: columnWidth,
                          minWidth: columnWidth,
                          maxWidth: columnWidth,
                        }}
                        className="px-3 py-1 text-sm text-text-primary overflow-hidden"
                      >
                        <div className="truncate">
                          {getCellValue(row, column)}
                        </div>
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td
                      style={{
                        width: "120px",
                        minWidth: "120px",
                        maxWidth: "120px",
                      }}
                      className="px-3 py-1"
                    >
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <Tooltip text="Edit" position="top">
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 cursor-pointer rounded-lg hover:bg-blue-light transition-colors text-brand hover:text-brand"
                              aria-label="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip text="Delete" position="top">
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 cursor-pointer rounded-lg hover:bg-failure-light transition-colors text-failure hover:text-failure"
                              aria-label="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
                        )}
                        {customActions && customActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {(hasPagination || rows.length > 0) && (
        <div
          ref={paginationRef}
          className="flex items-center justify-between px-3 py-2 border-t border-table-border bg-table-row shrink-0"
        >
          <div className="flex items-center gap-4">
            <div className="text-sm text-text-secondary">
              Showing {startItem} to {endItem} of {sortedRows.length} entries
              {dynamicRowsPerPage !== null && (
                <span className="text-sm text-text-secondary ml-2">
                  ({effectiveRowsPerPage} rows per page)
                </span>
              )}
            </div>
          </div>
          {hasPagination && (
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 cursor-pointer rounded-lg hover:bg-sidebar-sub-item-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary hover:text-text-primary"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 py-1 text-text-secondary"
                      >
                        ...
                      </span>
                    );
                  }

                  const pageNum = page as number;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 cursor-pointer py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-brand text-text-contrast"
                          : "text-text-secondary hover:bg-sidebar-sub-item-hover hover:text-text-primary"
                      }`}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={
                        currentPage === pageNum ? "page" : undefined
                      }
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 cursor-pointer rounded-lg hover:bg-sidebar-sub-item-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary hover:text-text-primary"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Table;
