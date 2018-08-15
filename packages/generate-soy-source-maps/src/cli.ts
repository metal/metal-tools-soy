/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexSourceMapping, SourceMapping } from './constants';
import * as fs from 'fs';
import * as glob from 'glob';
import * as logger from 'signale';
import * as path from 'path';
import * as program from 'commander';
import generateSourceMapFile from './source-map';
const pkg = require('../package.json');

export function main(argv: Array<string>): void {
    const cli = program
      .version(pkg.version)
      .usage('[options] <path>')
      .option('-i, --input', 'The path of the Soy file')
      .option('-o, --output', 'The path to the final file')
      .parse(argv);

    if (!program.args.length) {
        cli.help();
    }

    const input = path.resolve(cli.args[0]);

    if (isDir(input)) {
        glob(path.join(input, '/**/*.soy'), {}, (er, files: Array<string>) => {
            if (er) {
                throw logger.fatal(er);
            }

            if (!files.length) return;

            for (let i = 0; i < files.length; i++) {
                let output = resolveOutput(files[i], cli.args);

                if (!existFile(output)) return;

                evaluateFile(files[i], output);
            }
        });
    } else {
        let output = resolveOutput(input, cli.args);

        evaluateFile(input, output);
    }
}

function resolveOutput(input: string, args: string[]) {
    return program.output ? path.resolve(args[1]) : path.dirname(input);
}

function evaluateFile(input: string, output: string) {
    if (!evaluateFilePath(input)) return;

    const sourceContent: string = loadFile(input);
    const generatedContent: string = loadFile(`${input}.js`);
    const sourceName: string = path.basename(input);
    const generator = generateSourceMapFile(input, sourceContent, generatedContent, sourceName);
    const fileName = `${sourceName}.js.map`;

    saveFile(evaluateGeneratedFile(generatedContent, fileName), path.resolve(path.dirname(input), `${input}.js`));
    saveFile(generator.toString(), path.resolve(output, fileName));

    logger.success(fileName, `source map generated successfully`);
}

function evaluateGeneratedFile(content: string, fileName: string): string {
    if (RegexSourceMapping.test(content)) {
        return content.replace(RegexSourceMapping, SourceMapping + fileName);
    }

    return content.concat('\n' + SourceMapping + fileName);
}

function evaluateFilePath(input: string): boolean {
    const sourceName: string = path.basename(input);
    const output: string = path.dirname(input);
    const extname: string = path.extname(input);

    if (extname !== '.soy') {
        throw logger.error(`Can not resolve files with ${extname} extension`);
    }

    if (!existFile(input)) {
        throw logger.error(`Could not resolve ${sourceName} file in path ${output}`);
    }

    if (!existFile(`${input}.js`)) {
        throw logger.error('It is not possible to generate the source map without the generated file.', `${input}.js`);
    }

    return true;
}

function existFile(path: string) {
    try {
        return fs.existsSync(path);
    } catch (error) {
        throw logger.fatal(error);
    }
}

function isDir(input: string) {
    try {
        return fs.lstatSync(input).isDirectory();
    } catch (error) {
        throw logger.fatal(error);
    }
}

function loadFile(input: string) {
    try {
        return fs.readFileSync(path.resolve(input), 'utf8');
    } catch (error) {
        throw logger.fatal(error);
    }
}

function saveFile(content: string, output: string) {
    try {
        return fs.writeFileSync(path.resolve(output), content);
    } catch (error) {
        throw logger.fatal(error);
    }
}