
const getMediaQueries = (customPropertyList) => {
    const mqList = customPropertyList.reduce((acc, curr) => {
        if (curr.parentAtRule === 'media') {
            return [...acc, curr.params];
        }
        return acc;
    }, []);

    const mqListDeduped = [...new Set(mqList)];
    return mqListDeduped;
} 

const generateCustomProperties = (customPropsArr, spacingValue = '') => {
    return customPropsArr.reduce((acc, customProperty, index) => {
        return `${acc}\t${spacingValue}${customProperty.name}: ${customProperty.value};${index === (customPropsArr.length - 1) ? '' : `\n`}`;
    }, spacingValue)
}

const getPropertysByMediaQueryParams = (customPropertyList, params) => {
    const filteredProperties = customPropertyList.filter((customProp) => {
        return customProp.params === params;
    });

    return filteredProperties;
}

export const constructRootPseudo = (customPropertyList) => {

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