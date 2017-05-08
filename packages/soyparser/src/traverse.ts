import * as S from './types';

export type VisitFunction<T> = (node: T) => void;

export interface VisitObject<T> {
  enter?: VisitFunction<T>;
  exit?: VisitFunction<T>;
}

export type Visit<T> = VisitFunction<T> | VisitObject<T>;

export interface Visitor {
  BooleanLiteral?: Visit<S.BooleanLiteral>;
  Call?: Visit<S.Call>;
  DelTemplate?: Visit<S.DelTemplate>;
  FunctionCall?: Visit<S.FunctionCall>;
  Interpolation?: Visit<S.Interpolation>;
  LetStatement?: Visit<S.LetStatement>;
  MapItem?: Visit<S.MapItem>;
  MapLiteral?: Visit<S.MapLiteral>;
  NumberLital?: Visit<S.NumberLiteral>;
  OtherCmd?: Visit<S.OtherCmd>;
  OtherExpression?: Visit<S.OtherExpression>;
  Param?: Visit<S.Param>;
  Program?: Visit<S.Program>;
  Reference?: Visit<S.Reference>;
  StringLiteral?: Visit<S.StringLiteral>;
  Template?: Visit<S.Template>;
  Ternary?: Visit<S.Ternary>;
  [propName: string]: Visit<S.Node> | undefined;
}

function noop() {}

function getEnter<T>(handler: Visit<T> | undefined): VisitFunction<T> {
  if (typeof handler === 'function') {
    return handler;
  } else if (handler && handler.enter) {
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

export function visit(node: S.Node, visitor: Visitor): void {
  const handler = visitor[node.type];

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
