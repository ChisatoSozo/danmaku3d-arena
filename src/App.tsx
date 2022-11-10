import { Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders";
import { Engine, Scene } from "react-babylonjs";
import { UserContainer } from "./containers/UserContainer";
import { Characters } from "./dynamic-renderables/Characters";
import { Online } from "./network/Online";
import { BindActionObservables } from "./player/ActionObservables";
import { Physics } from "./player/Physics";
import { PlayerCamera } from "./player/PlayerCamera";
import { PlayerRoot } from "./player/PlayerRoot";
import { SkyBox } from "./terrain/SkyBox";

function App() {
  return (
    <Engine antialias adaptToDeviceRatio canvasId="babylonJS">
      <Scene>
        <UserContainer>
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
          <ground name="ground" width={1000} height={1000}>
            <standardMaterial name="groundmat" useLogarithmicDepth>
              <texture
                url="/assets/images/grass.jpg"
                assignTo="diffuseTexture"
                uScale={300}
                vScale={300}
              />
            </standardMaterial>
          </ground>
          <Characters />
          <Online />
          <SkyBox />
        </UserContainer>
      </Scene>
    </Engine>
  );
}

export default App;
