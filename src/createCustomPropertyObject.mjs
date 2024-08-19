import { parseSelector } from "./parseSelector.mjs";
/**
 * 
 * Takes a declaration from Postcss and turns into a custom property
 * @returns {`--customPropertyKey`: value}
 */
export const createCustomPropertyObject = ({prefix, selector, prop, value, important, parent}) => {
    const appendedParent = parent.parent.selector ? `${parseSelector(parent.parent.selector)}-` : ``;

    const objKey = `${prefix}${appendedParent}${parseSelector(selector)}-${prop}`;

    const objValue = `${value}${important ? ` !important` : ``}`;

    return {
        [objKey]: objValue,
    };
};
