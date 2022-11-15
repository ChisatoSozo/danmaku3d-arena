/* eslint-disable no-loop-func */
import { touhou } from "./protos-generated-client/proto.pbjs";
import { GameServiceServerStreaming } from "./protos-generated-server/proto.def";
import { Server } from "./server_terrain";

type Observer<T> = (value: T) => void;

class Observable<T> {
  _observers: Observer<T>[];

  constructor() {
    this._observers = [];
  }

  add(observer: Observer<T>) {
    this._observers.push(observer);
    return observer;
  }

  remove(observer: Observer<T>) {
    const index = this._observers.indexOf(observer);
    if (index !== -1) {
      this._observers.splice(index, 1);
    }
  }

  notify(data: T) {
    this._observers.forEach((observer) => observer(data));
  }
}

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

const eventObservable = new Observable<touhou.INamedEvent>();

const observableToAsyncIterable = <T>(
  observable: Observable<T>
): AsyncIterable<T> => {
  return {
    [Symbol.asyncIterator]() {
      let resolve: (value: IteratorResult<T>) => void;
      let promise = new Promise<IteratorResult<T>>((res, rej) => {
        resolve = res;
      });

      let subscription = observable.add((value) => {
        resolve({
          done: false,
          value,
        });
        promise = new Promise<IteratorResult<T>>((res, rej) => {
          resolve = res;
        });
      });

      return {
        next() {
          return promise;
        },
        return() {
          observable.remove(subscription);
          return Promise.resolve({
            done: true,
            value: undefined,
          });
        },
        throw(error) {
          observable.remove(subscription);
          return Promise.reject(error);
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };
    },
  };
};

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
      }

      endServerIterable?.();

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
  EventStream: (clientIterable) => {
    let endServerIterable: () => void;

    const ingest = async () => {
      for await (let event of clientIterable) {
        if (!event) {
          continue;
        }
        eventObservable.notify(event);
      }

      endServerIterable?.();
    };

    ingest();

    return observableToAsyncIterable(eventObservable);
  },
});

server.listen(5000);

new Server();
