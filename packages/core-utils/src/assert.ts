/** narrows on anything the type system can read, not just nullability */
export function assert(x: unknown, message: string): asserts x {
  if (!x) throw new Error(message);
}

export function nullThrows<T>(x: T, message: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}
