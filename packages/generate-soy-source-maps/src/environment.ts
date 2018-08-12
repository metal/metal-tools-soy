/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { File } from '@babel/types';
import { getKeys, sortPartialMapping } from "./utils";
import { Mapping, FileName, Visitor, PartialMapping } from "./global";
import * as evaluatorsJs from './evaluators/js';
import * as evaluatorsSoy from "./evaluators/soy";
import * as S from "soyparser/lib/types";
import traverseJs from '@babel/traverse';
import traverseSoy from './utils/traverseSoy';

export default function(
    astSoy: S.Program,
    astJs: File,
    sourceName: FileName
): Mapping[] {
    const partialMapping: PartialMapping[] = createPartialMapping(astSoy, sourceName);
    const mapping: Mapping[] = crossMapping(astJs, sortPartialMapping(partialMapping));

    return mapping;
}

function crossMapping(
    ast: File,
    soyPartialMapping: PartialMapping[]
): Mapping[] {
    return runEvaluators(
        traverseJs,
        ast,
        soyPartialMapping,
        evaluatorsJs
    );
};

function createPartialMapping(
    ast: S.Program,
    source: FileName
): PartialMapping[] {
    return runEvaluators(
        traverseSoy,
        ast,
        source,
        evaluatorsSoy
    );
}

function runEvaluators<T, O, U, P>(
    traverse: Function,
    ast: T,
    arg: O,
    evaluators: U
): P[] {
    const array: P[] = [];
    const evaluatorsKeys = getKeys(evaluators);
    const visitor: Visitor = {};

    evaluatorsKeys.forEach((name) => {
        (<Visitor>visitor)[name.toString()] = (node: File): void => {
            let evaluator: Function = (<any>evaluators)[name];

            const res: P[] = evaluator(
                node,
                arg,
                ast
            );
    
            if (res) {
                array.push(...res);
            }
        }
    });

    traverse(ast, visitor);

    return array;
}