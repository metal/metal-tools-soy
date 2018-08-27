/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createPartialMapping } from '../../mapped';
import { FileName, Evaluation } from '../../global';
import { SCall } from '../../constants';
import { types as S } from 'soyparser';
import closest from '../../utils/closest';

export function ParamEvaluation(
	ast: S.Program,
	node: S.Param,
	source: FileName
): Evaluation {
	const {
		mark: { start, end },
		name,
		type
	} = node;
	const parentList = [SCall];
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
	node: S.Param,
	source: FileName,
	ast: S.Program
): Evaluation {
	return ParamEvaluation(ast, node, source);
}
