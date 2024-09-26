import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {constructRootPseudo, makeCommentsSafe, createCustomPropertyObject, generatePropertyValue} from './utils.mjs';
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
    declarationBackgroundImageRegex
} from './regexHelpers.mjs';

import {colorSyntaxRegex} from './regexHelpers.mjs';

const rootDir = process.cwd();

function store() {
    const savedValues = [];

    return {
        add: (item) => {
            savedValues.push(item);
        },
        get: () => savedValues,
    }
}

export const themeFile = ({fileInput, fileOutput, outputDir, prefix}) => {

    const boxShadowStore = store();

    const srcPath = path.resolve(rootDir, fileInput);
    const content = fs.readFileSync(srcPath);

    // Replace any // with /* */ because postcss hates it
    const safeContent = makeCommentsSafe(content);

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

    const renderIfPresent = (itemsArr, name) => {
        return itemsArr.length > 0 ? `/* Start: ${name} */
${constructRootPseudo(itemsArr)}
/* End: ${name} */\n\n` : '';
    }

    const spacingProps = ['margin', 'padding', 'gap'];

    const recordNewValue = (variable, prop, recordArray) => {

        const existsAlready = recordArray.some((record) => {
            return record.name === variable.name && record.value === variable.value;
        })

        if (!existsAlready) {
            recordArray.push(variable);
        }
    }

    const recordAndReassignCustomProps = (declaration, recordArray) => {

        const {prop, value, important, parent} = declaration;

        /* Do not continue if we see a var() in the value */
        if (value.trim().includes('var') || value === 'currentColor') {
            return;
        }

        // handle background: #fff url('')
        if(prop === 'background' && value.includes(' ')) {

            const valuesSplit = value.match(colorSyntaxRegex);

            if (valuesSplit !== null) {

                const [colorValue] = valuesSplit;

                const colorVariable = createCustomPropertyObject({prefix, prop: 'background-color', value: colorValue, important, parent, store: boxShadowStore});

                const colorVariableName = colorVariable.name;
                const colorVariableValue = colorVariable.value;

                const newValue = value.replace(colorVariableValue, `var(${colorVariableName})`);

                recordNewValue(colorVariable, 'background-color', recordArray);

                declaration.assign({ 
                    prop, 
                    value: newValue,
                });
                return;

            }

            
        }

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
                    }) 
                });
                return;
            }
        }

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

                const variable = createCustomPropertyObject({prefix, prop, value: individualValue, important, parent, store: boxShadowStore});

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
                return `${acc} var(${curr.name})`;
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
                const variable = createCustomPropertyObject({prefix, prop, value: individualValue, important, parent, store: boxShadowStore});

                return variable;
            });

            const newValueString = newValues.filter((variable) => Boolean(variable)).reduce((acc, curr) => {

                recordNewValue(curr, prop, recordArray);
                return `${acc} var(${curr.name})`;
            },'');

            // construct a new value to assign to the declaration
            declaration.assign({ 
                prop, 
                value: newValueString.trimStart(), 
            });

            return;
        } 

        const variable = createCustomPropertyObject({prefix, prop, value, important, parent, store: boxShadowStore});

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
            }) 
        });

    }


    const root = postcss.parse(safeContent);

    root.walkRules(function(rule) {
        // colors
        rule.walkDecls(declarationColorRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, colorVarItems);
        });

        rule.walkDecls(declarationBackgroundRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, backgroundVarItems);
        });

        rule.walkDecls(declarationBoxShadowRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, boxShadowVarItems);
        });

        rule.walkDecls(declarationBorderRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, borderVarItems);
        });

        // spacings
        rule.walkDecls(declarationSpacingRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, spacingRootVarItems);
        });

        // font family
        rule.walkDecls(declarationFontFamilyRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, fontFamilyVarItems);
        });

        // font size
        rule.walkDecls(declarationFontSizeRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, fontSizeVarItems);
        });

        // line-height
        rule.walkDecls(declarationLineHeightRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, fontLineHeightVarItems);
        });

        // border-radius
        rule.walkDecls(declarationRadiusRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, radiusRootVarItems);
        });

        rule.walkDecls(declarationBackgroundImageRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, backgroundImageVarItems);
        });
    });

    const stringified = root.toResult().css;

    try {

        fs.writeFileSync(path.resolve(outputDir, fileOutput), `${renderIfPresent(colorVarItems, 'Colors')}${renderIfPresent(borderVarItems, 'Border')}${renderIfPresent(backgroundVarItems, 'Background')}${renderIfPresent(boxShadowVarItems, 'Box-shadow')}${renderIfPresent(radiusRootVarItems, 'Border-radius')}${renderIfPresent(fontSizeVarItems, 'Typography: Font-size')}${renderIfPresent(fontFamilyVarItems, 'Typography: Font-family')}${renderIfPresent(fontLineHeightVarItems, 'Typography: Line-height')}${renderIfPresent(spacingRootVarItems, 'Spacing')}${renderIfPresent(backgroundImageVarItems, 'Background images')}${stringified}`);
        console.log(`File written: ${fileOutput}`); 
    } catch(err) {
        console.log('Error writing file: ', err);
    }
        
        

}