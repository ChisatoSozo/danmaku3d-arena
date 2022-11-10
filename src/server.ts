/* eslint-disable no-loop-func */
import { touhou } from "./protos-generated-client/proto.pbjs";
import { GameServiceServerStreaming } from "./protos-generated-server/proto.def";

let players: {
  [username: string]: touhou.IPose;
} = {};

let TIME_STEP = 10;

async function* step() {
  let outerResolve: () => void;
  let promise = new Promise<void>((resolve) => {
    outerResolve = resolve;
  });

  let keepGoing = true;

  let interval = setInterval(() => {
    outerResolve();
    promise = new Promise<void>((resolve, reject) => {
      outerResolve = resolve;
    });
  }, TIME_STEP);

  while (keepGoing) {
    await promise;
    yield {
      end: () => {
        keepGoing = false;
        clearInterval(interval);
      },
    };
  }
}

const server = new GameServiceServerStreaming({
  Login: ({ username }) => {
    if (!username) {
      return {};
    }
    players[username] = {};
    return {
      username,
    };
  },
  TransformSync: (clientIterable) => {
    let endServerIterable: () => void;

    const ingest = async () => {
      let outerUsername;
      for await (let { namedTransform } of clientIterable) {
        if (!namedTransform) {
          continue;
        }
        const { username, transform } = namedTransform;
        outerUsername = username;

        if (!username || !transform) {
          continue;
        }

        if (!players[username]) {
          console.log(username + " has connected");
        }

        players[username] = transform;

        console.log(transform.root?.position);
      }

      endServerIterable();

      if (outerUsername) {
        delete players[outerUsername];
        console.log(outerUsername + " has disconnected");
      }
    };

    ingest();

    async function* serverIterable() {
      for await (let { end } of step()) {
        endServerIterable = end;
        const playersArray: touhou.INamedTransform[] = Object.keys(players).map(
          (username) => ({
            username,
            transform: players[username],
          })
        );
        yield {
          otherNamedTransforms: playersArray,
        };
      }
    }

    return serverIterable();
  },
});

server.listen(5000);
