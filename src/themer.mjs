import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {createCustomPropertyObject} from './createCustomPropertyObject.mjs';
import {makeCommentsSafe} from './makeCommentsSafe.mjs';
import {declarationColorRegex, declarationSpacingRegex} from './regexHelpers.mjs';

// TODO - Make arguments
const prefix = `--themer`;
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
        });
    });


    console.log(themeRootVarItems);

    /*
        Can I get Postcss to insert a root node at the top?
    */

    const stringified = root.toResult().css;
    fs.writeFileSync(path.resolve(outputDir, fileOutput), stringified);   
}

themer();