/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FileName, Evaluation } from '../../global';
import { TemplateEvaluation } from './Template';
import { types as S } from 'soyparser';

export default function(
    node: S.DelTemplate,
    source: FileName
): Evaluation {
    const { id: { name, namespace }, variant } = node;
    const DelTemplate = `${namespace}.${name}`;

    if (variant) DelTemplate.concat(`.${variant}`);

    return TemplateEvaluation(
        DelTemplate,
        node,
        source
    );
}