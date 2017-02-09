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