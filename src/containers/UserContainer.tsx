import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";

const userContext = createContext<{
  users: string[];
  setUsers: Dispatch<SetStateAction<string[]>>;
}>({
  users: [],
  setUsers: () => {},
});

export const useUsers = () => useContext(userContext);

export const UserContainer = ({ children }: PropsWithChildren<{}>) => {
  const [users, setUsers] = useState<string[]>([]);

  const providerValue = useMemo(() => ({ users, setUsers }), [users, setUsers]);

  return (
    <userContext.Provider value={providerValue}>
      {children}
    </userContext.Provider>
  );
};
