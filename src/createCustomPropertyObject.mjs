import { parseSelector } from "./parseSelector.mjs";
import {getParentAtRule} from './getParentAtRule.mjs';

/**
 * 
 * Takes a declaration from Postcss and turns into a custom property
 * @returns {`--customPropertyKey`: value}
 */

const getParsedPropName = (prop) => {

    if (prop === 'border') {
        return `${prop}-color`;
    }

    return prop;
}
export const createCustomPropertyName = ({prefix, selector, prop, parent}) => {

    const parsedProp = getParsedPropName(prop);

    const appendedParent = parent.parent.selector ? `${parseSelector(parent.parent.selector)}-` : ``;

    const customPropertyName = `${prefix}${appendedParent}${parseSelector(selector)}-${parsedProp}`;

    return customPropertyName;
}


export const createCustomPropertyObject = ({prefix, prop, value, important, parent}) => {
    const {parentAtRule, params} = getParentAtRule(parent);

    const {selector} = parent;

    const objKey = createCustomPropertyName({prefix, selector, prop, parent});

    const parsedValue = prop === 'border' ? value.split(' ').slice(2).join(' ') : value;

    if (parsedValue === '') {
        return null;
    }

    return {
        name: objKey,
        value: parsedValue,
        originalValue: value,
        propertyType: prop,
        originalSelector: selector,
        important,
        parentAtRule,
        params,
    };
};
