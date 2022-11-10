import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import React, { useEffect, useRef } from "react";
import {
  BabylonNode,
  FiberTransformNodeProps,
  FiberTransformNodePropsCtor,
  useBeforeRender,
} from "react-babylonjs";

export const StableTransformNode: React.FC<
  FiberTransformNodeProps &
    FiberTransformNodePropsCtor &
    BabylonNode<TransformNode>
> = (props) => {
  const transformNodeRef = useRef<TransformNode>(null);

  const { position, rotationQuaternion, ...otherProps } = props;

  useEffect(() => {
    if (!transformNodeRef.current) return;
    if (position) transformNodeRef.current.position = position;
  }, [position]);

  useBeforeRender(() => {
    if (!transformNodeRef.current || !rotationQuaternion) return;
    if (!transformNodeRef.current.rotationQuaternion) {
      transformNodeRef.current.rotationQuaternion = rotationQuaternion.clone();
    }
    transformNodeRef.current.rotationQuaternion.copyFrom(rotationQuaternion);
  });

  return (
    <transformNode ref={transformNodeRef} {...otherProps}>
      {props.children}
    </transformNode>
  );
};
