export const traverseJson = (
  json: { [key: string]: any },
  callback: (element: any, key: string) => void
) => {
  if (typeof json === "object") {
    Object.keys(json).forEach((key) => {
      callback(json[key], key);
      traverseJson(json[key], callback);
    });
  }
};

export const traverseJsonAsync = async (
  json: { [key: string]: any },
  callback: (element: any, key: string) => Promise<void>
) => {
  if (typeof json === "object") {
    const keys = Object.keys(json);
    for (let key of keys) {
      await callback(json[key], key);
      await traverseJsonAsync(json[key], callback);
    }
  }
};
