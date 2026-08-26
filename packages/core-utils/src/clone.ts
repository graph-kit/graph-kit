/**
 * clones an object while preserving the references of non-primitive values
 *
 * @param obj - the object to clone
 * @returns the cloned object
 */
export const clone = (obj: Record<any, any>) => {
  const cloned = { ...obj };
  for (const key in cloned) {
    if (typeof cloned[key] === 'object') {
      cloned[key] = clone(cloned[key]);
    }
  }
  return cloned;
};

export const jsonClone = <T>(obj: T) => {
  if (obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj)) as T;
};
