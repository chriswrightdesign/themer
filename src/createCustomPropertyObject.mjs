import {parseSelector} from "./parseSelector.mjs";
import {getParentAtRule} from './getParentAtRule.mjs';

/**
 * Ensure any props passed in match their output.
 * @param prop {string}
 * @returns {string}
 */
export const getParsedPropName = (prop) => {

    if (prop === 'border') {
        return `${prop}-color`;
    }

    return prop;
}

/**
 * Takes a series of PostCSS inputs and produces a custom property name with a prefix.
 * @param {{prefix: string, selector: string, prop: string, parent: {parent: {selector: string}}}} props
 * @returns string
 */
export const createCustomPropertyName = ({prefix, selector, prop, parent}) => {

    const parsedProp = getParsedPropName(prop);

    const appendedParent = parent.parent.selector ? `${parseSelector(parent.parent.selector)}-` : ``;

    const customPropertyName = `${prefix}${appendedParent}${parseSelector(selector)}-${parsedProp}`;

    return customPropertyName;
}

/**
 * Takes a series of postCSS inputs and produces an object with a parsed value and custom property name.
 * @param {{prefix: string, prop: sting, value: string, important: boolean, parent: {parentAtRule: string, params: string}}} props
 * @returns {{name: string, value: string, originalValue: string, originalSelector: string, important: boolean, parentAtRule: string, params: string}}
 */
export const createCustomPropertyObject = ({prefix, prop, value, important, parent}) => {
    const {parentAtRule, params} = getParentAtRule(parent);

    const {selector} = parent;

    const objKey = createCustomPropertyName({prefix, selector, prop, parent});

    // replace with color regex
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
