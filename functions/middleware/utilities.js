export const objectsUniq = (objectArray, attr) => {
  return objectArray.filter(
    (v, i, a) => a.findIndex((v2) => v2[attr] === v[attr]) === i
  );
};
