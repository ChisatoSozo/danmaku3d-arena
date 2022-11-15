import { GameDefinition } from "../types/gameDefinition/GameDefinition";

export const definition: GameDefinition = {
  stageDefinition: {
    type: "terrain",
    asset: {
      isAsset: true,
      type: "terrain",
      url: ":6100/terrain",
    },
    grass: {
      isAsset: true,
      type: "mesh",
      url: "grass.glb",
    },
    trees: [
      {
        isAsset: true,
        type: "mesh",
        url: "Tree_1.glb",
      },
      {
        isAsset: true,
        type: "mesh",
        url: "Tree_3.glb",
      },
      {
        isAsset: true,
        type: "mesh",
        url: "Tree_4.glb",
      },
    ],
  },
  playableCharacters: [
    {
      name: "Reimu",
      speed: 10,
      grazeDistance: 0.5,
      portraits: {
        angry: { asset: { isAsset: true, type: "texture", url: "angry.png" } },
        dissapoint: {
          asset: { isAsset: true, type: "texture", url: "dissapoint.png" },
        },
        excited: {
          asset: { isAsset: true, type: "texture", url: "excited.png" },
        },
        neutral: {
          asset: { isAsset: true, type: "texture", url: "neutral.png" },
        },
        shocked: {
          asset: { isAsset: true, type: "texture", url: "shocked.png" },
        },
        special: {
          asset: { isAsset: true, type: "texture", url: "special.png" },
        },
        tired: { asset: { isAsset: true, type: "texture", url: "tired.png" } },
      },
      emitters: [
        {
          asset: {
            isAsset: true,
            type: "mesh",
            url: "yinyangball.glb",
            hash: "yinyangball.glb",
          },
          position: { x: 1, y: 0, z: 1.0 },
          focusPosition: { x: 0.5, y: 0, z: 0.5 },
          mirrored: false,
          subEmitters: [
            {
              position: { x: 0, y: 0, z: 0 },
              bulletPattern: {
                type: "bulletPattern",
                isAsset: true,
                url: "defaultPlayerBulletPattern.json",
                hash: "8c2b56284f066cda8e7ef49e9fcdaa00730c6da5",
              },
            },
          ],
        },
        {
          asset: {
            isAsset: true,
            type: "mesh",
            url: "yinyangball.glb",
            hash: "yinyangball.glb",
          },
          position: { x: -1, y: 0, z: 1.0 },
          focusPosition: { x: -0.5, y: 0, z: 0.5 },
          mirrored: true,
          subEmitters: [
            {
              position: { x: 0, y: 0, z: 0 },
              bulletPattern: {
                type: "bulletPattern",
                isAsset: true,
                url: "defaultPlayerBulletPattern.json",
                hash: "8c2b56284f066cda8e7ef49e9fcdaa00730c6da5",
              },
            },
          ],
        },
      ],
    },
  ],
};
