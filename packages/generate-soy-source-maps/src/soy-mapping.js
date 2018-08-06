'use strict';

import SoyTypes from './soy-types';

export default function SoyMapping(parserSourceContent, sourceName) {
    const mapping = [];

    const { body } = parserSourceContent;
    const soyTypes = SoyTypes({ addMapping });

    function depth(array, fn) {
        return array.map(item => {
            fn(item);
        });
    }

    function generateSoyMapping() {
        const callback = (item) => {
            const keys = Object.keys(soyTypes);

            keys.map((elem) => {
                const result = soyTypes[elem](item);

                if (typeof result !== 'boolean') {
                    depth(result, callback);
                }
            });
        };

        depth(body, callback);

        return mapping;
    }

    function implMapping(data) {
        return {
            generated: {},
            source: sourceName,
            original: {
                line: data.line,
                column: data.column,
            },
            name: data.name,
            status: data.status,
            template: data.template,
        };
    };

    function addMapping(item, currentTemplate) {
        const { type } = item;
        const { mark, name = type } = item;
        const { start, end } = mark;

        mapping.push(implMapping({
            template: currentTemplate,
            status: 'start',
            name,
            line: start.line,
            column: start.column,
        }));

        if (end.line != start.line) {
            mapping.push(implMapping({
                template: currentTemplate,
                status: 'end',
                name,
                line: end.line,
                column: end.column,
            }));
        }
    }

    return {
        generateSoyMapping
    };
}