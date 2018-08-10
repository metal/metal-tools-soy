/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { closest, implTemplateName } from '../../utils';
import { createPartialMapping } from '../../mapped';
import { Mark, FileName, Evaluation, TemplateName } from '../../global';
import { SCall, SParam, STemplate } from '../../constants';
import { types as S } from 'soyparser';

export function CallEvaluation(
    ast: S.Program,
    id: TemplateName,
    mark: Mark,
    source: FileName,
    type: string,
): Evaluation {
    const { start, end } = mark;
    const { name, namespace } = id;
    const callName: string = implTemplateName(name, namespace);
    let parent: string = 'Undefined';

    const parentList = [
        SParam,
        STemplate
    ];

    closest(SCall, ast, parentList, (node: any, parentNode: any) => {
        const { name, namespace } = node.id;

        if (implTemplateName(name, namespace) === callName) {
            if (parentNode.type === STemplate) {
                const { name, namespace } = parentNode.id;
                parent = implTemplateName(name, namespace);
            } else if (parentNode.type === SParam) {
                const { name } = parentNode;
                parent = name;
            }

            return true;
        }

        return false;
    });

    return createPartialMapping({
        end,
        name: callName,
        source,
        start,
        parent,
        type
    });
}

export default function(
    node: S.Call,
    source: FileName,
    ast: S.Program
): Evaluation | boolean {
    const { mark, id, type } = node;

    return CallEvaluation(
        ast,
        id,
        mark,
        source,
        type
    );
}