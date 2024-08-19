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

const getProcessedValueString = ({prop, value, customProperty}) => {

    /* Border split with weight/style/color */
    if (prop === 'border') {
        const [weight, style] = value.split(' ');
        return `${weight} ${style} var(${customProperty})`;
    }

    // Happy path, just return the custom property as the new value
    return `var(${customProperty})`;

}

export const themer = () => {

    const root = postcss.parse(safeContent);

    root.walkRules(function(rule) {
        rule.walkDecls(declarationColorRegex, function(decl) {

            const {prop, value, important, parent} = decl;

            if (value.trim().includes('var')) {
                return;
            }

            const variable = createCustomPropertyObject({prefix, selector: parent.selector, prop, value, important, parent});

            themeRootVarItems.push(variable);

            decl.assign({ prop, value: `var(${variable.name})` })
        });

        rule.walkDecls(declarationSpacingRegex, function(decl) {
            const {prop, value, important} = decl;

            const variable = createCustomPropertyObject({prefix, selector: rule.selector, prop, value, important});

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