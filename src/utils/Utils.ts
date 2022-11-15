export const host = `${window.location.protocol}//${window.location.hostname}`;
export const assetHost = `${window.location.protocol}//${window.location.hostname}:3000/`;

export const assertNever = (shouldBeNever: never) => {
  throw new Error("Was not never: " + JSON.stringify(shouldBeNever));
};

type TwoLayerDeepObject<T extends string> = {
  [key in T]?: { [key: string]: any };
};

export const twoLayerCopy = <T extends string>(
  object: TwoLayerDeepObject<T>
) => {
  const copy: TwoLayerDeepObject<T> = {};
  for (const key in object) {
    const value = object[key as T];
    copy[key] = { ...value };
  }
  return copy;
};

export const camelCaseToSpaces = (str: string) => {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

export const sleep0 = () => new Promise((resolve) => setTimeout(resolve, 0));
