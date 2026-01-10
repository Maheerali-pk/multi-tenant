"use client";
import { useEffect, useReducer, useMemo, useRef } from "react";
import { createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthUser, UserData } from "@/app/types/user.types";
import { User } from "@supabase/supabase-js";

interface IAuthState {
  user: User | null;
  name: string | null;
  loading: boolean;
  initialized: boolean;
  userData: UserData | null;
}

const initialState: IAuthState = {
  user: null,
  name: null,
  loading: true,
  initialized: false,
  userData: null,
};
const fetchUserData = async (
  authUserId: string | null,
  supabaseClient: ReturnType<typeof createClient>
): Promise<UserData | null> => {
  if (!authUserId) return null;
  try {
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("auth_user_id", authUserId)
      .single();
    if (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

type AuthAction = {
  type: "SET_STATE";
  payload: Partial<IAuthState>;
};

function authReducer(state: IAuthState, action: AuthAction): IAuthState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

type AuthContextType = [IAuthState, React.Dispatch<AuthAction>];

const AuthContext = createContext<AuthContextType>([initialState, () => {}]);

// Helper function to extract user name from user metadata
const getUserName = (user: User | null): string | null => {
  if (!user) return null;

  // Extract name from user_metadata
  const name = user.user_metadata?.name;
  return name || null;
};

// Component that manages authentication state
const AuthManager: React.FC = () => {
  const [, dispatch] = useContext(AuthContext);

  // Create Supabase client instance (memoized to avoid recreating on every render)
  const supabase = useMemo(() => createClient(), []);

  // Track if we've updated last login for this session to prevent duplicates
  const hasUpdatedLastLoginRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Check initial auth state with timeout protection
    const checkAuth = async () => {
      try {
        // Set a timeout to ensure we always initialize, even if auth check hangs
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn("Auth check timeout - initializing with no user");
            dispatch({
              type: "SET_STATE",
              payload: {
                user: null,
                name: null,
                userData: null,
                loading: false,
                initialized: true,
              },
            });
          }
        }, 3000); // 3 second timeout

        // Try getSession first (faster, reads from local storage)
        let user: User | null = null;
        let sessionPromise: Promise<any> | null = null;

        try {
          sessionPromise = supabase.auth.getSession();
          const sessionResult = (await Promise.race([
            sessionPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("getSession timeout")), 2000)
            ),
          ])) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

          if (!sessionResult.error && sessionResult.data?.session?.user) {
            user = sessionResult.data.session.user;
          }
        } catch (sessionErr) {
          console.log(
            "getSession failed or timed out, trying getUser:",
            sessionErr
          );
        }

        // If no session found, try getUser with timeout
        if (!user) {
          try {
            const getUserPromise = supabase.auth.getUser();
            const userResult = (await Promise.race([
              getUserPromise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("getUser timeout")), 2000)
              ),
            ])) as Awaited<ReturnType<typeof supabase.auth.getUser>>;

            if (!mounted) {
              clearTimeout(timeoutId);
              return;
            }

            if (userResult.error) {
              console.error("Error getting user:", userResult.error);
              clearTimeout(timeoutId);
              dispatch({
                type: "SET_STATE",
                payload: {
                  user: null,
                  name: null,
                  userData: null,
                  loading: false,
                  initialized: true,
                },
              });
              return;
            }

            user = userResult.data?.user ?? null;
          } catch (getUserErr) {
            console.error("getUser failed or timed out:", getUserErr);
            // Continue with user = null
          }
        }

        if (!mounted) {
          clearTimeout(timeoutId);
          return;
        }

        clearTimeout(timeoutId);

        // Fetch user data in background (don't block initialization)
        if (user) {
          // Set initial state first
          dispatch({
            type: "SET_STATE",
            payload: {
              user: user,
              name: getUserName(user),
              loading: false,
              initialized: true,
              userData: null, // Will be updated when fetch completes
            },
          });

          // Then fetch user data asynchronously
          fetchUserData(user.id, supabase)
            .then((userData) => {
              if (mounted) {
                dispatch({
                  type: "SET_STATE",
                  payload: {
                    userData: userData,
                  },
                });
              }
            })
            .catch((err) => {
              console.error("Error fetching user data (non-blocking):", err);
            });
        } else {
          dispatch({
            type: "SET_STATE",
            payload: {
              user: null,
              name: null,
              userData: null,
              loading: false,
              initialized: true,
            },
          });
        }
      } catch (error) {
        if (!mounted) {
          clearTimeout(timeoutId);
          return;
        }
        clearTimeout(timeoutId);
        console.error("Error checking auth:", error);
        dispatch({
          type: "SET_STATE",
          payload: {
            user: null,
            name: null,
            userData: null,
            loading: false,
            initialized: true,
          },
        });
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;

      // Update user state immediately
      dispatch({
        type: "SET_STATE",
        payload: {
          user,
          name: getUserName(user),
          loading: false,
          initialized: true,
        },
      });

      // Reset last login flag when user signs out
      if (event === "SIGNED_OUT") {
        hasUpdatedLastLoginRef.current = false;
      }

      // Fetch user data asynchronously (non-blocking)
      if (user) {
        fetchUserData(user.id, supabase)
          .then(async (userData) => {
            if (mounted) {
              dispatch({
                type: "SET_STATE",
                payload: {
                  userData: userData,
                },
              });

              // Update last logged in timestamp when user signs in (only once per session)
              if (
                event === "SIGNED_IN" &&
                userData &&
                !hasUpdatedLastLoginRef.current
              ) {
                hasUpdatedLastLoginRef.current = true;
                try {
                  await fetch("/api/update-last-login", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      userId: userData.id,
                    }),
                  });
                } catch (err) {
                  // Don't block auth flow if update fails
                  console.error("Error updating last login:", err);
                }
              }
            }
          })
          .catch((err) => {
            console.error(
              "Error fetching user data in auth change (non-blocking):",
              err
            );
          });
      } else {
        dispatch({
          type: "SET_STATE",
          payload: {
            userData: null,
          },
        });
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [dispatch, supabase]);

  return null;
};

// Wrapper Provider that manages authentication state
const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={[state, dispatch]}>
      <AuthManager />
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContextProvider };
export const useAuthContext = () => useContext(AuthContext);
