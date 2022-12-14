import { Observable, Vector2 } from "@babylonjs/core";
import { KeyboardEvent, useCallback, useEffect } from "react";
import { touhou } from "../protos-generated-client/proto.pbjs";
import { getPose } from "../utils/MutableGlobals";

let lastJumpTime = 0;

export const actionObservables = {
  move: new Observable<Vector2>(),
  jump: new Observable<null>(),
  fly: new Observable<null>(),
  flyBoost: new Observable<boolean>(),
  land: new Observable<null>(),
  shoot: new Observable<boolean>(),
};

const movementKeys = {
  forward: "w",
  backward: "s",
  left: "a",
  right: "d",
};

const movementKeysDown = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

export const BindActionObservables = () => {
  const emitMoveObservable = useCallback(() => {
    const move = new Vector2();
    if (movementKeysDown.forward) move.y += 1;
    if (movementKeysDown.backward) move.y -= 1;
    if (movementKeysDown.left) move.x -= 1;
    if (movementKeysDown.right) move.x += 1;
    const normalized = move.normalize();

    actionObservables.move.notifyObservers(normalized);
  }, []);

  useEffect(() => {
    const onKeyDownHandler = (event: Event) => {
      const keyboardEvent = event as unknown as KeyboardEvent;

      for (let direction in movementKeys) {
        const typedDirection = direction as keyof typeof movementKeys;
        if (keyboardEvent.key === movementKeys[typedDirection]) {
          movementKeysDown[typedDirection] = true;
        }
      }

      if (keyboardEvent.key === " ") {
        if (getPose().movementState === touhou.MovementState.FALLING && Date.now() - lastJumpTime < 500) {
          actionObservables.fly.notifyObservers(null);
        } else {
          actionObservables.jump.notifyObservers(null);
        }
        actionObservables.flyBoost.notifyObservers(true);
      }

      emitMoveObservable();
    };

    const onKeyUpHandler = (event: Event) => {
      const keyboardEvent = event as unknown as KeyboardEvent;

      for (let direction in movementKeys) {
        const typedDirection = direction as keyof typeof movementKeys;
        if (keyboardEvent.key === movementKeys[typedDirection]) {
          movementKeysDown[typedDirection] = false;
        }
      }

      if (keyboardEvent.key === " ") {
        actionObservables.flyBoost.notifyObservers(false);
        lastJumpTime = Date.now();
      }

      emitMoveObservable();
    };

    const onPointerDownHandler = () => {
      actionObservables.shoot.notifyObservers(true);
      getPose().shootingState = true;
    };

    const onPointerUpHandler = () => {
      actionObservables.shoot.notifyObservers(false);
      getPose().shootingState = false;
    };

    window.addEventListener("keydown", onKeyDownHandler);
    window.addEventListener("keyup", onKeyUpHandler);
    window.addEventListener("pointerdown", onPointerDownHandler);
    window.addEventListener("pointerup", onPointerUpHandler);

    return () => {
      window.removeEventListener("keydown", onKeyDownHandler);
      window.removeEventListener("keyup", onKeyUpHandler);
      window.removeEventListener("pointerdown", onPointerDownHandler);
      window.removeEventListener("pointerup", onPointerUpHandler);
    };
  }, [emitMoveObservable]);

  return null;
};
