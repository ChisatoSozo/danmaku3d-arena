import { AnimationGroup, PBRMaterial, TransformNode } from "@babylonjs/core";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import {
  BabylonNode,
  FiberTransformNodeProps,
  FiberTransformNodePropsCtor,
} from "react-babylonjs";
import { useMeshAsset } from "../loaders/meshLoader";
import { MeshAssetDefinition } from "../types/gameDefinition/AssetDefinition";

type MeshFromAssetDefinitionProps = {
  assetDefinition: MeshAssetDefinition;
  activeAnimation?: string;
  alpha?: number;
  onMeshLoaded?: (rootNodes: TransformNode[]) => void;
} & FiberTransformNodeProps &
  FiberTransformNodePropsCtor &
  BabylonNode<TransformNode>;

export const MeshFromAssetDefinition = React.forwardRef<
  TransformNode,
  MeshFromAssetDefinitionProps
>(
  (
    {
      assetDefinition,
      activeAnimation,
      onMeshLoaded,
      alpha,
      ...transformNodeProps
    },
    ref
  ) => {
    const { container, additionalData } = useMeshAsset(assetDefinition);
    const _transformNodeRef = useRef<TransformNode>(null);
    const transformNodeRef = (ref ||
      _transformNodeRef) as MutableRefObject<TransformNode | null>;
    const [animations, setAnimations] = useState<AnimationGroup[]>();
    const [rootNodes, setRootNodes] = useState<TransformNode[]>([]);

    useEffect(() => {
      rootNodes.forEach((node) => {
        node.getChildMeshes().forEach((mesh) => {
          const material = mesh.material as PBRMaterial;
          if (material) {
            if (alpha !== undefined) {
              material.alpha = alpha;
              material.transparencyMode = 2;
              material.backFaceCulling = true;
            }
            material.useLogarithmicDepth = true;
          }
        });
      });
    }, [rootNodes, alpha]);

    useEffect(() => {
      if (!transformNodeRef.current) {
        return;
      }
      const instantiated = container.instantiateModelsToScene();

      instantiated.rootNodes.forEach((node) => {
        node.parent = transformNodeRef.current;
      });

      if (onMeshLoaded) {
        onMeshLoaded(instantiated.rootNodes);
      }
      setRootNodes(instantiated.rootNodes);

      setAnimations(instantiated.animationGroups);

      return () => {
        instantiated.animationGroups.forEach((group) => {
          group.dispose();
        });
        instantiated.skeletons.forEach((skeleton) => {
          skeleton.dispose();
        });
        instantiated.rootNodes.forEach((node) => {
          node.dispose();
        });
      };
    }, [container, onMeshLoaded, transformNodeRef]);

    useEffect(() => {
      if (!activeAnimation) return;
      if (!animations) return;
      if (!animations.length)
        throw new Error(`No animations on asset ${assetDefinition.hash}`);
      if (!additionalData)
        throw new Error(`No additional data found for ${assetDefinition.hash}`);
      if (!additionalData.animations)
        throw new Error(
          `No animations found in additional data for ${assetDefinition.hash}`
        );
      const animationNameOnAsset = additionalData.animations[activeAnimation];
      const animation = animations.find(
        (animation) => animation.name === `Clone of ${animationNameOnAsset}`
      );
      if (!animation)
        throw new Error(
          `Requested animation ${animationNameOnAsset} not found`
        );
      animation.play(true);
    }, [activeAnimation, additionalData, animations, assetDefinition.hash]);

    return (
      <transformNode
        ref={transformNodeRef}
        {...transformNodeProps}
      ></transformNode>
    );
  }
);
