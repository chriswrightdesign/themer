import path from 'path';
import fs from 'fs';
import {declarationRadiusRegex} from './regexHelpers.mjs';

const borderProperties = ['border', 'border-top', 'border-bottom', 'border-left', 'border-right'];
const valueDisallowList = ['none', 'initial', 'auto', 'inherit'];

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
    return cssFile.toString().replace(/(\/\/\s)(.+)/gi, `/* $2 */`);
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

    const selectorSplit = selector.split(',');

    const [firstSelector] = selectorSplit;

    const starReplacementRegex = /\*/gi;

    const selectorRegex = /(\w+|\*)/gi;

    const selectorNormalized = firstSelector.match(selectorRegex).join('-');

    const selectorWithoutStar = selectorNormalized.replace(starReplacementRegex, '_all_');

    return `${selectorWithoutStar}${selectorSplit.length > 1 ? '-comma' : ''}`;
};

const removeIllegalCharactersFromName = (value) => {
    return value
        .replace(/-/, 'negative-')
        .replace(/%/, '-percent')
        .replace(/\//, '-')
        .replace(/\./, 'pt')
        .replace(/\(/, '_')
        .replace(/\)/, '_');
        
}

/**
 * Takes a series of PostCSS inputs and produces a custom property name with a prefix.
 * @param {{prefix: string, selector: string, prop: string, value: string, parent: {parent: {selector: string}}}} props
 * @returns string
 */
export const createPropertyName = ({prefix, selector, prop, parent, value, store}) => {

    const parsedProp = getParsedPropName(prop);

    // consolidate border-radius, ignore complex border-radius
    if (parsedProp.match(declarationRadiusRegex) && !value.includes(' ')) {

        return `${prefix}-border-radius-${removeIllegalCharactersFromName(value)}`;
    }

    if (parsedProp.match(/^(box-shadow)/)) {

        if (valueDisallowList.includes(value)) {
            return ;
        }

        const previousShadows = store.get();    

        const namedBoxshadowVariant = `${prefix}-box-shadow-${previousShadows.length + 1}`;

        store.add(namedBoxshadowVariant);

        return namedBoxshadowVariant;
    }

    if (parsedProp.match(/^(padding(-\w+)?|^gap$|^grid-(column-|row-)?gap$|margin(-\w+)?)/) && !value.includes(' ')) {
        return `${prefix}-spacing-${removeIllegalCharactersFromName(value)}`;
    }

    if (parsedProp === 'font-weight' || parsedProp === 'font-style' || parsedProp === 'font-size' || parsedProp === 'line-height') {
        return `${prefix}-${parsedProp}-${removeIllegalCharactersFromName(value)}`;
    }

    if (parsedProp === 'font-family') {
        const fontValueParsed = value.replace(`'`, '');
        const matchedFontWord = fontValueParsed.match(/(\w+)/g);

        return `${prefix}-font-stack-${matchedFontWord[0].toLowerCase()}`;

    }

    const appendedParent = parent.parent.selector ? `${parseSelector(parent.parent.selector)}__` : ``;

    const customPropertyName = `${prefix}-${appendedParent}${parseSelector(selector)}-${parsedProp}`;

    return customPropertyName;
}


/**
 * Takes a series of postCSS inputs and produces an object with a parsed value and custom property name.
 * @param {{prefix: string, prop: sting, value: string, important: boolean, parent: {parentAtRule: string, params: string}}} props
 * @returns {{name: string, value: string, originalValue: string, originalSelector: string, important: boolean, parentAtRule: string, params: string}}
 */
export const createPropertyObject = ({prefix, prop, value, important, parent, store}) => {
    const {parentAtRule, params} = getParentAtRule(parent);

    const {selector} = parent;

    const objKey = createPropertyName({prefix, selector, prop, parent, value, store});

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
        console.log('Error writing file: ', err);
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
        return `${acc}\t${spacingValue}--${customProperty.name}: ${customProperty.value};${index === (customPropsArr.length - 1) ? '' : `\n`}`;
    }, spacingValue)
}

/**
 * Gets custom properties with a specific media query param
 * @param {{name: string, value: string, originalValue: string, propertyType: string, originalSelector: string, important?: boolean, parentAtRule: null | string, params: null | string}[]} customPropertyList
 * @param {string} params 
 * @returns 
 */
export const getPropertiesByMediaQueryParams = (customPropertyList, params) => {
    const filteredProperties = customPropertyList.filter((customProp) => {
        return customProp.params === params && !customProp.name.includes('spacing');
    });

    return filteredProperties;
}

/**
 * 
 * @param {string} value 
 * @param {string} propertyType 
 * @returns {number}
 */
const createComparisonValue = (value, propertyType) => {

    const matchNumber = value.match((/(\d+(.\d+)?)/ig));

    if (!matchNumber) {
        return value;
    };

    const [numberValue] = matchNumber;

    const num = parseFloat(numberValue);
    return num;
}

/**
 * Constructs a :root {} to be used within a css file
 * @param {{name: string, value: string, originalValue: string, propertyType: string, originalSelector: string, important?: boolean, parentAtRule: null | string, params: null | string}[]} customPropertyList
 * @param {string} cssFile 
 * @returns 
 */
export const constructRootPseudo = ({itemsArr, name}) => {

    const customPropertiesWithNoAtRules = itemsArr.filter((customProperty) => {
        return customProperty.parentAtRule === null || customProperty.name.includes('spacing');
    }).sort((a, b) => {

        const {value: aValue, propertyType: propertyTypeA} = a;
        const {value: bValue, propertyType: propertyTypeB} = b;

        // don't try to sort box shadows
        if (propertyTypeA === 'box-shadow') {
            return 0;
        }

        const comparableValueA = createComparisonValue(aValue, propertyTypeA); 
        const comparableValueB = createComparisonValue(bValue, propertyTypeB);

        if (comparableValueA > comparableValueB) { 
            return 1;
        }

        if (comparableValueA < comparableValueB) {
            return -1;
        }

        return 0;
    });

   const mediaQueries = getMediaQueries(itemsArr);

   const customPropertyContents = generateCustomProperties(customPropertiesWithNoAtRules);
    return `${customPropertyContents.length > 0 ? `:root {
${generateCustomProperties(customPropertiesWithNoAtRules)}
}` : ``}
${mediaQueries.length > 0 ? `\n\n${mediaQueries.reduce((acc, mq) => {
    const currentMqContents = getPropertiesByMediaQueryParams(itemsArr, mq);
    return currentMqContents.length > 0 ? `${acc}@media ${mq} {
    :root {
${generateCustomProperties(currentMqContents)}
    }
}\n` : '';
    }, '')}` : ``}`
}

const constructSassVariables = ({itemsArr, spacingValue = '', name}) => {
    return itemsArr.reduce((acc, property, index) => {
        return `${acc}\t${spacingValue}$${property.name}: ${property.value};${index === (itemsArr.length - 1) ? '' : `\n`}`;
    }, '')
}

const constructJsVariables = ({itemsArr, spacingValue = '', name}) => {

    const nameToLowerCase = name.toLowerCase();

    const contents = itemsArr.reduce((acc, property, index) => {
        return `${acc}\t${spacingValue}'${property.name}': '${property.value}',${index === (itemsArr.length - 1) ? '' : `\n`}`;
    }, '')

    return `const ${nameToLowerCase} = {${contents}}\n`;
}

const outputFunction = (outputType) => {

    const outputTypeDictionary = {
        'props': constructRootPseudo,
        'scss': constructSassVariables,
        'js': constructJsVariables,
    }

    return outputTypeDictionary[outputType] || outputTypeDictionary.props;
}


export const createOutputValue = ({name, outputType}) => {

    const outputTypeDictionary = {
        props: `var(--${name})`,
        scss: `$${name}`,
        js: name,
    }

    const outputValue = outputTypeDictionary[outputType] || outputTypeDictionary.props;

    return outputValue;
}

/**
 * Ensures output of property values match what we expect.
 * @param {{name: string, prop: string, originalValue: string}} props 
 * @returns {string}
 */
export const generatePropertyValue = ({name, prop, originalValue, outputType}) => {

    const outputValue = createOutputValue({name, outputType});

    if (borderProperties.includes(prop)) {
        const [width, style] = originalValue.split(' ').slice(0, 2);
        return `${width} ${style} ${outputValue}`;
    }
    return outputValue;
}


export function store() {
    const savedValues = [];

    return {
        add: (item) => {
            savedValues.push(item);
        },
        get: () => savedValues,
    }
}

export const recordNewValue = (variable, prop, recordArray) => {

    const existsAlready = recordArray.some((record) => {
        return record.name === variable.name && record.value === variable.value;
    })

    if (!existsAlready) {
        recordArray.push(variable);
    }
}

export const renderIfPresent = (itemsArr, name, outputType = 'props') => {
    const constructProps = outputFunction(outputType);
    return itemsArr.length > 0 ? `/* Start: ${name} */
${constructProps({itemsArr, name})}
/* End: ${name} */\n\n` : '';
}

export const createFile = ({outputDir, fileOutput, outputString}) => {
    try {

        fs.writeFileSync(path.resolve(outputDir, fileOutput), outputString);
        console.log(`File written: ${fileOutput}`); 
    } catch(err) {
        console.log('Error writing file: ', err);
    }
}
