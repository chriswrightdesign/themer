import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {constructRootPseudo, makeCommentsSafe, createCustomPropertyObject} from './utils.mjs';
import {declarationColorRegex, declarationSpacingRegex, declarationFontRegex} from './regexHelpers.mjs';

// TODO - Make arguments
const prefix = `themer`;
const fileInput = 'test.scss';
const fileOutput = 'test_processed.scss';
const outputDir = process.cwd();

const srcPath = path.resolve(process.cwd(), fileInput);
const content = fs.readFileSync(srcPath);

// Replace any // with /* */ becase postcss hates it
const safeContent = makeCommentsSafe(content);

const themeRootVarItems = [];
const spacingRootVarItems = [];
const fontRootVarItems = [];

const generatePropertyValue = ({name, prop, originalValue}) => {

    // use regex replace
    if (prop === 'border') {
        const [width, style] = originalValue.split(' ').slice(0, 2);
        return `${width} ${style} var(${name})`;
    }
    return `var(${name})`;
}

export const themer = () => {

    const root = postcss.parse(safeContent);

    root.walkRules(function(rule) {
        rule.walkDecls(declarationColorRegex, function(decl) {

            const {prop, value, important, parent} = decl;

            /* Do not continue if we see a var() in the value */
            if (value.trim().includes('var')) {
                return;
            }

            const variable = createCustomPropertyObject({prefix, prop, value, important, parent});
    
            /* Handle when we get nothing back in return */
            if (variable === null) {
                return;
            }
        
            themeRootVarItems.push(variable);

            decl.assign({ 
                prop, 
                value: generatePropertyValue({
                    name: variable.name,
                    prop,
                    originalValue: variable.originalValue,
                }) 
            });
        });

        rule.walkDecls(declarationSpacingRegex, function(decl) {
            const {prop, value, important, parent} = decl;

            const variable = createCustomPropertyObject({prefix, prop, value, important, parent});

            spacingRootVarItems.push(variable);

            decl.assign({ 
                prop, 
                value: generatePropertyValue({
                    name: variable.name,
                    prop,
                    originalValue: variable.originalValue,
                }) 
            });
        });

        rule.walkDecls(declarationFontRegex, function(decl) {
            const {prop, value, important, parent} = decl;

            const variable = createCustomPropertyObject({prefix, prop, value, important, parent});

            fontRootVarItems.push(variable);

            decl.assign({ 
                prop, 
                value: generatePropertyValue({
                    name: variable.name,
                    prop,
                    originalValue: variable.originalValue,
                }) 
            });

        });
    });

    const stringified = root.toResult().css;
    fs.writeFileSync(path.resolve(outputDir, fileOutput), `${constructRootPseudo([...themeRootVarItems, ...spacingRootVarItems, ...fontRootVarItems])}${stringified}`);
    console.log('Output CSS file written.'); 
}

themer();