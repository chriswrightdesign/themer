import path from 'path';
import fs from 'fs';

const borderProperties = ['border', 'border-top', 'border-bottom', 'border-left', 'border-right'];
const valueDisallowList = ['transparent', 'none', 'initial', 'auto', 'inherit'];

/**
 * Ensure any props passed in match their output.
 * @param prop {string}
 * @returns {string}
 */
export const getParsedPropName = (prop) => {

    if (borderProperties.includes(prop)) {
        return `${prop}-color`;
    }

    return prop;
}

/**
 * Returns an object with information around parent at rule.
 * @param {{parent: {parent: {type: string}}}} parent
 * @returns {{parentAtRule: string, params: string}}
 */
export const getParentAtRule = (parent) => {

    if (parent.parent.type !== 'atrule') {
        return {
            parentAtRule: null,
            params: null
        }
    }
    
    return {
        parentAtRule: parent.parent.name,
        params: parent.parent.params,
    };
};

/**
 * Replace any // with * * becase postcss hates it
 * @param cssFile {string} 
 * @returns {string}
 */
export const makeCommentsSafe = (cssFile) => {
    return cssFile.toString().replace(/(\/\/\s).(.+)/gi, `/* $2 */`);
}

/**
 * 
 * @param {string[]} itemList 
 * @returns {{[key: string]: number}}
 */
export const generateStatsObject = (itemList) => {
    const statsObject = itemList.reduce((stats, curr) => {

        const itemKey = curr.value;
        if (!stats[itemKey]) {
            return {
                ...stats,
                [itemKey]: 1,
            }
        }

        if (stats[itemKey]) {
            return {
                ...stats,
                [itemKey]: stats[itemKey] + 1,
            }
        }
        return stats;

    }, {});

    return statsObject;
}

/**
 * 
 * @param {string} selector 
 * @returns {string}
 */
export const parseSelector = (selector) => {

    if (!selector) {
        return '';
    }

    const [firstSelector] = selector.split(',');

    const starReplacementRegex = /\*/gi;

    const selectorRegex = /(\w+|\*)/gi;

    const selectorNormalized = firstSelector.match(selectorRegex).join('-');

    const selectorWithoutStar = selectorNormalized.replace(starReplacementRegex, '_all_');

    return selectorWithoutStar;
};

/**
 * Takes a series of PostCSS inputs and produces a custom property name with a prefix.
 * @param {{prefix: string, selector: string, prop: string, parent: {parent: {selector: string}}}} props
 * @returns string
 */
export const createCustomPropertyName = ({prefix, selector, prop, parent}) => {

    const parsedProp = getParsedPropName(prop);

    const appendedParent = parent.parent.selector ? `${parseSelector(parent.parent.selector)}__` : ``;

    const customPropertyName = `--${prefix}-${appendedParent}${parseSelector(selector)}-${parsedProp}`;

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

    const parsedValue = borderProperties.includes(prop) ? value.split(' ').slice(2).join(' ') : value;

    const isDisallowed = valueDisallowList.some(disallowedValue => parsedValue === disallowedValue);

    if (parsedValue === '' || isDisallowed) {
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

/**
 * 
 * @param {{categoryName: string, colorList: {value: string, category: string}[], exact?: boolean}} props
 * @returns {{categoryName: string, colorList: {value: string, category: string}[], exact?: boolean}}
 */
export const getColorsByCategory = ({categoryName, colorList, exact = false}) => {
    const categoryColors = colorList.filter((color) => {
        return exact ? color.category === categoryName : color.category.includes(categoryName);
    });

    return categoryColors;
}

/**
 * 
 * @param {{data: {[key: string]: number}, dataArr: string[], headings: string}} props
 * @returns {string}
 */
export const arrayToCSVFormat = ({data, dataArr, headings}) => {
    return dataArr.reduce((acc, value) => {
        return acc += `"${value}", ${data[value]}\n`
    }, `${headings} \n`);
}

/**
 * @template T
 * @param {{[key: T]: number}} data 
 * @returns T[]
 */
export const convertStatsObjectToSortedArray = (data) => {
    return Object.keys(data).sort((a, b) => {
        if (data[a] > data[b]) {
            return -1;
        }
        if (data[a] < data[b]) {
            return 1;
        }
        return 0;
    });
}

/**
 * Writes a two column CSV showing occurrences of a property value 
 * @param {{data: {[key: string]: number}, outputFile: string, outputDir: string, headings?: string}} param0 
 */
export const writeCSV = ({data, outputFile, outputDir, headings = 'Value, Occurrence'}) => {

    const output = path.resolve(outputDir, outputFile);

    const sortedData = convertStatsObjectToSortedArray(data);

    const dataOutput = arrayToCSVFormat({dataArr: sortedData, headings, data});

    try {
        fs.writeFileSync(output, dataOutput, 'utf8');
        console.log(`CSV written: ${outputFile}`);
    } catch(err) {
        console.log('Error writing file')
    }

    
}

/**
 * Filters custom properties and returns only those that exist within a media query.
 * @param {{name: string, value: string, originalValue: string, propertyType: string, originalSelector: string, important?: boolean, parentAtRule: null | string, params: null | string}[]} customPropertyList 
 * @returns {{name: string, value: string, originalValue: string, propertyType: string, originalSelector: string, important?: boolean, parentAtRule: 'media', params: string}[]}
 */
export const getMediaQueries = (customPropertyList) => {
    const mqList = customPropertyList.reduce((acc, curr) => {
        if (curr.parentAtRule === 'media') {
            return [...acc, curr.params];
        }
        return acc;
    }, []);

    const mqListDeduped = [...new Set(mqList)];
    return mqListDeduped;
} 

/**
 * Generates custom properties ready to be input into a :root{} string
 * @param {{name: string, value: string, originalValue: string, propertyType: string, originalSelector: string, important?: boolean, parentAtRule: null | string, params: null | string}[]} customPropsArr 
 * @param {string?} spacingValue 
 * @returns 
 */
export const generateCustomProperties = (customPropsArr, spacingValue = '') => {
    return customPropsArr.reduce((acc, customProperty, index) => {
        return `${acc}\t${spacingValue}${customProperty.name}: ${customProperty.value};${index === (customPropsArr.length - 1) ? '' : `\n`}`;
    }, spacingValue)
}

/**
 * Gets custom properties with a specific media query param
 * @param {{name: string, value: string, originalValue: string, propertyType: string, originalSelector: string, important?: boolean, parentAtRule: null | string, params: null | string}[]} customPropertyList
 * @param {string} params 
 * @returns 
 */
export const getPropertysByMediaQueryParams = (customPropertyList, params) => {
    const filteredProperties = customPropertyList.filter((customProp) => {
        return customProp.params === params;
    });

    return filteredProperties;
}

/**
 * Constructs a :root {} to be used within a css file
 * @param {{name: string, value: string, originalValue: string, propertyType: string, originalSelector: string, important?: boolean, parentAtRule: null | string, params: null | string}[]} customPropertyList
 * @param {string} cssFile 
 * @returns 
 */
export const constructRootPseudo = (customPropertyList) => {

    const customPropertiesWithNoAtRules = customPropertyList.filter((customProperty) => {
        return customProperty.parentAtRule === null;
    });

   const mediaQueries = getMediaQueries(customPropertyList);

    return `:root {
${generateCustomProperties(customPropertiesWithNoAtRules)}
}${mediaQueries.length > 0 ? `\n\n${mediaQueries.reduce((acc, mq) => {
    return `${acc}@media ${mq} {
    :root {
${generateCustomProperties(getPropertysByMediaQueryParams(customPropertyList, mq))}
    }
}`;
    }, '')}` : ``}`
}

/**
 * Ensures output of property values match what we expect.
 * @param {{name: string, prop: string, originalValue: string}} props 
 * @returns {string}
 */
export const generatePropertyValue = ({name, prop, originalValue}) => {

    if (borderProperties.includes(prop)) {
        const [width, style] = originalValue.split(' ').slice(0, 2);
        return `${width} ${style} var(${name})`;
    }
    return `var(${name})`;
}