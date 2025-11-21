import ContentWrapper from "@/app/components/ContentWrapper";
import DashboardWrapper from "@/app/components/DashboardWrapper";

interface UsersManagementProps {}

const UsersManagement: React.FC<UsersManagementProps> = () => {
  return (
    <>
      <DashboardWrapper>
        <ContentWrapper filedsToInlcude={[]}>
          <div className="flex flex-col rounded-3xl p-6 gap-3 min-h-0 flex-1">
            <div className="flex justify-between items-center shrink-0 gap-4">
              <div className="font-semibold text-xl items-center text-text-primary">
                Users management
              </div>
            </div>
          </div>
        </ContentWrapper>
      </DashboardWrapper>
    </>
  );
};

export default UsersManagement;
