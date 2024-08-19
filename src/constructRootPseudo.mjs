
const getMediaQueries = (customPropertyList) => customPropertyList.reduce((acc, curr) => {
    if (curr.parentAtRule === 'media') {
        return [...acc, curr.params];
    }
    return acc;
}, []);

const generateCustomProperties = (customPropsArr) => {
    return customPropsArr.reduce((acc, customProperty, index) => {
        return `${acc}${customProperty.name}: ${customProperty.value};${index === (customPropsArr.length - 1) ? '' : `\n\t`}`;
    }, `\t`)
}

const getPropertysByMediaQueryParams = (customPropertyList, params) => {
    const filteredProperties = customPropertyList.filter((customProp) => {
        return customProp.params === params;
    });

    return filteredProperties;
}

export const constructRootPseudo = (customPropertyList) => {

    /* TODO - construct media queries */

    const customPropertiesWithNoAtRules = customPropertyList.filter((customProperty) => {
        return customProperty.parentAtRule === null;
    });

   const mediaQueries = getMediaQueries(customPropertyList);

    return `
:root {
${generateCustomProperties(customPropertiesWithNoAtRules)}
}\n\n${mediaQueries.length > 0 ? `${mediaQueries.reduce((acc, mq) => {
    return `${acc}@media ${mq} {
    :root {
    ${generateCustomProperties(getPropertysByMediaQueryParams(customPropertyList, mq))}
    }
}\n\n`;
    }, '')}` : ``}`
}