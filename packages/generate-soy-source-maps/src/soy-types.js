'use strict';

export default function SoyTypes({ addMapping }) {
    let currentTemplate = null;

    const setCurrentTemplate = (item) => {
        if (item.type === 'Template') {
            currentTemplate = item.id.name;

            return true;
        }

        return false;
    };

    const setParams = (item) => {
        if (item.params) {
            return item.params;
        }

        return false;
    };

    const setParamDeclaration = (item) => {
        if (item.type === 'ParamDeclaration') {
            addMapping(item, currentTemplate);

            return true;
        }

        return false;
    }

    const setTypes = (item) => {
        if (item.body && item.body.length) {
            addMapping(item, currentTemplate);

            return item.body;
        }

        return false;
    }

    return {
        setCurrentTemplate,
        setParams,
        setParamDeclaration,
        setTypes
    }
};