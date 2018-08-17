/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {File} from '@babel/types';
import {Mapping} from './global';
import {parse} from '@babel/parser';
import * as sourceMap from 'source-map/source-map';
import environment from './environment';
import soyparser, {types as S} from 'soyparser';

function addMapping(
	mapping: Mapping[],
	generator: sourceMap.SourceMapGenerator
): void {
	mapping.map(item => {
		generator.addMapping(item);
	});
}

function implSourceMap(
	input: string,
	mapping: Mapping[],
	sourceContent: string,
	sourceName: string
): sourceMap.SourceMapGenerator {
	const generator = new sourceMap.SourceMapGenerator({
		file: sourceName,
		sourceRoot: input,
	});

	addMapping(mapping, generator);

	generator.setSourceContent(sourceName, sourceContent);

	return generator;
}

function parser(sourceContent: string, generatedContent: string) {
	const astSource: S.Program = soyparser(sourceContent);
	const astGenerated: File = parse(generatedContent, {
		allowImportExportEverywhere: true,
	});

	return {
		astSource,
		astGenerated,
	};
}

interface RunEnvironment {
	astGenerated: File;
	astSource: S.Program;
	sourceName: string;
}

function runEnvironment({
	astGenerated,
	astSource,
	sourceName,
}: RunEnvironment): Mapping[] {
	const mapping: Mapping[] = environment(astSource, astGenerated, sourceName);

	return mapping;
}

export default function(
	input: string,
	sourceContent: string,
	generatedContent: string,
	sourceName: string
): sourceMap.SourceMapGenerator {
	const parsedContent = parser(sourceContent, generatedContent);
	const mapping: Mapping[] = runEnvironment({...parsedContent, sourceName});
	const generator = implSourceMap(input, mapping, sourceContent, sourceName);

	return generator;
}
