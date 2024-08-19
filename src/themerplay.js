const postcss = require('postcss');
const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(process.cwd(), 'test.scss');
const content = fs.readFileSync(srcPath); // might need to toString it

// we can handle // by doing a regex replace
const safeContent = content.toString().replace(/(\/\/).(.+)/gi, `/* $2 */`);



const themeRootVarItems = [];
const spacingRootVarItems = [];
const fontRootVarItems = [];

const prefix = `--cm-legacy`;

/**
    Learning 1: Extract values to something root like
    Learning 2: Replace the values in the css file
 */

const parseSelector = (selector) => {

    /**
     * Handle comma separated selectors, e.g. .something, somethingelse, somethingelse {} take the first one
     */
    const [firstSelector] = selector.split(',');

    /*
     *  Handle parent selectors e.g. .box h1 make box-h1, handle .box .boxchild as box-boxchild
     */
    const selectorWithNoSpaces = firstSelector.replace(/\s/ig, '-').replace(/\./ig, '-');


    /**
     * Handle pseudo selectors, pseudo classes, BEM __, --, and any remaining .
     * We leave # so there is no confusion around . and # selection
     */
    return `${selectorWithNoSpaces}`.replace(/::|:|__|--/gi, '-');
};


const createVariable = ({selector, prop, value, important, parent}) => {
    const appendedParent = parent.parent.selector ? `${parseSelector(parent.parent.selector)}-` : ``;

    const objKey = `${prefix}${appendedParent}${parseSelector(selector)}-${prop}`;

    const objValue = `${value}${important ? ` !important` : ``}`;

    return {
        [objKey]: objValue,
    };
};


const getParentInfo = (parent) => {
    if (parent.parent.name !== undefined && parent.parent.type === 'atrule') {
        return {
            parentAtRule: parent.parent.name,
            params: parent.parent.params,
        };
    }

    return {parentAtRule: 'none'};
};

const processed = postcss.parse(safeContent).then((result) => {
    console.log(result);
});


// root.walkRules(function(rule) {
//     rule.walkDecls(/^(border|box-shadow|border-color|fill|stroke|color|background-color|background$)/, function(decl) {

//         const {prop, value, important, parent} = decl;

//         if (value.trim().startsWith('var')) {
//             return;
//         }

//         const parentInfo = getParentInfo(parent);

//         const parsedValue = prop === 'border' ? value.split(' ').slice(-1)[0] : value;

//         const parsedProp = prop === 'border' ? `${prop}-color` : prop;

//         const variable = createVariable({selector: parent.selector, prop: parsedProp, value: parsedValue, important, parent});

//         themeRootVarItems.push({
//             ...variable,
//             ...parentInfo,
//         });

//         decl.value = `var(${variable})`;

//     });

//     rule.walkDecls(/^(padding-?|margin-?)/, function(decl) {
//         const {prop, value, important} = decl;

//         const variable = createVariable({selector: rule.selector, prop, value, important});

//         spacingRootVarItems.push(variable);
//     });
// });

// How to assign a property
// decl.assign({ prop: 'background', value: 'var(--something)' })

// .toResult().css;


// console.log(themeRootVarItems);

// console.log(spacingRootVarItems);
