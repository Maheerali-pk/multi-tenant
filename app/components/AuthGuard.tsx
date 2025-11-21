"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authState] = useAuthContext();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to initialize

    if (!authState.initialized || authState.loading) {
      return;
    }

    const isAuthRoute = pathname?.startsWith("/auth");

    // If user is authenticated
    if (authState.user) {
      // If on auth pages, redirect to dashboard or stored redirect path
      if (isAuthRoute) {
        // Check if there's a stored redirect path
        const redirectPath = sessionStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          sessionStorage.removeItem("redirectAfterLogin");
          router.push(redirectPath);
        } else {
          router.push("/dashboard");
        }
      }
      // If authenticated and on root path, redirect to dashboard
      else if (pathname === "/") {
        router.push("/dashboard");
      }
      // Otherwise, allow access to whatever route they're trying to access
    } else {
      // If user is not authenticated
      // Only allow access to auth pages
      if (!isAuthRoute) {
        // Store the attempted route for redirect after login
        if (pathname && pathname !== "/") {
          sessionStorage.setItem("redirectAfterLogin", pathname);
        }
        router.push("/auth/signin");
      }
    }
  }, [
    authState.user,
    authState.initialized,
    authState.loading,
    pathname,
    router,
  ]);

  // Show loading state while checking auth
  if (!authState.initialized || authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-outer">
        <div className="text-text-primary">Loading...</div>
      </div>
    );
  }

  // If user is authenticated and trying to access auth pages, don't render children
  // (redirect will happen in useEffect)
  if (authState.user && pathname?.startsWith("/auth")) {
    return null;
  }

  // If user is not authenticated and trying to access protected pages, don't render children
  // (redirect will happen in useEffect)
  if (!authState.user && !pathname?.startsWith("/auth") && pathname !== "/") {
    return null;
  }

  return <>{children}</>;
}
