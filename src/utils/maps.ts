export function mapToObject<V>(map: Map<string, V>): {[key: string]: V} {
  const result: {[key: string]: V} = Object.create(null);
  for (const [k, v] of map) {
    result[k] = v;
  }
  return result;
}

export function objectToMap<V>(obj: Map<string, V>): Map<string, V> {
  const result = new Map<string, V>();
  for (const k in obj) {
    result.set(k, obj[k]);
  }
  return result;
}

export function mapValues<U, V>(
    obj: {[key: string]: U}, f: (U) => V): {[key: string]: V} {
  const result = Object.create(null);
  for (const key of Object.keys(obj)) {
    result[key] = f(obj[key]);
  }
  return result;
}

export function mapKeys<V>(
    obj: {[key: string]: V}, f: (key: string) => string): {[key: string]: V} {
  const result = Object.create(null);
  for (const key of Object.keys(obj)) {
    result[f(key)] = obj[key];
  }
  return result;
}
