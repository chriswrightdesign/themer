import { parseSelector } from "./parseSelector.mjs";
import {getParentAtRule} from './getParentAtRule.mjs';

/**
 * 
 * Takes a declaration from Postcss and turns into a custom property
 * @returns {`--customPropertyKey`: value}
 */

export const createCustomPropertyName = ({prefix, selector, prop, parent}) => {

    const parsedProp = prop === 'border' ? `${prop}-color` : prop;

    const appendedParent = parent.parent.selector ? `${parseSelector(parent.parent.selector)}-` : ``;

    const customPropertyName = `${prefix}${appendedParent}${parseSelector(selector)}-${parsedProp}`;

    return customPropertyName;
}

export const createCustomPropertyObject = ({prefix, selector, prop, value, important, parent}) => {
    const {parentAtRule, params} = getParentAtRule(parent);

    const objKey = createCustomPropertyName({prefix, selector, prop, parent});

    const parsedValue = prop === 'border' ? value.split(' ').slice(-1)[0] : value;

    return {
        name: objKey,
        value: parsedValue,
        propertyType: prop,
        originalSelector: selector,
        important,
        parentAtRule,
        params,
    };
};
