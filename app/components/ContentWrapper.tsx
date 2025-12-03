"use client";
import { FunctionComponent } from "react";
import Header from "./Header";
import { useGlobalContext } from "@/app/contexts/GlobalContext";
import CreateAsset from "../modals/CreateAsset";
import { Tables } from "../types/database.types";
import { useAuthContext } from "../contexts/AuthContext";

type ColumnName = keyof Tables<"assets">;

interface ContentWrapperProps {
  children: React.ReactNode;
  filedsToInlcude: ColumnName[];
  showWithoutTenant?: boolean;
}

const ContentWrapper: FunctionComponent<ContentWrapperProps> = ({
  children,
  filedsToInlcude,
  showWithoutTenant = false,
}) => {
  const [state, dispatch] = useGlobalContext();
  const [auth] = useAuthContext();
  if (!auth.userData?.role)
    return (
      <div className="flex flex-col gap-3 min-h-0">
        <Header></Header>
      </div>
    );
  if (
    (state.selectedTenantId === null || state.selectedTenantId === undefined) &&
    auth.userData?.role === "superadmin" &&
    !showWithoutTenant
  ) {
    return (
      <div className="flex flex-col gap-3 min-h-0">
        <Header></Header>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 min-h-0">
      <Header></Header>
      {state.modals.createAsset && (
        <CreateAsset
          filedsToInlcude={filedsToInlcude}
          isOpen={state.modals.createAsset}
          onSuccess={() =>
            dispatch({
              setState: {
                refreshTrigger: state.refreshTrigger + 1,
              },
            })
          }
          onClose={() => dispatch({ closeModal: "createAsset" })}
          categoryId={state.createAssetCategoryId}
        />
      )}
      <div className="flex flex-col rounded-3xl bg-bg-inner gap-6 min-h-0 flex-1">
        {children}
      </div>
    </div>
  );
};

export default ContentWrapper;
