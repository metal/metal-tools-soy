/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createPartialMapping } from '../../mapped';
import { FileName, Evaluation, TemplateName } from '../../global';
import { types as S } from 'soyparser';
import ParamDeclaration from './partial/ParamDeclaration';

function evaluateTemplateName(
	id: TemplateName,
	variant?: S.Interpolation | null
): string {
	const { name, namespace } = id;

	const parsedName = `${namespace}.${name}`;

	if (variant) parsedName.concat(`.${variant}`);

	return parsedName;
}

function evaluateTemplateParamDeclaration(
	id: TemplateName,
	node: S.Template | S.DelTemplate,
	source: FileName
): Evaluation {
	if (node.params) {
		const { variant } = <S.DelTemplate>node;
		const partialMapping: Evaluation = [];
		const templateName = evaluateTemplateName(id, variant);

		node.params.forEach((param: S.ParamDeclaration) => {
			partialMapping.push(...ParamDeclaration(param, templateName, source));
		});

		return partialMapping;
	} else {
		return [false];
	}
}

export function TemplateEvaluation(
	name: string,
	node: S.Template | S.DelTemplate,
	source: FileName
): Evaluation {
	const {
		mark: { start, end },
		id,
		type
	} = node;

	return [
		...createPartialMapping({
			end,
			name,
			source,
			start: node.doc ? node.doc.mark.end : start,
			parent: name,
			type
		}),
		...evaluateTemplateParamDeclaration(id, node, source)
	];
}

export default function(node: S.Template, source: FileName): Evaluation {
	const {
		id: { name }
	} = node;

	return TemplateEvaluation(name, node, source);
}
