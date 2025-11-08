"use client";

import { Plus } from "lucide-react";
import { useGlobalContext } from "@/contexts/GlobalContext";

export const CreateNewAssetButton = () => {
  const [state, dispatch] = useGlobalContext();
  return (
    <div
      onClick={() => dispatch({ openModal: "createAsset" })}
      className="flex gap-2 items-center text-text-contrast bg-brand rounded-xl h-full w-24 justify-center font-semibold text-xs cursor-pointer"
    >
      <Plus size={16} className=""></Plus>
      New
    </div>
  );
};
