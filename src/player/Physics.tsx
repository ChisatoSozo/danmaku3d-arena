import { Quaternion, Vector2, Vector3 } from "@babylonjs/core";
import objectHash from "object-hash";
import { useCallback, useEffect, useRef } from "react";
import { useDeltaBeforeRender } from "../hooks/useDeltaBeforeRender";
import { useTerrainData } from "../hooks/useTerrainData";
import { touhou } from "../protos-generated-client/proto.pbjs";
import { snapVecToHeightmap } from "../terrain/WorldUtils";
import { getForwardVector } from "../utils/MathUtils";
import { getPose, mutableGlobals } from "../utils/MutableGlobals";
import { actionObservables } from "./ActionObservables";
import { delta } from "./PlayerHead";

export const Physics = () => {
  const movement = useRef(new Vector2());
  const velocity = useRef(new Vector3());
  const terrainData = useTerrainData();
  const flyBoost = useRef(false);
  const lastDelta = useRef(objectHash(delta));

  useEffect(() => {
    const handleMovement = (move: Vector2) => {
      movement.current = move;
    };

    const handleJump = () => {
      if (getPose().movementState !== touhou.MovementState.WALKING) {
        return;
      }
      velocity.current.y = 40;
      getPose().movementState = touhou.MovementState.FALLING;
    };

    const handleLand = () => {
      velocity.current.y = 0;
      getPose().movementState = touhou.MovementState.WALKING;
      snapVecToHeightmap(terrainData, getPose().root.position, 1.8);
    };

    const handleFly = () => {
      console.log(velocity.current);
      velocity.current.addInPlace(getForwardVector(getPose().head.rotation));
      getPose().root.rotation.multiplyInPlace(getPose().head.rotation);
      getPose().head.rotation = new Quaternion();
      getPose().movementState = touhou.MovementState.FLYING;
    };

    const handleFlyBoost = (boost: boolean) => {
      flyBoost.current = boost;
    };

    const observer = actionObservables.move.add(handleMovement);
    const jumpObserver = actionObservables.jump.add(handleJump);
    const landObserver = actionObservables.land.add(handleLand);
    const flyObserver = actionObservables.fly.add(handleFly);
    const flyBoostObserver = actionObservables.flyBoost.add(handleFlyBoost);

    return () => {
      actionObservables.move.remove(observer);
      actionObservables.jump.remove(jumpObserver);
      actionObservables.land.remove(landObserver);
      actionObservables.fly.remove(flyObserver);
      actionObservables.flyBoost.remove(flyBoostObserver);
    };
  }, [terrainData]);

  const handleWalking = useCallback(
    (deltaS: number) => {
      velocity.current = new Vector3(movement.current.x, 0, movement.current.y).scale(40);
      velocity.current.applyRotationQuaternionInPlace(getPose().root.rotation);

      getPose().root.position.addInPlace(velocity.current.scale(deltaS));

      snapVecToHeightmap(terrainData, getPose().root.position, 1.8);
    },
    [terrainData]
  );

  const handleFalling = useCallback(
    (deltaS: number) => {
      velocity.current.y -= 40 * deltaS;
      getPose().root.position.addInPlace(velocity.current.scale(deltaS));
      const testVector = getPose().root.position.clone();
      const yBefore = testVector.y;
      snapVecToHeightmap(terrainData, testVector, 1.8);
      if (testVector.y >= yBefore) {
        actionObservables.land.notifyObservers(null);
      }
    },
    [terrainData]
  );

  const handleFlying = useCallback(
    (deltaS: number) => {
      if (objectHash(delta) !== lastDelta.current) {
        getPose().root.rotation.multiplyInPlace(Quaternion.RotationAxis(Vector3.Forward(), -delta.x));
        getPose().root.rotation.multiplyInPlace(Quaternion.RotationAxis(Vector3.Right(), delta.y));
      }

      const yBeforeTestVel = getPose().root.position.y;

      const velocityToTrim = velocity.current.scale(deltaS);
      velocity.current.subtractInPlace(velocityToTrim);
      velocity.current.addInPlace(getForwardVector(getPose().root.rotation).scale(velocityToTrim.length()));
      velocity.current.addInPlace(Vector3.Up().scale(-9.8 * deltaS));

      if (flyBoost.current) {
        velocity.current.addInPlace(getForwardVector(getPose().root.rotation).scale(30 * deltaS));
      }

      //wind resistance (accounting for deltaS)
      velocity.current.scaleInPlace(Math.pow(0.9, deltaS));

      const testPosition = getPose().root.position.clone().addInPlace(velocity.current.scale(deltaS));
      const deltaY = testPosition.y - yBeforeTestVel;
      const energyGain = -deltaY;
      velocity.current.addInPlace(getForwardVector(getPose().root.rotation).scale(energyGain));

      getPose().root.position.addInPlace(velocity.current.scale(deltaS));

      lastDelta.current = objectHash(delta);

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
        case touhou.MovementState.FLYING:
          handleFlying(deltaS);
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
    [handleFalling, handleFlying, handleWalking]
  );

  return null;
};
