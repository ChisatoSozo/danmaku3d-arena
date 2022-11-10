import { mutableGlobals } from "../utils/MutableGlobals";
import { StableTransformNode } from "../utils/ReactBabylonUtils";

interface CharacterProps {
  username: string;
}

export const Character = ({ username }: CharacterProps) => {
  return (
    <StableTransformNode
      name={"transform-" + username}
      position={mutableGlobals.poseStore[username].root.position}
    >
      <sphere name={username} />
    </StableTransformNode>
  );
};
