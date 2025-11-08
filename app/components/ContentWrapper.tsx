import { FunctionComponent } from "react";
import Header from "./Header";
import { useGlobalContext } from "@/contexts/GlobalContext";
import CreateAsset from "../modals/CreateAsset";

interface ContentWrapperProps {
  children: React.ReactNode;
}

const ContentWrapper: FunctionComponent<ContentWrapperProps> = ({
  children,
}) => {
  const [state, dispatch] = useGlobalContext();
  return (
    <div className="flex flex-col gap-3 min-h-0">
      <Header></Header>
      {state.modals.createAsset && (
        <CreateAsset
          isOpen={state.modals.createAsset}
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
