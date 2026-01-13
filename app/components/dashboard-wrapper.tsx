import Sidebar from "./sidebar";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-[min-content_auto] gap-3 p-3 bg-bg-outer h-full w-full">
      <Sidebar />
      {children}
    </div>
  );
};

export default DashboardWrapper;
