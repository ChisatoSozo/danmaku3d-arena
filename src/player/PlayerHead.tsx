import { Matrix, Scalar } from "@babylonjs/core";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PropsWithChildren, useCallback, useEffect } from "react";
import { useEngine } from "react-babylonjs";
import { touhou } from "../protos-generated-client/proto.pbjs";
import { modDist, modRange } from "../utils/MathUtils";
import { getMovementState, getPose } from "../utils/MutableGlobals";
import { StableTransformNode } from "../utils/ReactBabylonUtils";

const look = {
  x: 0,
  y: 0,
};

const delta = {
  x: 0,
  y: 0,
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PlayerCameraProps {}

export const PlayerHead = ({
  children,
}: PropsWithChildren<PlayerCameraProps>) => {
  const engine = useEngine();

  const lookMoveHandler = useCallback((event: MouseEvent) => {
    if (!event.movementX && !event.movementY) {
      return;
    }

    const oldLook = { ...look };

    look.x += event.movementX / window.innerWidth;
    look.y += event.movementY / window.innerWidth;
    look.x = modRange(look.x, -1, 1);
    look.y =
      getMovementState() === touhou.MovementState.FLYING
        ? modRange(look.y, -1, 1)
        : Scalar.Clamp(look.y, -1, 1);

    delta.x = modDist(oldLook.x + 1, look.x + 1, 2);
    delta.y = modDist(oldLook.y + 1, look.y + 1, 2);

    if (getMovementState() === touhou.MovementState.FLYING) {
      const xDelta = delta.x;
      const yDelta = delta.y;

      getPose().root.rotation.multiplyInPlace(
        Quaternion.RotationAxis(Vector3.Forward(), xDelta * -0.4)
      );
      getPose().root.rotation.multiplyInPlace(
        Quaternion.RotationAxis(Vector3.Right(), yDelta * 0.4)
      );
    } else {
      const upM = Matrix.RotationX((0.99 * look.y * Math.PI) / 2);
      const rightM = Matrix.RotationY(look.x * Math.PI);

      getPose().head.rotation.copyFrom(Quaternion.FromRotationMatrix(upM));
      getPose().root.rotation.copyFrom(Quaternion.FromRotationMatrix(rightM));
    }
  }, []);

  const lockChange = useCallback(() => {
    const canvas = engine?.getRenderingCanvas();
    if (!canvas) return;
    if (document.pointerLockElement === canvas) {
      document.addEventListener("pointermove", lookMoveHandler, false);
    } else {
      document.removeEventListener("pointermove", lookMoveHandler, false);
    }
  }, [engine, lookMoveHandler]);

  const capturePointer = useCallback(() => {
    const canvas = engine?.getRenderingCanvas();
    if (!canvas) return;
    if (document.pointerLockElement === canvas) return;
    canvas.requestPointerLock =
      canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
    document.addEventListener("pointerlockchange", lockChange, false);
    document.addEventListener("mozpointerlockchange", lockChange, false);
  }, [engine, lockChange]);

  useEffect(() => {
    const canvas = engine?.getRenderingCanvas();
    if (!canvas) return;

    canvas.addEventListener("pointerdown", capturePointer);

    return () => {
      canvas.removeEventListener("pointerdown", capturePointer);
    };
  }, [capturePointer, engine]);

  return (
    <StableTransformNode
      name="cameraTransform"
      rotationQuaternion={getPose().head.rotation}
      position={getPose().head.position}
    >
      {children}
    </StableTransformNode>
  );
};
