'use strict';

import fs from 'fs';
import path from 'path';
import sourceMap from 'source-map';
import soyparser from 'soyparser';
import { parse } from '@babel/parser';
import soyMapping from './soy-mapping';

const argv = process.argv.slice(2);
const isInput = argv.indexOf('--input') !== -1;
const isOutput = argv.indexOf('--output') !== -1;

if (isInput && isOutput) {
    const input = argv[argv.indexOf('--input') + 1];
    const output = argv[argv.indexOf('--output') + 1];

    generateSouceMaps(input, output);
}

export default function generateSouceMaps(input, output) { 
    const sourceContent = loadInput(input);
    const generatedContent = loadInput(`${input}.js`);
    const basename = path.basename(input);
    const parserGeneratedContent = parse(generatedContent);
    const parserSourceContent = soyparser(sourceContent);

    const { generateSoyMapping } = soyMapping(parserSourceContent, basename);
    const templatesMapping = generateSoyMapping();
    
    const templates = getTemplates(parserSourceContent);
    const astWithMapping = setAstMapping(parserGeneratedContent, templatesMapping, templates);

    const generator = new sourceMap.SourceMapGenerator({
        file: basename,
        sourceRoot: input
    });

    addMapping(astWithMapping, generator, basename);

    generator.setSourceContent(basename, sourceContent);

    saveOutput(generator.toString(), path.resolve(output, `${basename}.js.map`));
}

function loadInput(input) {
    if (!input) {
        console.warn('Input is necessasry!');
    }

    return fs.readFileSync(path.resolve(input), 'utf8');
}

function saveOutput(content, output) {
    if (!output) {
        console.warn('Output is necessasry!');
    }

    return fs.writeFileSync(path.resolve(output), content);
}

function getTemplates(parserSourceContent) {
    const { body } = parserSourceContent;

    return body.map(template => {
        const { id } = template;

        return id.name;
    });
}

function setAstMapping(parserGeneratedContent, templatesMapping, templates) {
    const { body } = parserGeneratedContent.program;

    let currentTemplate = null;

    const findTemplate =
        (name) => templates.find(template => template === name);
    
    const findName =
        (name) => templatesMapping.find(item => {
            return item.name === name;
        });
    
    const findMapIndex =
        (currentTemplate, name) => templatesMapping.findIndex(item => {
            return item.name === name && item.template === currentTemplate;
        });

    const parserName =
        (name) => name.split('__')[0];

    const depth =
        (array) => array.map(item => {
            const { type } = item;

            if (type === 'ExpressionStatement') {
                const { expression } = item;

                if (expression.type === 'CallExpression') {
                    const { callee } = expression;

                    if (
                        callee.object &&
                        callee.object.name === 'goog' &&
                        callee.property.name === 'loadModule'
                    ) {
                        depth(expression.arguments);
                    }
                }
            } else if (type === 'FunctionExpression') {
                const { body } = item;

                if (body.type === 'BlockStatement') {
                    depth(body.body);
                }
            } else if (
                type === 'VariableDeclaration' &&
                item.kind === 'var'
            ) {
                const { declarations } = item;

                depth(declarations);
            } else if (
                type === 'VariableDeclarator' &&
                findTemplate(item.id.name.substr(1))
            ) {
                const { init, loc } = item;
                const { start, end } = loc;

                currentTemplate = findTemplate(item.id.name.substr(1));

                let index = findMapIndex(currentTemplate, 'Template');

                templatesMapping[index].generated = {
                    line: start.line,
                    column: start.column,
                };

                templatesMapping[index + 1].generated = {
                    line: end.line,
                    column: end.column,
                };

                depth(init.body.body);
            } else if (
                type === 'VariableDeclarator' &&
                findName(item.id.name)
            ) {
                const { loc } = item;
                const { start, end } = loc;

                let index = findMapIndex(currentTemplate, item.id.name);

                templatesMapping[index].generated = {
                    line: start.line,
                    column: end.column,
                };
            }
        });

    depth(body);

    return templatesMapping;
}

function addMapping(ast, generator, sourceName) {
    ast.map(item => {
        if (Object.keys(item.generated).length === 0) {
            return;
        }

        generator.addMapping({
            ...item,
            source: sourceName
        });
    })
};