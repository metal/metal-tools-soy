/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isValidName, isValidDelTemplate} from '../../../utils';
import {NodePath} from '@babel/traverse';
import {VariableDeclarator, Identifier} from '@babel/types';

export function evaluateTemplateName(name: string): string {
	const nameWitoutDelTemplate = name.replace('__deltemplate__', '');
	const nameSplit = nameWitoutDelTemplate.split('_');
	const parsedName = `${nameSplit[0]}.${nameSplit[1]}`;

	if (nameSplit[2]) parsedName.concat(`.${nameSplit[2]}`);

	return parsedName;
}

export default function findTemplateParent(path: NodePath) {
	const parentNode = <NodePath<VariableDeclarator>>path.findParent(path => {
		if (path.isVariableDeclarator()) {
			const {node} = path;
			const {name} = <Identifier>node.id;

			if (isValidName(name) && isValidDelTemplate(name)) {
				return true;
			}
		}

		return false;
	});

	if (!parentNode) return false;

	const {name} = <Identifier>parentNode.node.id;

	return isValidName(name)
		? `null.${name.substring(1)}`
		: evaluateTemplateName(name);
}
