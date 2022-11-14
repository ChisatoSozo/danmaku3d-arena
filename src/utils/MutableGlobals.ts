import { Quaternion, Vector3 } from "@babylonjs/core";
import { v4 } from "uuid";
import { touhou } from "../protos-generated-client/proto.pbjs";
import { getForwardVector } from "./MathUtils";

export interface Pose {
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
  shootingState: boolean;
}

interface MutableGlobals {
  username: string;
  poseStore: {
    [username: string]: Pose;
  };
  enemies: {
    position: Vector3;
    radius: number;
    health: number;
  }[];
  dead: boolean;
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
        position: new Vector3(0, 2, 0),
        rotation: new Quaternion(),
      },
      movementState: touhou.MovementState.WALKING,
      shootingState: false,
    },
  },
  enemies: [],
  dead: false,
};

export const getPose = (username = mutableGlobals.username) => {
  return mutableGlobals.poseStore[username];
};

export const getMovementState = (username = mutableGlobals.username) => {
  return mutableGlobals.poseStore[username].movementState;
};

export const getClosestEnemy = (username: string) => {
  const pose = getPose(username);
  const { position } = pose.head;
  let closestEnemy: Pose | undefined;
  let closestDistance = Infinity;
  for (const enemyUsername in mutableGlobals.poseStore) {
    if (enemyUsername === username) {
      continue;
    }
    const enemyPose = mutableGlobals.poseStore[enemyUsername];
    const distance = Vector3.Distance(position, enemyPose.head.position);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestEnemy = enemyPose;
    }
  }
  return closestEnemy;
};

export const getTarget = (username: string) => {
  const closestEnemy = getClosestEnemy(username);
  const pose = getPose(username);
  const length = closestEnemy
    ? pose.root.position.subtract(closestEnemy.root.position).length()
    : 0;

  const forward = getForwardVector(pose.head.rotation);
  const target = closestEnemy
    ? pose.head.position.add(forward.scale(length))
    : pose.head.position.add(forward.scale(100));
  return target;
};
