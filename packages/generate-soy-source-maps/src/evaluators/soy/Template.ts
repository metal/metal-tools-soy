/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createPartialMapping } from '../../mapped';
import { FileName, Evaluation, TemplateName } from '../../global';
import { implTemplateName } from '../../utils';
import { types as S } from 'soyparser';
import ParamDeclaration from './partial/ParamDeclaration';

function evaluateTemplateParamDeclaration(
    id: TemplateName,
    node: S.Template,
    source: FileName
): Evaluation {
    if (node.params) {
        const { name, namespace } = id;
        const partialMapping: Evaluation = [];
        const templateName = implTemplateName(name, namespace);

        node.params.forEach((param: S.ParamDeclaration) => {
            partialMapping.push(...ParamDeclaration(param, templateName,source));
        });

        return partialMapping;
    } else {
        return [false];
    }
}

export function TemplateEvaluation(
    node: S.Template,
    source: FileName
): Evaluation {
    const { mark, id, type } = node;
    const { start, end } = mark;
    const parent: string = id.name;

    return [
        ...createPartialMapping({
            end,
            name: id.name,
            source,
            start,
            parent,
            type
        }),
        ...evaluateTemplateParamDeclaration(
            id,
            node,
            source
        )
    ]
}

export default function(
    node: S.Template,
    source: FileName
): Evaluation {
    return TemplateEvaluation(
        node,
        source
    );
}