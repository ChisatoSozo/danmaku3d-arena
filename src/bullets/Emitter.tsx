import { Animation, TransformNode, Vector3 } from "@babylonjs/core";
import { useEffect, useMemo, useRef } from "react";
import { useBeforeRender } from "react-babylonjs";
import { MeshFromAssetDefinition } from "../components/MeshFromAssetDefinition";
import { useVectorMemo } from "../hooks/useVectorMemo";
import { EmitterDefinition } from "../types/gameDefinition/PlayableCharacterDefinition";
import { getTarget } from "../utils/MutableGlobals";
import { SubEmitter } from "./SubEmitter";

interface EmitterProps {
  username: string;
  emitterDefinition: EmitterDefinition;
  focused: boolean;
}

export const Emitter: React.FC<EmitterProps> = ({
  username,
  emitterDefinition,
  focused,
}) => {
  const transformNodeRef = useRef<TransformNode>(null);
  const position = useVectorMemo(emitterDefinition.position);
  const unfocusPosition = useVectorMemo(emitterDefinition.position);
  const focusPosition = useVectorMemo(emitterDefinition.focusPosition);
  const scaling = useMemo(
    () => new Vector3(emitterDefinition.mirrored ? -1 : 1, 1, 1),
    [emitterDefinition]
  );

  useEffect(() => {
    if (!transformNodeRef.current) return;
    if (focused) {
      Animation.CreateAndStartAnimation(
        "anim",
        transformNodeRef.current,
        "position",
        60,
        15,
        transformNodeRef.current.position,
        focusPosition,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
    } else {
      Animation.CreateAndStartAnimation(
        "anim",
        transformNodeRef.current,
        "position",
        60,
        15,
        transformNodeRef.current.position,
        unfocusPosition,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
    }
  }, [focusPosition, focused, unfocusPosition]);

  useBeforeRender(() => {
    if (!transformNodeRef.current) return;
    transformNodeRef.current.lookAt(getTarget(username));
  });

  return (
    <transformNode ref={transformNodeRef} position={position} name={""}>
      {emitterDefinition.subEmitters.map((subEmitterDefinition, index) => (
        <SubEmitter
          username={username}
          key={index}
          position={subEmitterDefinition.position}
          bulletPatternDefinition={subEmitterDefinition.bulletPattern}
        />
      ))}
      <MeshFromAssetDefinition
        name=""
        alpha={focused ? 1 : 1}
        scaling={scaling}
        assetDefinition={emitterDefinition.asset}
        activeAnimation="default"
      />
    </transformNode>
  );
};
