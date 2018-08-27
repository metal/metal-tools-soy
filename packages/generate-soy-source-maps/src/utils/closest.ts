/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { implTemplateName } from '../utils';
import { types as S } from 'soyparser';

export function CallClosest(parentNode: S.Call): string {
	const {
		id: { name, namespace }
	} = parentNode;

	return implTemplateName(name, namespace);
}

export function DelTemplateClosest(parentNode: S.DelTemplate): string {
	const {
		id: { name, namespace },
		variant
	} = parentNode;
	const DelTemplate = implTemplateName(name, namespace);

	if (variant) DelTemplate.concat(`.${variant}`);

	return DelTemplate;
}

export function LetStatementClosest(parentNode: S.LetStatement): string {
	return parentNode.name;
}

export function ParamClosest(parentNode: S.Param): string {
	return parentNode.name;
}

export function TemplateClosest(parentNode: S.Template): string {
	const {
		id: { name, namespace }
	} = parentNode;

	return implTemplateName(name, namespace);
}

interface Visit {
	[propName: string]: (node: any) => string;
}

const VisitClosest: Visit = {
	Call: CallClosest,
	DelTemplate: DelTemplateClosest,
	LetStatement: LetStatementClosest,
	Param: ParamClosest,
	Template: TemplateClosest
};

export default function closest(
	ast: S.Program,
	nodeCompare: S.Node,
	visitor: Array<string> = []
): string {
	const parentNodes: S.Node[] = [];
	let parent = 'Undefined';

	const traverse = (node: S.Node) => {
		if (!node) return;

		if (visitor.includes(node.type)) {
			parentNodes.push(node);
		}

		if (node === nodeCompare) {
			let parentNode: S.Node = parentNodes[parentNodes.length - 1];

			if (visitor.includes(parentNode.type)) {
				parent = VisitClosest[parentNode.type](<any>parentNode);
			}
		}

		if (node.body) {
			if (Array.isArray(node.body)) {
				node.body.forEach((node: S.Node) => traverse(node));
			} else {
				traverse(node.body);
			}
		}
	};

	traverse(ast);

	return parent;
}
