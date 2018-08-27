/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createPartialMapping } from '../../mapped';
import { FileName, Evaluation } from '../../global';
import { implTemplateName } from '../../utils';
import { SParam, STemplate, SDelTemplate } from '../../constants';
import { types as S } from 'soyparser';
import closest from '../../utils/closest';

export function fixLocEnd({ start, end }: S.Mark) {
	if (start.line !== end.line) {
		return {
			line: end.line - 1,
			column: end.column
		};
	}

	return end;
}

export function CallEvaluation(
	ast: S.Program,
	node: S.Call,
	source: FileName
): Evaluation {
	const {
		mark: { start, end },
		id: { name, namespace },
		type
	} = node;
	const callName: string = implTemplateName(name, namespace);
	const parentList = [SParam, STemplate, SDelTemplate];
	const parent: string = closest(ast, node, parentList);

	return createPartialMapping({
		end: fixLocEnd({ start, end }),
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
	return CallEvaluation(ast, node, source);
}
