import { Vector2, Vector3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useBeforeRender } from "react-babylonjs";
import { touhou } from "../protos-generated/proto.pbjs";
import { getMovementState, getPose } from "../utils/MutableGlobals";
import { actionObservables } from "./ActionObservables";

export const Physics = () => {
  const velocity = useRef(new Vector3());

  useEffect(() => {
    const handleMovement = (move: Vector2) => {
      if (getMovementState() === touhou.MovementState.FLYING) {
        return;
      }

      velocity.current = new Vector3(move.x, 0, move.y);
      velocity.current.rotateByQuaternionToRef(
        getPose().root.rotation,
        velocity.current
      );
    };

    const observer = actionObservables.move.add(handleMovement);

    return () => {
      actionObservables.move.remove(observer);
    };
  }, []);

  useBeforeRender(() => {
    getPose().root.position.addInPlace(velocity.current);
  });

  return null;
};
