"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { TableColumn } from "./Table";
import { supabase } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/app/constants/tenant";
import { FilterValues } from "./TableFilter";
import DeleteAsset from "@/app/modals/DeleteAsset";
import EditAssetModal from "@/app/modals/EditAssetModal";

export interface AssetRow {
  id: string;
  name: string;
  type: string | null; // subcategory name
  owner: string | null;
  reviewer: string | null;
  sensitivity: string | null; // classification name
  url: string | null;
  exposure: string | null; // exposure name
  status: string | null; // lifecycle status name
  location: string | null;
  categoryId: number;
  subcategoryId: number | null;
}

interface AssetsTableProps {
  onEdit?: (row: AssetRow) => void;
  onDelete?: (row: AssetRow) => void;
  searchValue?: string;
  filterValues?: FilterValues;
  categoryId?: number;
  refreshTrigger?: number; // Increment this to trigger refresh
}

const AssetsTable: React.FC<AssetsTableProps> = ({
  searchValue = "",
  filterValues = {},
  categoryId,
  refreshTrigger,
  onEdit,
  onDelete,
}) => {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] =
    useState<AssetRow | null>(null);

  const handleEditClick = useCallback((row: AssetRow) => {
    setSelectedAssetForEdit(row);
    setEditDialogOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedAssetForEdit(null);
  }, []);

  const handleDeleteClick = useCallback((row: AssetRow) => {
    setSelectedAsset(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedAsset(null);
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assets with all required fields
      let query = supabase
        .from("assets")
        .select(
          "id, name, category_id, subcategory_id, classification_id, exposure_id, lifecycle_status_id, owner_team_id, owner_user_id, reviewer_team_id, reviewer_user_id, url, location"
        )
        .eq("tenant_id", DEFAULT_TENANT_ID);

      // Only filter by category if categoryId is provided
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data: assetsData, error: assetsError } = await query.order(
        "created_at",
        { ascending: false }
      );

      if (assetsError) {
        console.error("Error fetching assets:", assetsError);
        setError("Failed to load assets");
        return;
      }

      if (!assetsData || assetsData.length === 0) {
        setAssets([]);
        return;
      }

      // Get unique category IDs
      const categoryIds = [
        ...new Set(assetsData.map((asset) => asset.category_id)),
      ];

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("asset_categories")
        .select("id, name")
        .in("id", categoryIds);

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        setError("Failed to load categories");
        return;
      }

      // Get unique IDs for related data
      const subcategoryIds = [
        ...new Set(
          assetsData
            .map((asset) => asset.subcategory_id)
            .filter((id): id is number => id !== null)
        ),
      ];

      const classificationIds = [
        ...new Set(
          assetsData
            .map((asset) => asset.classification_id)
            .filter((id): id is number => id !== null)
        ),
      ];

      const exposureIds = [
        ...new Set(
          assetsData
            .map((asset) => asset.exposure_id)
            .filter((id): id is number => id !== null)
        ),
      ];

      const lifecycleStatusIds = [
        ...new Set(
          assetsData
            .map((asset) => asset.lifecycle_status_id)
            .filter((id): id is number => id !== null)
        ),
      ];

      const ownerTeamIds = [
        ...new Set(
          assetsData
            .map((asset) => asset.owner_team_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const ownerUserIds = [
        ...new Set(
          assetsData
            .map((asset) => asset.owner_user_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const reviewerTeamIds = [
        ...new Set(
          assetsData
            .map((asset) => asset.reviewer_team_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const reviewerUserIds = [
        ...new Set(
          assetsData
            .map((asset) => asset.reviewer_user_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      // Fetch all related data in parallel
      const [
        subcategoriesResult,
        classificationsResult,
        exposuresResult,
        lifecycleStatusesResult,
        teamsResult,
        usersResult,
      ] = await Promise.all([
        subcategoryIds.length > 0
          ? supabase
              .from("asset_subcategories")
              .select("id, name")
              .in("id", subcategoryIds)
          : Promise.resolve({ data: [], error: null }),
        classificationIds.length > 0
          ? supabase
              .from("asset_classifications")
              .select("id, name")
              .in("id", classificationIds)
          : Promise.resolve({ data: [], error: null }),
        exposureIds.length > 0
          ? supabase
              .from("asset_exposures")
              .select("id, name")
              .in("id", exposureIds)
          : Promise.resolve({ data: [], error: null }),
        lifecycleStatusIds.length > 0
          ? supabase
              .from("asset_lifecycle_statuses")
              .select("id, name")
              .in("id", lifecycleStatusIds)
          : Promise.resolve({ data: [], error: null }),
        [...ownerTeamIds, ...reviewerTeamIds].length > 0
          ? supabase
              .from("teams")
              .select("id, name")
              .in("id", [...ownerTeamIds, ...reviewerTeamIds])
          : Promise.resolve({ data: [], error: null }),
        [...ownerUserIds, ...reviewerUserIds].length > 0
          ? supabase
              .from("users")
              .select("id, name")
              .in("id", [...ownerUserIds, ...reviewerUserIds])
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Create lookup maps
      const subcategoryMap = new Map(
        (subcategoriesResult.data || []).map(
          (sub: { id: number; name: string }) => [sub.id, sub.name]
        )
      );

      const classificationMap = new Map(
        (classificationsResult.data || []).map(
          (cls: { id: number; name: string }) => [cls.id, cls.name]
        )
      );

      const exposureMap = new Map(
        (exposuresResult.data || []).map(
          (exp: { id: number; name: string }) => [exp.id, exp.name]
        )
      );

      const lifecycleStatusMap = new Map(
        (lifecycleStatusesResult.data || []).map(
          (status: { id: number; name: string }) => [status.id, status.name]
        )
      );

      const teamMap = new Map(
        (teamsResult.data || []).map((team: { id: string; name: string }) => [
          team.id,
          team.name,
        ])
      );

      const userMap = new Map(
        (usersResult.data || []).map((user: { id: string; name: string }) => [
          user.id,
          user.name,
        ])
      );

      // Transform the data to match our AssetRow interface
      const transformedData: AssetRow[] = assetsData.map((asset) => {
        // Determine owner name
        let ownerName: string | null = null;
        if (asset.owner_team_id) {
          ownerName = teamMap.get(asset.owner_team_id) || null;
        } else if (asset.owner_user_id) {
          ownerName = userMap.get(asset.owner_user_id) || null;
        }

        // Determine reviewer name
        let reviewerName: string | null = null;
        if (asset.reviewer_team_id) {
          reviewerName = teamMap.get(asset.reviewer_team_id) || null;
        } else if (asset.reviewer_user_id) {
          reviewerName = userMap.get(asset.reviewer_user_id) || null;
        }

        return {
          id: asset.id,
          name: asset.name,
          type: asset.subcategory_id
            ? subcategoryMap.get(asset.subcategory_id) || null
            : null,
          owner: ownerName,
          reviewer: reviewerName,
          sensitivity: asset.classification_id
            ? classificationMap.get(asset.classification_id) || null
            : null,
          url: asset.url,
          exposure: asset.exposure_id
            ? exposureMap.get(asset.exposure_id) || null
            : null,
          status: asset.lifecycle_status_id
            ? lifecycleStatusMap.get(asset.lifecycle_status_id) || null
            : null,
          location: asset.location,
          categoryId: asset.category_id,
          subcategoryId: asset.subcategory_id,
        };
      });

      setAssets(transformedData);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedAsset) return;

    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("assets")
        .delete()
        .eq("id", selectedAsset.id)
        .eq("tenant_id", DEFAULT_TENANT_ID);

      if (deleteError) {
        console.error("Error deleting asset:", deleteError);
        setError("Failed to delete asset");
        setDeleteLoading(false);
        return;
      }

      // Close dialog and refresh assets
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
      await fetchAssets();
    } catch (err) {
      console.error("Error deleting asset:", err);
      setError("Failed to delete asset");
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedAsset, fetchAssets]);

  // Update handleEditSuccess to include fetchAssets call
  const handleEditSuccessWithRefresh = useCallback(async () => {
    setEditDialogOpen(false);
    setSelectedAssetForEdit(null);
    await fetchAssets();
  }, [fetchAssets]);

  // Fetch assets from Supabase
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchAssets();
    }
  }, [refreshTrigger, fetchAssets]);

  // Columns definition
  const columns: TableColumn<AssetRow>[] = [
    {
      key: "name",
      header: "Name",
    },
    {
      key: "type",
      header: "Type",
      render: (row) => row.type || "-",
    },
    {
      key: "owner",
      header: "Owner",
      render: (row) => row.owner || "-",
    },
    {
      key: "reviewer",
      header: "Reviewer",
      render: (row) => row.reviewer || "-",
    },
    {
      key: "sensitivity",
      header: "Sensitivity",
      render: (row) => row.sensitivity || "-",
    },
    {
      key: "url",
      header: "URL",
      render: (row) =>
        row.url ? (
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline truncate block"
          >
            {row.url}
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "exposure",
      header: "Exposure",
      render: (row) => row.exposure || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => row.status || "-",
    },
    {
      key: "location",
      header: "Location",
      render: (row) => row.location || "-",
    },
  ];

  // Apply search and filter values
  const filteredData = useMemo(() => {
    let result = [...assets];

    // Apply search filter
    if (searchValue && searchValue.trim() !== "") {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(
        (row) =>
          row.name.toLowerCase().includes(searchLower) ||
          (row.type && row.type.toLowerCase().includes(searchLower)) ||
          (row.owner && row.owner.toLowerCase().includes(searchLower)) ||
          (row.reviewer && row.reviewer.toLowerCase().includes(searchLower)) ||
          (row.sensitivity &&
            row.sensitivity.toLowerCase().includes(searchLower)) ||
          (row.exposure && row.exposure.toLowerCase().includes(searchLower)) ||
          (row.status && row.status.toLowerCase().includes(searchLower)) ||
          (row.location && row.location.toLowerCase().includes(searchLower))
      );
    }

    // Apply name filter
    if (filterValues.name && filterValues.name.trim() !== "") {
      const nameFilter = filterValues.name.toLowerCase();
      result = result.filter((row) =>
        row.name.toLowerCase().includes(nameFilter)
      );
    }

    // Apply subcategory filter
    if (filterValues.subcategory && filterValues.subcategory.trim() !== "") {
      const subcategoryId = parseInt(filterValues.subcategory);
      result = result.filter((row) => row.subcategoryId === subcategoryId);
    }

    // Apply sensitivity filter
    if (filterValues.sensitivity && filterValues.sensitivity.trim() !== "") {
      result = result.filter(
        (row) => row.sensitivity === filterValues.sensitivity
      );
    }

    // Apply exposure filter
    if (filterValues.exposure && filterValues.exposure.trim() !== "") {
      result = result.filter((row) => row.exposure === filterValues.exposure);
    }

    // Apply status filter
    if (filterValues.status && filterValues.status.trim() !== "") {
      result = result.filter((row) => row.status === filterValues.status);
    }

    return result;
  }, [assets, searchValue, filterValues]);

  // Default handlers
  const handleEdit = onEdit || handleEditClick;

  const handleDelete = onDelete || handleDeleteClick;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-secondary">
        Loading assets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-failure">{error}</div>
      </div>
    );
  }

  return (
    <>
      <Table
        columns={columns}
        rows={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowKey={(row) => row.id}
      />
      <DeleteAsset
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        asset={selectedAsset}
        loading={deleteLoading}
      />
      <EditAssetModal
        isOpen={editDialogOpen}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccessWithRefresh}
        asset={selectedAssetForEdit}
      />
    </>
  );
};

export default AssetsTable;
