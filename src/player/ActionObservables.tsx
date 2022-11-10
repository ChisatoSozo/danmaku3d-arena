import { Observable, Vector2 } from "@babylonjs/core";
import { KeyboardEvent, useCallback, useEffect } from "react";

export const actionObservables = {
  move: new Observable<Vector2>(),
  jump: new Observable<null>(),
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

      emitMoveObservable();
    };
    window.addEventListener("keydown", onKeyDownHandler);
    window.addEventListener("keyup", onKeyUpHandler);

    return () => {
      window.removeEventListener("keydown", onKeyDownHandler);
      window.removeEventListener("keyup", onKeyUpHandler);
    };
  }, [emitMoveObservable]);

  return null;
};
