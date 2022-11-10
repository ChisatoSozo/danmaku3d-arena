import { Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders";
import { Suspense } from "react";
import { Engine, Model, Scene } from "react-babylonjs";
import { BindActionObservables } from "./player/ActionObservables";
import { Physics } from "./player/Physics";
import { PlayerCamera } from "./player/PlayerCamera";
import { PlayerRoot } from "./player/PlayerRoot";

function App() {
  return (
    <Engine antialias adaptToDeviceRatio canvasId="babylonJS">
      <Scene>
        <PlayerRoot>
          <PlayerCamera />
        </PlayerRoot>
        <BindActionObservables />
        <Physics />
        <hemisphericLight
          name="light1"
          intensity={0.7}
          direction={Vector3.Up()}
        />
        <Suspense
          fallback={<box name="fallback" position={new Vector3(0, 0, 0)} />}
        >
          <Model
            name="terrain"
            rootUrl={`/assets/models/`}
            sceneFilename="landscapeTileAdraco.glb"
            position={new Vector3(0, 0, 0)}
          />
        </Suspense>
      </Scene>
    </Engine>
  );
}

export default App;
