# Project Preferences

Prefer early-returns except when there's only one conditional in a function.
Example: prefer `const x = getX(); if (!x) { return; } ...` over `const x = getX(); if (x) { ... }`.

Prefer `undefined` over `null`.

Prefer smaller, task-scoped files over larger ones.

Don't abbreviate names.
Example: instead of `val`/`vals` prefer `value`/`values`.

In JSDoc, use @link to link public API references.

Prefer `assert` and `nullThrows` for narrowing invariants over non-null assertions or casting. Example:

```ts
export function assert(x: unknown, message: string): asserts x {
  if (!x) {
    throw new Error(message);
  }
}

export function nullThrows<T>(x: T, message: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}
```

Only add comments rarely and sparingly.
Example: don't restate things that are either implied by the type system or apparent by reading the next few lines.

In large lists, such as static array content or object literal keys, order items alphabetically. Exempt order-sensitive content i.e. middleware chains, precedence lists, config override arrays etc.

In JSON files, even if they're not linted to stay alphabetical, keep them alphabetical (excluding `package.json` files).

When a variable is only used once, prefer to inline it unless it includes multiple logical operands.
