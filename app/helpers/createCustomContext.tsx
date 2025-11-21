"use client";
import React, {
  type Context,
  createContext,
  useContext,
  useReducer,
} from "react";

/*################################################################################################################################
                                                      Helper Types
##################################################################################################################################
*/
//To create dispatch type from actionstype
type CreateDispatchType<ActionsType> = React.Dispatch<Partial<ActionsType>>;
//To create object type for main Function.
interface Props<StateType, FunctionsObjectType> {
  initialState: StateType;
  functions: FunctionsObjectType;
  customHook?: (state: StateType) => void;
}

//To create the 'Action Types' from 'FunctionsType'
type GeneralFunctionType = (state: any, data: any) => any;
type GeneralFucntionsObjectType = { [k in string]: GeneralFunctionType };
type CreateActionsType<FunctionsType extends GeneralFucntionsObjectType> = {
  [k in keyof FunctionsType]: Parameters<FunctionsType[k]>[1];
};

/*################################################################################################################################
                                                      To build a reducer function
##################################################################################################################################
*/
function buildReducer<
  StateType,
  FunctionsObjectType extends GeneralFucntionsObjectType,
  ActionsType
>({ functions }: { functions: FunctionsObjectType }) {
  return (state: StateType, action: Partial<ActionsType>) => {
    let tempState: StateType = { ...state };
    Object.keys(action).forEach((key) => {
      let inferredKey = key as keyof FunctionsObjectType;
      const func = functions[inferredKey];
      tempState = func(tempState, action[inferredKey as keyof ActionsType]);
    });
    return tempState;
  };
}

/*################################################################################################################################
                                                         Main function
##################################################################################################################################
*/
export function createCustomContext<
  StateType extends Object,
  FunctionsObjectType extends GeneralFucntionsObjectType
>({
  initialState,
  functions,
  customHook,
}: Props<StateType, FunctionsObjectType>) {
  //Create actions type using typeof functions object
  type ActionsType = CreateActionsType<FunctionsObjectType>;

  //Creathe reducer function
  const reducer = buildReducer<StateType, FunctionsObjectType, ActionsType>({
    functions,
  });

  //Create dispatch and context type
  type DispatchType = CreateDispatchType<ActionsType>;
  type ContextType = [StateType, DispatchType];
  //Create initial Context value and Context itself
  const initialContext = [
    initialState,
    (() => {}) as DispatchType,
  ] as ContextType;
  const Context: Context<ContextType> = createContext(initialContext);

  //Create the wrapper function which provied that context
  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    customHook && customHook(state);
    return (
      <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>
    );
  };

  return {
    Context,
    Provider,
    useContextHook: () => useContext(Context),
  };
}
