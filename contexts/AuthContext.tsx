"use client";
import { useEffect, useReducer } from "react";
import { createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface IAuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

const initialState: IAuthState = {
  user: null,
  loading: true,
  initialized: false,
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

// Component that manages authentication state
const AuthManager: React.FC = () => {
  const [, dispatch] = useContext(AuthContext);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        dispatch({
          type: "SET_STATE",
          payload: {
            user,
            loading: false,
            initialized: true,
          },
        });
      } catch (error) {
        console.error("Error checking auth:", error);
        dispatch({
          type: "SET_STATE",
          payload: {
            user: null,
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({
        type: "SET_STATE",
        payload: {
          user: session?.user ?? null,
          loading: false,
          initialized: true,
        },
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

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
