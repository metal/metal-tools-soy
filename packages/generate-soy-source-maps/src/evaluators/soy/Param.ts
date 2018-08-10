/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { closest, implTemplateName } from '../../utils';
import { createPartialMapping } from '../../mapped';
import { FileName, Evaluation } from '../../global';
import { SParam, SCall, STemplate } from '../../constants';
import { types as S } from 'soyparser';

export function ParamEvaluation(
    ast: S.Program,
    node: S.Param,
    source: FileName
): Evaluation {
    const { mark, name, type } = node;
    const { start, end } = mark;

    let parent: string = 'Undefined';

    const parentList = [
        SCall,
        STemplate
    ];

    closest(SParam, ast, parentList, (node: any, parentNode: any) => {
        if (node.name === name) {
            const { name, namespace } = parentNode.id;
            parent = implTemplateName(name, namespace);

            return true;
        }

        return false;
    });

    return createPartialMapping({
        end,
        name,
        source,
        start,
        parent,
        type
    });
}

export default function(
    node: S.Param,
    source: FileName,
    ast: S.Program
): Evaluation {
    return ParamEvaluation(
        ast,
        node,
        source
    );
}