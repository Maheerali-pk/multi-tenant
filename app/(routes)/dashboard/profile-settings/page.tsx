"use client";

import { useState, useCallback } from "react";
import ContentWrapper from "@/app/components/ContentWrapper";
import DashboardWrapper from "@/app/components/DashboardWrapper";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ProfileSettingsProps {}

const ProfileSettings: React.FC<ProfileSettingsProps> = () => {
  const [auth] = useAuthContext();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.currentPassword) {
      setError("Current password is required");
      return;
    }

    if (!formData.newPassword) {
      setError("New password is required");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: auth.user?.email || "",
        password: formData.currentPassword,
      });

      if (signInError) {
        setError("Current password is incorrect");
        setLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password");
        setLoading(false);
        return;
      }

      // Success
      setSuccess("Password updated successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error("Error updating password:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardWrapper>
      <ContentWrapper filedsToInlcude={[]}>
        <div className="flex flex-col rounded-3xl p-6 gap-6 min-h-0 flex-1">
          <div className="font-semibold text-xl items-center text-text-primary">
            Profile Settings
          </div>

          <div className="flex flex-col gap-6">
            {/* User Information Section */}
            <div className="bg-bg-inner rounded-2xl p-6 border border-border-hr">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Name
                  </label>
                  <div className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm">
                    {auth.userData?.name ||
                      auth.user?.user_metadata?.name ||
                      "N/A"}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Email
                  </label>
                  <div className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm">
                    {auth.user?.email || "N/A"}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Role
                  </label>
                  <div className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm">
                    {auth.userData?.role
                      ? auth.userData.role
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")
                      : "N/A"}
                  </div>
                </div>
                {auth.userData?.title && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">
                      Title
                    </label>
                    <div className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm">
                      {auth.userData.title}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-bg-inner rounded-2xl p-6 border border-border-hr">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Change Password
              </h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-lg bg-success-light border border-success text-success text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="currentPassword"
                    className="text-sm font-medium text-text-primary"
                  >
                    Current Password <span className="text-failure">*</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-medium text-text-primary"
                  >
                    New Password <span className="text-failure">*</span>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                    placeholder="Enter your new password (min. 6 characters)"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-text-primary"
                  >
                    Confirm New Password <span className="text-failure">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors placeholder:text-text-secondary"
                    placeholder="Confirm your new password"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </DashboardWrapper>
  );
};

export default ProfileSettings;
