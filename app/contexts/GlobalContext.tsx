"use client";
import { useEffect } from "react";
import { createCustomContext } from "../helpers/createCustomContext";

export type Theme = "light" | "dark";

type ModalType =
  | "createAsset"
  | "createTenant"
  | "createUser"
  | "createUserForTenant"
  | "createTeam"
  | "createPolicy"
  | "createAssessment";
interface IGlobalState {
  isSidebarOpen: boolean;
  tableSearchValue: string;
  theme: Theme;
  modals: Record<ModalType, boolean>;
  createAssetCategoryId?: number;
  refreshTrigger: number;
  selectedTenantId?: string | null; // For superadmin tenant selection
}

const STORAGE_KEY = "globalState";

// Helper function to safely get localStorage value
function getStoredState(): Partial<IGlobalState> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
  }
  return null;
}
export const omitKeys = <T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[]
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as keyof T))
  ) as unknown as Partial<T>;
};

// Helper function to safely set localStorage value
function setStoredState(state: IGlobalState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
}

// Get initial state from localStorage or use default
const storedState = getStoredState();
const initialState: IGlobalState = {
  refreshTrigger: 0,
  isSidebarOpen: true,
  theme: (storedState?.theme as Theme) ?? "light",
  tableSearchValue: storedState?.tableSearchValue ?? "",
  modals: {
    createAsset: false,
    createTenant: false,
    createUser: false,
    createUserForTenant: false,
    createTeam: false,
    createPolicy: false,
    createAssessment: false,
  },
  createAssetCategoryId: undefined,
  selectedTenantId: storedState?.selectedTenantId ?? null,
};

function setState(
  state: IGlobalState,
  newState: Partial<IGlobalState>
): IGlobalState {
  return { ...state, ...newState };
}

function openModal(
  state: IGlobalState,
  modalType: ModalType,
  categoryId?: number
): IGlobalState {
  const updates: Partial<IGlobalState> = {
    modals: { ...state.modals, [modalType]: true },
  };
  if (modalType === "createAsset" && categoryId !== undefined) {
    updates.createAssetCategoryId = categoryId;
  }
  return { ...state, ...updates };
}

function closeModal(state: IGlobalState, modalType: ModalType): IGlobalState {
  return { ...state, modals: { ...state.modals, [modalType]: false } };
}

const functions = {
  setState,
  openModal,
  closeModal,
};

const {
  Context,
  Provider: BaseProvider,
  useContextHook,
} = createCustomContext<IGlobalState, typeof functions>({
  initialState,
  functions,
});

// Wrapper Provider that persists state to localStorage and syncs theme
const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <BaseProvider>
      <PersistState />
      <ThemeSync />
      {children}
    </BaseProvider>
  );
};

// Component that handles persisting state to localStorage
const PersistState: React.FC = () => {
  const [state] = useContextHook();

  useEffect(() => {
    setStoredState(state);
  }, [state]);

  return null;
};

// Component that syncs theme to document's data-theme attribute
const ThemeSync: React.FC = () => {
  const [state] = useContextHook();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", state.theme);
    }
  }, [state.theme]);

  return null;
};

export { GlobalContextProvider };
export const useGlobalContext = useContextHook;
