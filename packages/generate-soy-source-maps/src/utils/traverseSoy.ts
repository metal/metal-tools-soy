/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { types as S } from 'soyparser';
import { Visitor, Visit } from '../global';

function noop() {};

export function getEnter<T>(handler: Visit<T> | undefined): Visit<T> {
    if (typeof handler === 'function') {
        return handler;
    }

    return noop;
};

export default function traverseSoy(
    node: S.Node,
    visitor: Visitor
): void {
    const handler = visitor[node.type];

    getEnter(handler)(node);

    if (node.body) {
        if (Array.isArray(node.body)) {
            node.body.forEach(node => traverseSoy(node, visitor))
        } else {
            traverseSoy(node.body, visitor);
        }
    }
}