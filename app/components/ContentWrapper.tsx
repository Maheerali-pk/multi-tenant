import { FunctionComponent } from "react";
import Header from "./Header";

interface ContentWrapperProps {
  children: React.ReactNode;
}

const ContentWrapper: FunctionComponent<ContentWrapperProps> = ({
  children,
}) => {
  return (
    <div className="flex flex-col gap-3 min-h-0">
      <Header></Header>
      <div className="flex flex-col rounded-3xl bg-bg-inner p-6 gap-6 min-h-0 flex-1">
        {children}
      </div>
    </div>
  );
};

export default ContentWrapper;
