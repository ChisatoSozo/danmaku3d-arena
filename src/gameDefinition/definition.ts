import { GameDefinition } from "../types/gameDefinition/GameDefinition";

export const definition: GameDefinition = {
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
  stages: [
    {
      title: "What an Odd World",
      subtitle: "I wonder what we'll find",
      bounds: { min: { x: -10, y: 0, z: -15 }, max: { x: 10, y: 10, z: 15 } },
      stageMeshes: [
        {
          asset: {
            isAsset: true,
            type: "mesh",
            url: "landscapeTileAdraco.glb",
            hash: "landscapeTileAdraco.glb",
          },
          length: 125,
        },
        {
          asset: {
            isAsset: true,
            type: "mesh",
            url: "landscapeTileBdraco.glb",
            hash: "landscapeTileBdraco.glb",
          },
          length: 125,
        },
      ],
      phases: [
        {
          delayAfter: 0,
          instructions: [
            {
              at: 0,
              _editorTrack: 1,
              type: "playMusic",
              asset: {
                isAsset: true,
                type: "sound",
                url: "Dolls in Pseudo Paradise - Eternal Shrine Maiden.mp3",
                hash: "Dolls in Pseudo Paradise - Eternal Shrine Maiden.mp3",
              },
            },
            {
              at: 1000,
              _editorTrack: 1,
              type: "spawnEnemy",
              hidden: false,
              asset: {
                isAsset: true,
                type: "mesh",
                url: "blueFairy.glb",
              },
              hurtSound: {
                isAsset: true,
                type: "sound",
                url: "damage.wav",
              },
              position: { x: 0, y: 0, z: 15 },
              instructions: [],
            },
          ],
        },
      ],
    },
  ],
};
