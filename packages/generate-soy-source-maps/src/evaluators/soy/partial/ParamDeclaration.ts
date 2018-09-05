/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createPartialMapping } from '../../../mapped';
import { Mark, FileName, Evaluation } from '../../../global';
import { types as S } from 'soyparser';

export function ParamDeclarationEvaluation(
	mark: Mark,
	name: string,
	parent: string,
	source: FileName,
	type: string
): Evaluation {
	const { start, end } = mark;

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
	node: S.ParamDeclaration,
	parent: string,
	source: FileName
): Evaluation {
	const { mark, name, type } = node;

	return ParamDeclarationEvaluation(mark, name, parent, source, type);
}
