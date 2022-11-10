import { Quaternion, Vector3 } from "@babylonjs/core";
import { v4 } from "uuid";
import { touhou } from "../protos-generated/proto.pbjs";

interface MutableGlobals {
  username: string;
  poseStore: {
    [username: string]: {
      head: {
        position: Vector3;
        rotation: Quaternion;
      };
      root: {
        position: Vector3;
        rotation: Quaternion;
      };
      leftHand?: {
        position: Vector3;
        rotation: Quaternion;
      };
      rightHand?: {
        position: Vector3;
        rotation: Quaternion;
      };
      movementState: touhou.MovementState;
    };
  };
}

const username = v4();

export const mutableGlobals: MutableGlobals = {
  username,
  poseStore: {
    [username]: {
      head: {
        position: new Vector3(0, 0, 0),
        rotation: new Quaternion(),
      },
      root: {
        position: new Vector3(0, 0, 0),
        rotation: new Quaternion(),
      },
      movementState: touhou.MovementState.WALKING,
    },
  },
};

export const getPose = () => {
  return mutableGlobals.poseStore[mutableGlobals.username];
};

export const getMovementState = () => {
  return mutableGlobals.poseStore[mutableGlobals.username].movementState;
};
