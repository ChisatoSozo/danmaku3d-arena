import { Vector2, Vector3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useBeforeRender } from "react-babylonjs";
import { touhou } from "../protos-generated-client/proto.pbjs";
import {
  getMovementState,
  getPose,
  mutableGlobals,
} from "../utils/MutableGlobals";
import { actionObservables } from "./ActionObservables";

export const Physics = () => {
  const movement = useRef(new Vector2());

  useEffect(() => {
    const handleMovement = (move: Vector2) => {
      if (getMovementState() === touhou.MovementState.FLYING) {
        return;
      }

      movement.current = move;
    };

    const observer = actionObservables.move.add(handleMovement);

    return () => {
      actionObservables.move.remove(observer);
    };
  }, []);

  useBeforeRender((data) => {
    if (!movement.current) {
      return;
    }
    let velocity = new Vector3(movement.current.x, 0, movement.current.y);
    velocity.rotateByQuaternionToRef(getPose().root.rotation, velocity);

    const deltaS = data.deltaTime / 1000 || 0;
    getPose().root.position.addInPlace(velocity.scale(deltaS * 10));

    mutableGlobals.enemies = [
      {
        position: getPose().root.position,
        radius: 1,
        health: 100,
      },
    ];
  });

  return null;
};
