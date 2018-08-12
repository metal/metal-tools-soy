/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    Evaluation,
    FileName,
    ImplPartialMapping,
    Index,
    Mapping,
    PartialMapping,
    Status
} from './global';
import { SourceLocation } from '@babel/types';

export function implMapping({
    column,
    line,
    name,
    source,
    status,
    parent,
    type,
}: ImplPartialMapping): PartialMapping {
    return {
        generated: {},
        source,
        original: {
            line,
            column,
        },
        name,
        status,
        parent,
        type
    };
}

interface CreatePartialMapping {
    end: Index,
    name: string,
    source: FileName,
    start: Index,
    parent: string,
    type: string
}

export function createPartialMapping({
    end,
    name,
    source,
    start,
    parent,
    type
}: CreatePartialMapping): Evaluation {
    return [
        implMapping({
            column: start.column,
            line: start.line,
            source,
            name,
            status: 'start',
            parent,
            type
        }),
        start.line !== end.line && implMapping({
            column: end.column,
            line: end.line,
            source,
            name,
            status: 'end',
            parent,
            type
        })
    ].filter(item => item);
}

export function fillMapping(
    {
        name,
        original,
        parent,
        source,
        status,
        type
    }: PartialMapping,
    loc: Index
): Mapping {
    return {
        generated: {
            ...loc
        },
        name: `${type} ${parent} ${name} ${status}`,
        original,
        source
    };
}

export function createMapping(
    partialMapping: PartialMapping[],
    type: string,
    name: string,
    loc: SourceLocation | null,
    parentName?: string
): Array<Mapping|boolean> {
    const mappedStart = find(partialMapping, type, name, 'start', parentName);
    const mappedEnd = find(partialMapping, type, name, 'end', parentName);

    if (loc === null) return [false];

    const isEnd = loc.start.line !== loc.end.line || mappedEnd;

    const mapping = [
        fillMapping(
            mappedStart,
            loc.start
        ),
        isEnd && fillMapping(
            mappedEnd,
            loc.end
        )
    ].filter(item => item);

    partialMapping.splice(partialMapping.indexOf(mappedStart), 1);

    if (isEnd) partialMapping.splice(partialMapping.indexOf(mappedEnd), 1);

    return mapping;
}

export function find(
    partialMapping: PartialMapping[], 
    type: string, 
    name: string, 
    status: Status,
    parentName?: string
): PartialMapping {
    return <PartialMapping>partialMapping.find(
        elem => 
            type === elem.type 
            && name === elem.name 
            && status === elem.status
            && (
                parentName ? parentName === elem.parent : true
            )
    );
}