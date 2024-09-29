import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {
    declarationColorRegex, 
    declarationBackgroundRegex, 
    declarationBorderRegex, 
    declarationBoxShadowRegex,
    declarationSpacingRegex, 
    declarationFontSizeRegex,
    declarationFontFamilyRegex,
    declarationLineHeightRegex,
    declarationRadiusRegex,
    declarationBackgroundImageRegex,
    colorSyntaxRegex
} from './regexHelpers.mjs';

import {
    createFile, 
    store, 
    recordNewValue, 
    renderIfPresent, 
    createOutputValue, 
    makeCommentsSafe, 
    createPropertyObject, 
    generatePropertyValue
} from './utils.mjs';

const rootDir = process.cwd();

export const themeFile = ({fileInput, fileOutput, outputDir, prefix, outputType = 'props'}) => {

    const boxShadowStore = store();

    const srcPath = path.resolve(rootDir, fileInput);
    const content = fs.readFileSync(srcPath);

    // Replace any // with /* */ because postcss hates it
    const safeContent = makeCommentsSafe(content);

    // temporary arrays for different variables
    const colorVarItems = [];
    const boxShadowVarItems = [];
    const spacingRootVarItems = [];
    const fontFamilyVarItems = [];
    const fontSizeVarItems = [];
    const fontLineHeightVarItems = [];
    const radiusRootVarItems = [];
    const backgroundImageVarItems = [];
    const backgroundVarItems = [];
    const borderVarItems = [];


    const ruleTypes = [
        {
            pattern: declarationColorRegex,
            items: colorVarItems,
        },
        {
            pattern: declarationBackgroundRegex,
            items: backgroundVarItems,
        },
        {
            pattern: declarationBoxShadowRegex,
            items: boxShadowVarItems,
        },
        {
            pattern: declarationBorderRegex,
            items: borderVarItems,
        },
        {
            pattern: declarationSpacingRegex,
            items: spacingRootVarItems,
        },
        {
            pattern: declarationFontFamilyRegex,
            items: fontFamilyVarItems,
        },
        {
            pattern: declarationFontSizeRegex,
            items: fontSizeVarItems,
        },
        {
            pattern: declarationLineHeightRegex,
            items: fontLineHeightVarItems,
        },
        {
            pattern: declarationRadiusRegex,
            items: radiusRootVarItems,
        },
        {
            pattern: declarationBackgroundImageRegex,
            items: backgroundImageVarItems,

        }
    ];

    const spacingProps = ['margin', 'padding', 'gap'];

    const recordAndReassignCustomProps = (declaration, recordArray) => {

        const {prop, value, important, parent} = declaration;

        /* Do not continue if we see a var() in the value */
        if (value.trim().includes('var') || value === 'currentColor') {
            return;
        }

        // handle spaced values / background
        if(prop === 'background' && value.includes(' ')) {

            const valueWithoutUrl = value.replace(/url\(.+\)/, '');

            const valuesSplit = valueWithoutUrl.match(colorSyntaxRegex);

            if (valuesSplit !== null) {

                const [colorValue] = valuesSplit;

                const colorVariable = createPropertyObject({
                    prefix, 
                    prop: 'background-color', 
                    value: colorValue, 
                    important, parent, 
                    store: boxShadowStore
                });

                const colorVariableName = colorVariable.name;
                const colorVariableValue = colorVariable.value;

                const newValue = value.replace(colorVariableValue, createOutputValue({name: colorVariableName, propertyType: outputType}));

                recordNewValue(colorVariable, 'background-color', recordArray);

                declaration.assign({ 
                    prop,
                    originalValue: newValue,
                    value: newValue,
                });
                return;

            }

        }

        // box shadow is incremented so we just check if any have the same value
        if (prop === 'box-shadow') {
            const boxShadowValue = recordArray.find((record) => {
                return record.value.trim() === value.trim();
            });

            // if it's not present continue, if it is present use the existing to do the declaration
            if (boxShadowValue) {

                declaration.assign({ 
                    prop, 
                    value: generatePropertyValue({
                        name: boxShadowValue.name,
                        prop,
                        originalValue: boxShadowValue.originalValue,
                        outputType,
                    }) 
                });
                return;
            }
        }

        // spaced values and border color
        if (prop === 'border-color' && value.includes(' ')) {

            const valuesSplit = value.match(colorSyntaxRegex);

            const getBorderDirection = (shortHandLength, currIndex) => {
                if (currIndex === 0 && shortHandLength === undefined) {
                    return undefined;
                }
                const shortHandMap = {
                    0: undefined,
                    1: undefined,
                    2: ['vertical', 'horizontal'],
                    3: ['top', 'horizontal', 'bottom'],
                    4: ['top', 'left', 'bottom', 'right'],
                }

                const direction = shortHandMap[shortHandLength][currIndex];

                return direction;
            }

            const newValues = valuesSplit.map((individualValue, index) => {

                const variable = createPropertyObject({
                    prefix, 
                    prop, 
                    value: individualValue, 
                    important, 
                    parent, 
                    store: boxShadowStore
                });

                if (valuesSplit.length <= 1) {
                    return {
                        ...variable,
                        name: `${variable.name}`
                    };
                }
                const borderDirection = getBorderDirection(valuesSplit.length, index);

                const borderSuffix = borderDirection !== '' ? `-${borderDirection}`: '';

                return {
                    ...variable,
                    name: `${variable.name}${borderSuffix}`
                };
            });

            const newValueString = newValues.filter((variable) => Boolean(variable)).reduce((acc, curr) => {

                recordNewValue(curr, prop, recordArray);
                return `${acc} ${createOutputValue({name: curr.name, propertyType: outputType})}`;
            },'');

            declaration.assign({ 
                prop, 
                value: newValueString.trimStart(), 
            });

            return;

        }

        if ((prop === 'border-radius' || spacingProps.includes(prop)) && value.includes(' ')) {
            const valuesSplit = value.trim().split(' ');

            const newValues = valuesSplit.map((individualValue) => {
                const variable = createPropertyObject({
                    prefix, 
                    prop, 
                    value: individualValue, 
                    important, 
                    parent, 
                    store: boxShadowStore
                });

                return variable;
            });

            const newValueString = newValues.filter((variable) => Boolean(variable)).reduce((acc, curr) => {

                recordNewValue(curr, prop, recordArray);
                return `${acc} ${createOutputValue({name: curr.name, propertyType: outputType})}`;
            },'');

            // construct a new value to assign to the declaration
            declaration.assign({ 
                prop, 
                value: newValueString.trimStart(), 
            });

            return;
        } 

        const variable = createPropertyObject({
            prefix, 
            prop, 
            value, 
            important, 
            parent, 
            store: boxShadowStore
        });

        /* Handle when we get nothing back in return */
        if (variable === null) {
            return;
        }

        recordNewValue(variable, prop, recordArray);

        declaration.assign({ 
            prop, 
            value: generatePropertyValue({
                name: variable.name,
                prop,
                originalValue: variable.originalValue,
                outputType,
            }) 
        });

    }

    const root = postcss.parse(safeContent);

    root.walkRules(function(rule) {
        ruleTypes.forEach((ruleType) => {
            rule.walkDecls(ruleType.pattern, function(declaration) {
                recordAndReassignCustomProps(declaration, ruleType.items);
            });
        })
    });

   

    if (outputType === 'js') {

        const allRules = ruleTypes.reduce((acc, ruleType) => {
            const {items} = ruleType;
            return [acc, ...items];
        }, []);
    
        const ruleTheme = allRules.reduce((acc, curr) => {
            return {
                ...acc,
                [curr.name]: curr.value,
            }
        }, {});

        const stringified = JSON.stringify(ruleTheme);

        createFile({
            outputDir, 
            fileOutput, 
            outputString: `export const theme = ${stringified}`,
        });

    }

    const stringified = root.toResult().css;

    createFile({
        outputDir, 
        fileOutput, 
        outputString: `${renderIfPresent(colorVarItems, 'Colors', outputType)}${renderIfPresent(borderVarItems, 'Border', outputType)}${renderIfPresent(backgroundVarItems, 'Background', outputType)}${renderIfPresent(boxShadowVarItems, 'Box-shadow', outputType)}${renderIfPresent(radiusRootVarItems, 'Border-radius', outputType)}${renderIfPresent(fontSizeVarItems, 'Typography: Font-size', outputType)}${renderIfPresent(fontFamilyVarItems, 'Typography: Font-family', outputType)}${renderIfPresent(fontLineHeightVarItems, 'Typography: Line-height', outputType)}${renderIfPresent(spacingRootVarItems, 'Spacing', outputType)}${renderIfPresent(backgroundImageVarItems, 'Background images', outputType)}${stringified}`
    });
        
        

}