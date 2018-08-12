/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { types as S } from 'soyparser';
import { PartialMapping } from './global';

export function implTemplateName(name: string, namespace: (string | null)): string {
    return `${namespace}.${name}`;
}

export function getLetName(name: string): string {
    return name.split('__')[0];
}

export function isValidLetStatement(name: string): boolean {
    return name.endsWith(getLetName(name)) && /soy+\d+/.test(name);
}

export function isValidName(name: string): boolean {
    return /\$/.test(name);
}

export function sortPartialMapping(mapping: PartialMapping[]) {
    return mapping.sort((a, b) => {
        if (a.original.line > b.original.line) {
            return 1;
        }

        if (a.original.line < b.original.line) {
            return -1;
        }

        return 0;
    });
}

export function closest(
    type: string, 
    ast: S.Program, 
    whitelistParent: Array<string> = [], 
    enter?: Function
): void {
    const parentNode: S.Node[] = []

    const handlerDefault = (node: S.Node) => {
        return node.type === type;
    }

    const getEnter = (handler: Function | undefined) => {
        if (typeof handler === 'function') {
            return handler;
        } else {
            return handlerDefault;
        }
    }

    const traverse = (node: S.Node, depth: number = 0) => {
        if (!node) return;

        if (node.type === type) {
            if (getEnter(enter)(node, parentNode[depth - 1])) {
                return;
            }
        }

        if (whitelistParent.includes(node.type)) {
            parentNode.push(node);

            if (node.body && Array.isArray(node.body)) {
                depth++;
            }
        }

        if (node.body) {
            if (Array.isArray(node.body)) {
                node.body.forEach((node: S.Node) => traverse(node, depth));
            } else {
                traverse(node.body, depth);
            }
        }
    };

    traverse(ast);
}

export const getKeys = <T extends {}>(o: T): Array<keyof T> => <Array<keyof T>>Object.keys(o)