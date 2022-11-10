import { Quaternion, Vector3 } from "@babylonjs/core";
import { useEffect, useMemo } from "react";
import { useAfterRender } from "react-babylonjs";
import { useUsers } from "../containers/UserContainer";
import { GameServiceClientStreaming } from "../protos-generated-client/proto.def";
import { touhou } from "../protos-generated-client/proto.pbjs";
import { arrayEquals } from "../utils/CollectionUtils";
import { getPose, mutableGlobals, Pose } from "../utils/MutableGlobals";

const poseFromProto = (proto: touhou.IPose) => {
  return {
    head: {
      position: new Vector3(
        proto.head?.position?.x || 0,
        proto.head?.position?.y || 0,
        proto.head?.position?.z || 0
      ),
      rotation: new Quaternion(
        proto.head?.rotation?.x || 0,
        proto.head?.rotation?.y || 0,
        proto.head?.rotation?.z || 0,
        proto.head?.rotation?.w || 0
      ),
    },
    root: {
      position: new Vector3(
        proto.root?.position?.x || 0,
        proto.root?.position?.y || 0,
        proto.root?.position?.z || 0
      ),
      rotation: new Quaternion(
        proto.root?.rotation?.x || 0,
        proto.root?.rotation?.y || 0,
        proto.root?.rotation?.z || 0,
        proto.root?.rotation?.w || 0
      ),
    },
    leftHand: {
      position: new Vector3(
        proto.leftHand?.position?.x || 0,
        proto.leftHand?.position?.y || 0,
        proto.leftHand?.position?.z || 0
      ),
      rotation: new Quaternion(
        proto.leftHand?.rotation?.x || 0,
        proto.leftHand?.rotation?.y || 0,
        proto.leftHand?.rotation?.z || 0,
        proto.leftHand?.rotation?.w || 0
      ),
    },
    rightHand: {
      position: new Vector3(
        proto.rightHand?.position?.x || 0,
        proto.rightHand?.position?.y || 0,
        proto.rightHand?.position?.z || 0
      ),
      rotation: new Quaternion(
        proto.rightHand?.rotation?.x || 0,
        proto.rightHand?.rotation?.y || 0,
        proto.rightHand?.rotation?.z || 0,
        proto.rightHand?.rotation?.w || 0
      ),
    },
    movementState: proto.movementState || touhou.MovementState.WALKING,
  };
};

const protoFromPose = (pose: Pose) => {
  return {
    head: {
      position: {
        x: pose.head?.position?.x || 0,
        y: pose.head?.position?.y || 0,
        z: pose.head?.position?.z || 0,
      },
      rotation: {
        x: pose.head?.rotation?.x || 0,
        y: pose.head?.rotation?.y || 0,
        z: pose.head?.rotation?.z || 0,
        w: pose.head?.rotation?.w || 0,
      },
    },
    root: {
      position: {
        x: pose.root?.position?.x || 0,
        y: pose.root?.position?.y || 0,
        z: pose.root?.position?.z || 0,
      },
      rotation: {
        x: pose.root?.rotation?.x || 0,
        y: pose.root?.rotation?.y || 0,
        z: pose.root?.rotation?.z || 0,
        w: pose.root?.rotation?.w || 0,
      },
    },
    leftHand: {
      position: {
        x: pose.leftHand?.position?.x || 0,
        y: pose.leftHand?.position?.y || 0,
        z: pose.leftHand?.position?.z || 0,
      },
      rotation: {
        x: pose.leftHand?.rotation?.x || 0,
        y: pose.leftHand?.rotation?.y || 0,
        z: pose.leftHand?.rotation?.z || 0,
        w: pose.leftHand?.rotation?.w || 0,
      },
    },
    rightHand: {
      position: {
        x: pose.rightHand?.position?.x || 0,
        y: pose.rightHand?.position?.y || 0,
        z: pose.rightHand?.position?.z || 0,
      },
      rotation: {
        x: pose.rightHand?.rotation?.x || 0,
        y: pose.rightHand?.rotation?.y || 0,
        z: pose.rightHand?.rotation?.z || 0,
        w: pose.rightHand?.rotation?.w || 0,
      },
    },
    movementState: pose.movementState || touhou.MovementState.WALKING,
  };
};

export const Online = () => {
  const client = useMemo(() => {
    return new GameServiceClientStreaming(
      `ws://${window.location.hostname}:5000`,
      true
    );
  }, []);

  const transformSyncStream = useMemo(() => {
    return client.TransformSync();
  }, [client]);

  const { setUsers } = useUsers();

  useEffect(() => {
    const updatePositions = async () => {
      for await (let namedTransform of transformSyncStream.serverIterable) {
        let usernames = namedTransform.otherNamedTransforms?.map(
          (otherNamedTransform) => otherNamedTransform.username
        );

        namedTransform.otherNamedTransforms?.forEach(
          ({ username, transform }) => {
            if (!username || !transform) {
              return;
            }
            if (username !== mutableGlobals.username) {
              const pose = poseFromProto(transform);

              if (!mutableGlobals.poseStore[username]) {
                mutableGlobals.poseStore[username] = pose;
              }
              mutableGlobals.poseStore[username].head.position.copyFrom(
                pose.head.position
              );
              mutableGlobals.poseStore[username].head.rotation.copyFrom(
                pose.head.rotation
              );
              mutableGlobals.poseStore[username].root.position.copyFrom(
                pose.root.position
              );
              mutableGlobals.poseStore[username].root.rotation.copyFrom(
                pose.root.rotation
              );
              mutableGlobals.poseStore[username].rightHand?.position.copyFrom(
                pose.rightHand.position
              );
              mutableGlobals.poseStore[username].rightHand?.rotation.copyFrom(
                pose.rightHand.rotation
              );
              mutableGlobals.poseStore[username].leftHand?.position.copyFrom(
                pose.leftHand.position
              );
              mutableGlobals.poseStore[username].leftHand?.rotation.copyFrom(
                pose.leftHand.rotation
              );
              mutableGlobals.poseStore[username].movementState =
                pose.movementState;
            }
          }
        );

        setUsers((users) => {
          if (!usernames) {
            return users;
          }
          const nonEmpty = usernames.filter(
            (username) => !!username && username !== mutableGlobals.username
          ) as string[];

          nonEmpty.sort();

          if (arrayEquals(nonEmpty, users)) {
            return users;
          }

          return nonEmpty;
        });
      }
    };
    updatePositions();
    return () => {
      transformSyncStream.sendStream.close();
    };
  }, [setUsers, transformSyncStream]);

  useAfterRender(() => {
    transformSyncStream.sendStream.send({
      namedTransform: {
        username: mutableGlobals.username,
        transform: protoFromPose(getPose()),
      },
    });
  });

  return null;
};
