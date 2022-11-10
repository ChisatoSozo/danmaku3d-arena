import { useUsers } from "../containers/UserContainer";
import { Character } from "./Character";

export const Characters = () => {
  const { users } = useUsers();

  return (
    <>
      {users.map((user) => (
        <Character key={user} username={user} />
      ))}
    </>
  );
};
