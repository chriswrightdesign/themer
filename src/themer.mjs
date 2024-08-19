import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {parseSelector} from './parseSelector.mjs';
import {createCustomPropertyObject} from './createCustomPropertyObject.mjs';
import {getParentAtRule} from './getParentAtRule.mjs';
import {makeCommentsSafe} from './makeCommentsSafe.mjs';

const srcPath = path.resolve(process.cwd(), 'test.scss');
const content = fs.readFileSync(srcPath); // might need to toString it

// Replace any // with /* */ becase postcss hates it
const safeContent = makeCommentsSafe(content);

// TODO - make prefix an argument
const prefix = `--themer`;

const themeRootVarItems = [];
const spacingRootVarItems = [];
const fontRootVarItems = [];

export const themer = () => {

    const root = postcss.parse(safeContent);


root.walkRules(function(rule) {
    rule.walkDecls(/^(border|box-shadow|border-color|fill|stroke|color|background-color|background$)/, function(decl) {

        const {prop, value, important, parent} = decl;

        if (value.trim().startsWith('var')) {
            return;
        }

        const parentInfo = getParentAtRule(parent);

        const parsedValue = prop === 'border' ? value.split(' ').slice(-1)[0] : value;

        const parsedProp = prop === 'border' ? `${prop}-color` : prop;

        const variable = createCustomPropertyObject({prefix, selector: parent.selector, prop: parsedProp, value: parsedValue, important, parent});

        themeRootVarItems.push({
            ...variable,
            ...parentInfo,
        });

        decl.value = `var(${variable})`;

    });

    rule.walkDecls(/^(padding-?|margin-?)/, function(decl) {
        const {prop, value, important} = decl;

        const variable = createCustomPropertyObject({prefix, selector: rule.selector, prop, value, important});

        spacingRootVarItems.push(variable);
    });
});


console.log(themeRootVarItems);
    
}

themer();