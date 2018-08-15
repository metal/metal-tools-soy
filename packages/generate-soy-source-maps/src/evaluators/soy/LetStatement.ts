/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createPartialMapping } from '../../mapped';
import { FileName, Evaluation } from '../../global';
import { STemplate, SDelTemplate } from '../../constants';
import { types as S } from 'soyparser';
import closest from '../../utils/closest';

function LetStatementEvaluation(
	ast: S.Program,
	node: S.LetStatement,
	source: FileName
): Evaluation {
	const { mark: { end, start }, name, type } = node;
	const parentList = [
		SDelTemplate,
		STemplate
	];
	const parent: string = closest(ast, node, parentList);

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
	node: S.LetStatement,
	source: FileName,
	ast: S.Program
): Evaluation {
	return LetStatementEvaluation(
		ast,
		node,
		source
	);
}