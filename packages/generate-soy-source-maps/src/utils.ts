/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PartialMapping } from './global';

export function implTemplateName(name: string, namespace: (string | null)): string {
    return `${namespace}.${name}`;
}

export function getLetName(name: string): string {
    return name.split('__')[0];
}

export function isValidLetStatement(name: string): boolean {
    return /__soy+\d+/.test(name);
}

export function isValidName(name: string): boolean {
    return /\$/.test(name);
}

export function isValidDelTemplate(name: string): boolean {
    return name.startsWith('__deltemplate__');
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

export const getKeys = <T extends {}>(o: T): Array<keyof T> => <Array<keyof T>>Object.keys(o)