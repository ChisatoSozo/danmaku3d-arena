import { Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders";
import { PropsWithChildren } from "react";
import { Scene, useScene } from "react-babylonjs";
import { GameContainer } from "./containers/GameContainer";
import { UserContainer } from "./containers/UserContainer";
import { Characters } from "./dynamic-renderables/Characters";
import { Emitters } from "./dynamic-renderables/Emitters";
import Engine from "./forks/Engine";
import { definition } from "./gameDefinition/definition";
import { useLoadGame } from "./hooks/useLoadGame";
import { Online } from "./network/Online";
import { BindActionObservables } from "./player/ActionObservables";
import { Physics } from "./player/Physics";
import { PlayerHead } from "./player/PlayerHead";
import { PlayerRoot } from "./player/PlayerRoot";
import { Sun } from "./terrain/Sun";
import { Terrain } from "./terrain/Terrain";
import { mutableGlobals } from "./utils/MutableGlobals";

const engineOptions = { stencil: true };

function LoadGame({ children }: PropsWithChildren<{}>) {
  const scene = useScene();
  const gameLoaderOutput = useLoadGame(definition, "", undefined, scene || undefined);

  if (!scene) {
    return null;
  }

  if (!gameLoaderOutput.loadedAssets || gameLoaderOutput.loadingAssets) {
    return (
      <>
        <targetCamera name="targetCamera" position={new Vector3(0, 0, 0)} />
      </>
    );
  }

  return <GameContainer assets={gameLoaderOutput.loadedAssets}>{children}</GameContainer>;
}

function App() {
  return (
    <Engine antialias adaptToDeviceRatio canvasId="babylonJS" engineOptions={engineOptions}>
      <Scene>
        <LoadGame>
          <UserContainer>
            <Sun>
              <PlayerRoot>
                <Emitters username={mutableGlobals.username} />
                <PlayerHead>
                  <targetCamera fov={1.0472} name="camera" minZ={0.1} maxZ={10000} position={new Vector3(0, 0, 0)} />
                </PlayerHead>
              </PlayerRoot>
              <BindActionObservables />
              <Physics />
              <hemisphericLight name="light1" intensity={0.1} direction={Vector3.Up()} />
              <Characters />
              <Online />
              {definition.stageDefinition.type === "terrain" && <Terrain terrainAssetDefinition={definition.stageDefinition} />}
            </Sun>
          </UserContainer>
        </LoadGame>
      </Scene>
    </Engine>
  );
}

export default App;
