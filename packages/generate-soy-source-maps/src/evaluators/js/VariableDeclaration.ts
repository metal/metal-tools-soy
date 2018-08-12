/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    CallExpression,
    FunctionExpression,
    Identifier, 
    isCallExpression,
    isFunctionExpression,
    VariableDeclaration, 
    VariableDeclarator, 
    isMemberExpression,
    MemberExpression
} from "@babel/types";
import { createMapping } from '../../mapped';
import { isValidName, isValidLetStatement, getLetName } from '../../utils';
import { NodePath } from "@babel/traverse";
import { PartialMapping, Mapping } from "../../global";
import { STemplate, SLetStatement, SParamDeclaration } from '../../constants';

type Evaluate = Array<Mapping|boolean> | boolean;

function EvaluateTemplate(
    declaration: VariableDeclarator,
    partialMapping: PartialMapping[]
): Evaluate {
    const { loc } = declaration;
    const { name } = <Identifier>declaration.id;

    if(!isValidName(name)) return false;

    if (isFunctionExpression(<FunctionExpression>declaration.init)) {
        const { name: nameInit } = <Identifier>(<FunctionExpression>declaration.init).id;

        if (name === nameInit) {
           return createMapping(
               partialMapping,
               STemplate,
               name.substring(1),
               loc
           );
        }
    }

    return false;
};

function EvaluateParamDeclaration(
    declaration: VariableDeclarator,
    partialMapping: PartialMapping[],
    path: NodePath<VariableDeclaration>
): Evaluate {
    const { loc } = declaration;
    const { name } = <Identifier>declaration.id;

    if (!partialMapping.find(map => map.name === name)) return false;

    if (
        isCallExpression(<CallExpression>declaration.init) || 
        isMemberExpression(<MemberExpression>declaration.init)
    ) {
        const parentTemplate = <NodePath<VariableDeclarator>>path.findParent((path) => {
            if (path.isVariableDeclarator()) {
                const { node } = path;
                const { name } = <Identifier>node.id;
    
                if(!isValidName(name)) return false;
    
                return true;
            }
    
            return false;
        });
        const { name: parentName } = <Identifier>parentTemplate.node.id;

        return createMapping(
            partialMapping,
            SParamDeclaration,
            name,
            loc,
            `null.${parentName.substring(1)}`
        );
    }

    return false;
};

function EvaluateLetStatement(
    declaration: VariableDeclarator,
    partialMapping: PartialMapping[]
): Evaluate {
    const { loc } = declaration;
    const { name } = <Identifier>declaration.id;

    if (!isValidLetStatement(name)) return false;

    if (isFunctionExpression(<FunctionExpression>declaration.init)) {
        const { name: nameInit } = <Identifier>(<FunctionExpression>declaration.init).id;

        if ( name === nameInit ) {
            return createMapping(
                partialMapping,
                SLetStatement,
                getLetName(name),
                loc
            );
        }
    }

    return false;
};

export default function(
    path: NodePath<VariableDeclaration>,
    partialMapping: PartialMapping[]
): Evaluate {
    const { node } = path;

    for (let declar of node.declarations) {
        let Initializer = declar.init;

        if (declar.id.type === "Identifier" && !Initializer) {
            // VariableDeclaration : BindingIdentifier

            // ECMA262 13.3.2.4
            // 1. Return NormalCompletion(empty).
            continue;
        } else if (declar.id.type === "Identifier" && Initializer) {
            // VariableDeclaration : BindingIdentifier Initializer

            // 1. An possible Template.
            let template = EvaluateTemplate(declar, partialMapping);

            if (template) return template;

            // 2. An possible ParamDeclaration.
            let paramDeclaration = EvaluateParamDeclaration(declar, partialMapping, path);

            if (paramDeclaration) return paramDeclaration;

            // 3. An possible LetStatement.
            let letStatement = EvaluateLetStatement(declar, partialMapping);

            if (letStatement) return letStatement;
        }
    }

    return false;
}