import { Vector2, Vector3 } from "@babylonjs/core";
import { useCallback, useEffect, useRef } from "react";
import { useDeltaBeforeRender } from "../hooks/useDeltaBeforeRender";
import { useTerrainData } from "../hooks/useTerrainData";
import { touhou } from "../protos-generated-client/proto.pbjs";
import { snapVecToHeightmap } from "../terrain/WorldUtils";
import { getPose, mutableGlobals } from "../utils/MutableGlobals";
import { actionObservables } from "./ActionObservables";

export const Physics = () => {
  const movement = useRef(new Vector2());
  const velocity = useRef(new Vector3());
  const terrainData = useTerrainData();

  useEffect(() => {
    const handleMovement = (move: Vector2) => {
      movement.current = move;
    };

    const handleJump = () => {
      if (getPose().movementState !== touhou.MovementState.WALKING) {
        return;
      }
      velocity.current.y = 1;
      getPose().movementState = touhou.MovementState.FALLING;
    };

    const handleLand = () => {
      velocity.current.y = 0;
      getPose().movementState = touhou.MovementState.WALKING;
      snapVecToHeightmap(terrainData, getPose().root.position, 1.8);
    };

    const observer = actionObservables.move.add(handleMovement);
    const jumpObserver = actionObservables.jump.add(handleJump);
    const landObserver = actionObservables.land.add(handleLand);

    return () => {
      actionObservables.move.remove(observer);
      actionObservables.jump.remove(jumpObserver);
      actionObservables.land.remove(landObserver);
    };
  }, [terrainData]);

  const handleWalking = useCallback(
    (deltaS: number) => {
      velocity.current = new Vector3(movement.current.x, 0, movement.current.y);
      velocity.current.applyRotationQuaternionInPlace(getPose().root.rotation);

      getPose().root.position.addInPlace(velocity.current.scale(deltaS * 40));

      snapVecToHeightmap(terrainData, getPose().root.position, 1.8);
    },
    [terrainData]
  );

  const handleFalling = useCallback(
    (deltaS: number) => {
      velocity.current.y -= 0.98 * deltaS;
      getPose().root.position.addInPlace(velocity.current.scale(deltaS * 100));
      const testVector = getPose().root.position.clone();
      const yBefore = testVector.y;
      snapVecToHeightmap(terrainData, testVector, 1.8);
      if (testVector.y >= yBefore) {
        actionObservables.land.notifyObservers(null);
      }
    },
    [terrainData]
  );

  useDeltaBeforeRender(
    (scene, deltaS) => {
      if (!movement.current) {
        return;
      }

      switch (getPose().movementState) {
        case touhou.MovementState.WALKING:
          handleWalking(deltaS);
          break;
        case touhou.MovementState.FALLING:
          handleFalling(deltaS);
          break;
        default:
          break;
      }

      mutableGlobals.enemies = [
        {
          position: getPose().root.position,
          radius: 1,
          health: 100,
        },
      ];
    },
    [handleFalling, handleWalking]
  );

  return null;
};
