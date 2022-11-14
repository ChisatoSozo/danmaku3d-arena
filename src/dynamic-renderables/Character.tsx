import { mutableGlobals } from "../utils/MutableGlobals";
import { StableTransformNode } from "../utils/ReactBabylonUtils";
import { Emitters } from "./Emitters";

interface CharacterProps {
  username: string;
}

export const Character = ({ username }: CharacterProps) => {
  if (!mutableGlobals.poseStore[username]) {
    console.log("no pose for " + username);
    console.log(mutableGlobals.poseStore);
    return null;
  }

  return (
    <StableTransformNode
      name={"transform-root-" + username}
      position={mutableGlobals.poseStore[username].root.position}
      rotationQuaternion={mutableGlobals.poseStore[username].root.rotation}
    >
      <StableTransformNode
        name={"transform-head-" + username}
        position={mutableGlobals.poseStore[username].head.position}
        rotationQuaternion={mutableGlobals.poseStore[username].head.rotation}
      >
        <sphere name={username}>
          <standardMaterial name="greymat" useLogarithmicDepth />
          <Emitters username={username} />
        </sphere>
      </StableTransformNode>
    </StableTransformNode>
  );
};
