export interface TemplateName {
  name: string,
  namespace: string | null
}

/**
 * Parses a template name, so something like `.render`
 * or `SomeNamespace.Thing`.
 */
export function parseTemplateName(rawName: string): TemplateName {
  const segments = rawName.split('.');
  const namespace = segments
    .slice(0, segments.length - 1)
    .join('.');

  return {
    name: segments[segments.length - 1],
    namespace: namespace || null
  };
}

/**
 * Joins the left item with the right item, or an array of items
 */
export function reverseJoin<T>(left: T, right: Array<T> | T): Array<T> {
  if (Array.isArray(right)) {
    return [left, ...right];
  }
  return [left, right];
}
