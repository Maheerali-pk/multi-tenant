"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Handle Supabase invitation flow
    // When user clicks invitation link, Supabase puts tokens in URL hash
    const handleInvitation = async () => {
      if (typeof window === "undefined") return;

      try {
        // Check if there are tokens in the URL hash
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken && type === "invite") {
          // Set the session using the tokens from the URL
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
            setError(
              "Invalid or expired invitation link. Please contact your administrator."
            );
            setInitializing(false);
            return;
          }

          // Get user info
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error("Error getting user:", userError);
            setError("Failed to retrieve user information.");
            setInitializing(false);
            return;
          }

          if (user) {
            setEmail(user.email || null);
            setHasSession(true);
            // Clear the hash from URL
            window.history.replaceState(null, "", window.location.pathname);
          }
        } else {
          // Check if user already has a session (in case they refreshed the page)
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              setEmail(user.email || null);
              setHasSession(true);
            } else {
              setError("Failed to retrieve user information.");
            }
          } else {
            setError(
              "Invalid invitation link. Please use the link from your invitation email."
            );
          }
        }
      } catch (err: any) {
        console.error("Error processing invitation:", err);
        setError(
          err.message || "An unexpected error occurred. Please try again."
        );
      } finally {
        setInitializing(false);
      }
    };

    handleInvitation();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!hasSession) {
      setError(
        "Please use the invitation link from your email to access this page."
      );
      return;
    }

    setLoading(true);

    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Failed to retrieve user information.");
        setLoading(false);
        return;
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to set password");
        setLoading(false);
        return;
      }

      // Check if user profile already exists (it should from the invitation)
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" - if it's a different error, log it
        console.error("Error checking user profile:", checkError);
      }

      // If profile doesn't exist, create it (shouldn't happen, but just in case)
      if (!existingUser) {
        const userMetadata = user.user_metadata || {};
        const fullName =
          userMetadata.full_name || user.email?.split("@")[0] || "";
        const role = userMetadata.role || "tenant_user";
        const tenantId = userMetadata.tenant_id || null;
        const title = userMetadata.title || null;

        const { error: profileError } = await supabase.from("users").insert({
          id: user.id,
          auth_user_id: user.id,
          email: user.email || "",
          name: fullName,
          role: role,
          tenant_id: tenantId,
          title: title,
          invitation_pending: false, // User has accepted invitation
        });

        if (profileError) {
          // If profile already exists (e.g., race condition), that's okay
          if (profileError.code !== "23505") {
            // 23505 is unique violation - profile already exists
            console.error("Error creating user profile:", profileError);
            setError(
              "Password set successfully, but there was an error creating your profile. Please contact support."
            );
            setLoading(false);
            return;
          }
        }
      } else {
        // Update invitation_pending to false since user has accepted
        const { error: updatePendingError } = await supabase
          .from("users")
          .update({ invitation_pending: false })
          .eq("id", user.id);

        if (updatePendingError) {
          console.error("Error updating invitation status:", updatePendingError);
          // Don't block the flow, just log the error
        }
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error setting password:", err);
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-outer p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-inner rounded-2xl shadow-lg p-8 border border-table-border">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-text-dark mb-2">
              Accept Invitation
            </h1>
            <p className="text-sm text-text-secondary">
              Set your password to complete your account setup
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-failure-light border border-failure text-failure text-sm">
              {error}
            </div>
          )}

          {initializing && !error && (
            <div className="mb-4 p-3 rounded-lg bg-sidebar-sub-item-hover text-text-secondary text-sm">
              Loading invitation...
            </div>
          )}

          {!initializing && !error && !hasSession && (
            <div className="mb-4 p-3 rounded-lg bg-sidebar-sub-item-hover text-text-secondary text-sm">
              Waiting for invitation link...
            </div>
          )}

          {!initializing && hasSession && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {email && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-text-primary">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border-hr bg-input text-text-secondary text-sm cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  Password <span className="text-failure">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors"
                  placeholder="Enter your password"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  Confirm Password <span className="text-failure">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 rounded-lg border border-border-hr bg-input text-text-primary text-sm outline-none focus:border-brand transition-colors"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-brand text-text-contrast font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Setting up account..." : "Accept Invitation"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="text-sm text-brand hover:underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
