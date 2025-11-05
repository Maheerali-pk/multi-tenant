"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  getRowKey?: (row: T) => string | number;
  itemsPerPage?: number;
}

function Table<T extends Record<string, any>>({
  columns,
  rows,
  onEdit,
  onDelete,
  getRowKey,
  itemsPerPage = 10,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(itemsPerPage);
  const [dynamicRowsPerPage, setDynamicRowsPerPage] = useState<number | null>(
    null
  );
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);

  const hasActions = onEdit !== undefined || onDelete !== undefined;

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
    let rowHeight = 57; // Default estimated row height (py-4 = 16px top + 16px bottom + content)

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
  const hasPagination =
    effectiveRowsPerPage > 0 && rows.length > effectiveRowsPerPage;

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveRowsPerPage]);

  // Calculate pagination
  const totalPages = hasPagination
    ? Math.ceil(rows.length / effectiveRowsPerPage)
    : 1;

  // Reset to first page if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Get paginated rows
  const paginatedRows = useMemo(() => {
    if (!hasPagination) {
      return rows;
    }
    const startIndex = (currentPage - 1) * effectiveRowsPerPage;
    const endIndex = startIndex + effectiveRowsPerPage;
    return rows.slice(startIndex, endIndex);
  }, [rows, currentPage, effectiveRowsPerPage, hasPagination]);

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

  const startItem = hasPagination
    ? (currentPage - 1) * effectiveRowsPerPage + 1
    : 1;
  const endItem = hasPagination
    ? Math.min(currentPage * effectiveRowsPerPage, rows.length)
    : rows.length;

  return (
    <div
      ref={tableContainerRef}
      className="w-full h-full flex flex-col rounded-xl bg-table-row border border-table-border overflow-hidden"
    >
      <div className="flex-1 overflow-hidden">
        <table className="w-full border-collapse">
          <thead ref={headerRef} className="sticky top-0 z-10">
            <tr className="bg-table-header border-b border-table-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3 text-left text-sm font-normal text-text-secondary bg-table-header"
                >
                  {column.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-5 py-3 text-left text-sm font-normal text-text-secondary bg-table-header">
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
                  className="px-5 py-8 text-center text-sm text-text-secondary"
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
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-5 py-4 text-sm text-text-primary"
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1.5 rounded-lg hover:bg-blue-light transition-colors text-brand hover:text-brand"
                            aria-label="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1.5 rounded-lg hover:bg-failure-light transition-colors text-failure hover:text-failure"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
          className="flex items-center justify-between px-5 py-4 border-t border-table-border bg-table-row shrink-0"
        >
          <div className="flex items-center gap-4">
            <div className="text-sm text-text-secondary">
              Showing {startItem} to {endItem} of {rows.length} entries
              {dynamicRowsPerPage !== null && (
                <span className="text-xs text-text-secondary ml-2">
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
                      className={`px-3 cursor-pointer py-1 rounded-lg text-sm font-medium transition-colors ${
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
