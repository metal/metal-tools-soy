/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createMapping } from '../../mapped';
import { ObjectExpression, ObjectProperty, Identifier } from '@babel/types';
import { PartialMapping, Mapping } from '../../global';
import { SParam } from '../../constants';

type Evaluate = Array<Mapping | boolean>;

function EvaluateObjectProperty(
	node: ObjectProperty,
	parent: string,
	partialMapping: PartialMapping[]
): Evaluate {
	const { name } = <Identifier>node.key;
	const { loc } = <Identifier>node.value;

	if (
		!partialMapping.find(
			map => map.name === name && map.type === SParam && map.parent === parent
		)
	) {
		return [false];
	}

	return createMapping(partialMapping, SParam, name, loc, parent);
}

export default function(
	node: ObjectExpression,
	parent: string,
	partialMapping: PartialMapping[]
): Evaluate {
	const mapping = [];

	for (let prop of node.properties) {
		if (prop.type === 'ObjectProperty') {
			// 1. An possible Param inside of the Call inside.
			// 1.1 An possible Param inside of the Call outside.
			let objectProperty = EvaluateObjectProperty(prop, parent, partialMapping);

			mapping.push(...objectProperty);
		}
	}

	return mapping;
}
