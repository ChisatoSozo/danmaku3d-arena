import { PropsWithChildren } from "react";
import { getPose } from "../utils/MutableGlobals";
import { StableTransformNode } from "../utils/ReactBabylonUtils";

interface PlayerRootProps {}

export const PlayerRoot = ({
  children,
}: PropsWithChildren<PlayerRootProps>) => {
  return (
    <StableTransformNode
      name="rootTransform"
      rotationQuaternion={getPose().root.rotation}
      position={getPose().root.position}
    >
      {children}
    </StableTransformNode>
  );
};
