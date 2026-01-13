"use client";

import { Plus } from "lucide-react";
import { useGlobalContext } from "@/app/contexts/GlobalContext";

export const CreateNewAssessmentButton = () => {
  const [state, dispatch] = useGlobalContext();
  return (
    <div
      onClick={() => {
        dispatch({ openModal: "createAssessment" });
      }}
      className="flex gap-2 items-center h-full text-text-contrast bg-brand rounded-lg h-10 py-1.5 px-3 justify-center font-semibold text-sm cursor-pointer"
    >
      <Plus size={16} className=""></Plus>
      New
    </div>
  );
};
