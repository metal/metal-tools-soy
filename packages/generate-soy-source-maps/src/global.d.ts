import { types as S } from "soyparser";

interface ImplPartialMapping {
    column: number;
    line: number;
    name: string;
    parent: string;
    source: FileName;
    status: Status;
    type: string;
}

export interface TemplateName {
    name: string,
    namespace: string | null
}

export type Visit<T> = (node: T) => void;

export interface Visitor {
    [propName: string]: Visit<any> | undefined;
}

export interface Index {
    line: number;
    column: number;
}

export interface Mark {
    start: Index;
    end: Index;
}

export type FileName = string;
export type Evaluation = Array<PartialMapping|boolean>;

type ObjectMapping = Object

type Status = 'start'|'end';

interface PartialMapping {
    generated?: Index|Object;
    name: string;
    original: Index;
    parent: string;
    source: FileName;
    status: Status;
    type: string;
}

interface Mapping {
    generated: Index;
    source: FileName;
    original: Index;
    name: string;
}