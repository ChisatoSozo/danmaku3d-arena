export const arrayEquals = <T>(array1: T[], array2: T[]) => {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let index in array1) {
    if (array1[index] !== array2[index]) {
      return false;
    }
  }
  return true;
};
