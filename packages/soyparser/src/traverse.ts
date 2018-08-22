import * as S from './types';

export type VisitFunction<T> = (node: T) => void;

export interface VisitObject<T> {
  enter?: VisitFunction<T>;
  exit?: VisitFunction<T>;
}

export type Visit<T> = VisitFunction<T> | VisitObject<T>;

export type Visitor = {
  [K in S.NodeType]?: Visit<S.NodeTypes[K]>;
}

function noop() {}

function getEnter<T>(handler: Visit<T> | undefined): VisitFunction<T> {
  if (typeof handler === 'function') {
    return handler;
  } if (handler && handler.enter) {
    return handler.enter;
  }

  return noop;
}

function getExit<T>(handler: Visit<T> | undefined): VisitFunction<T> {
  if (typeof handler === 'object' && handler.exit) {
    return handler.exit;
  }

  return noop;
}

export function visit<T extends S.Node>(node: T, visitor: Visitor): void {
  const handler = visitor[node.type] as Visit<T> | undefined;

  getEnter(handler)(node);

  if (node.body) {
    if (Array.isArray(node.body)) {
      node.body.forEach(node => visit(node, visitor));
    } else {
      visit(node.body, visitor);
    }
  }

  getExit(handler)(node);
}
