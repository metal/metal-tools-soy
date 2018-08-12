/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    CallExpression, 
    Expression, 
    File,
    Identifier, 
    isCallExpression,
    isObjectExpression, 
    JSXNamespacedName, 
    SourceLocation, 
    SpreadElement, 
    StringLiteral
} from "@babel/types";
import { createMapping } from "../../mapped";
import { 
    getLetName, 
    isValidLetStatement, 
    isValidName 
} from "../../utils";
import { NodePath } from "babel__traverse";
import { PartialMapping, Mapping } from "../../global";
import { SInterpolation, SCall } from "../../constants";
import traverse from '../../utils/traverseFast';

type Evaluate = Array<Mapping|boolean> | boolean;
type Arguments = Array<Expression | SpreadElement | JSXNamespacedName>;

function mountCallName(
    args: StringLiteral[]
): string {
    // Node with Name
    const arg1 = args[0];

    // Node with Namespace
    const arg2 = args[1];

    return `${arg1.value.split('.')[0]}.${arg2.value}`;
}

function isValidCall(name: string): boolean {
    return name.startsWith('$templateAlias');
}

function EvaluateCall(
    ast: File,
    args: Arguments,
    loc: SourceLocation | null,
    name: string,
    partialMapping: PartialMapping[]
): Evaluate {
    if (!isValidName(name)) return false;

    if (isObjectExpression(args[0])) {
        if (isValidCall(name)) {
            // 2. An possible outside Call.
            let CallName: string = '';

            traverse(ast, {
                VariableDeclarator(node) {
                    const { name: nameVar } = <Identifier>node.id;

                    if (isCallExpression(node.init)) {
                        if (nameVar === name) {
                            CallName = mountCallName(node.init.arguments);
                        }
                    }
                }
            });

            if (!CallName) return false;

            return createMapping(
                partialMapping,
                SCall,
                CallName,
                loc
            )
        } else {
            // 2.1 An possible inside Call.

            return createMapping(
                partialMapping,
                SCall,
                `null.${name.substring(1)}`,
                loc
            );
        }
    }

    return false;
}

function EvaluateInterpolation(
    loc: SourceLocation | null,
    name: string,
    partialMapping: PartialMapping[]
): Evaluate {
    if (isValidLetStatement(name)) {
        // 1. An possible Interpolation.

        return createMapping(
            partialMapping,
            SInterpolation,
            getLetName(name),
            loc
        );
    } else {
        // 1.1 An possible Interpolation that call LetStatement.
    };

    return false;
}

export default function(
    path: NodePath<CallExpression>,
    partialMapping: PartialMapping[],
    ast: File
): Evaluate {
    const { node } = path;

    if (node.callee.type === 'Identifier') {
        const { loc } = node;
        const { name } = <Identifier>node.callee;

        if (!node.arguments.length) {
            // 1. An possible Interpolation.
            // 1.1 An possible Interpolation that call LetStatement.
            let interpolation = EvaluateInterpolation(loc, name, partialMapping);

            if(interpolation) return interpolation;
        } else {
            // 2. An possible outside Call.
            // 2.1 An possible inside Call.
            let call = EvaluateCall(
                ast, 
                <Arguments>node.arguments, 
                loc,
                name, 
                partialMapping
            );

            if (call) return call;
        }
    }

    return false;
}