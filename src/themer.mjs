#!/usr/bin/env node

import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {Command, Option} from 'commander';
import {constructRootPseudo, makeCommentsSafe, createCustomPropertyObject, generatePropertyValue} from './utils.mjs';
import {declarationColorRegex, declarationBoxShadowRegex, declarationSpacingRegex, declarationFontRegex, declarationRadiusRegex} from './regexHelpers.mjs';

const cwd = process.cwd();
const program = new Command();

program
.addOption(new Option('-i, --input <file>', 'file to process'))
.addOption(new Option('-o, --outputdir <dir>', 'directory output').default(cwd))
.addOption(new Option('-p, --prefix <string>', 'prefix for all variables').default('themer'));

program.parse();

const options = program.opts();

const fileInput = options.input;
const fileOutput = fileInput.replace(/.((s?)css)/, `.processed.$1`);

const prefix = options.prefix;
const outputDir = options.outputdir;

const srcPath = path.resolve(process.cwd(), fileInput);
const content = fs.readFileSync(srcPath);

// Replace any // with /* */ because postcss hates it
const safeContent = makeCommentsSafe(content);

const themeRootVarItems = [];
const boxShadowVarItems = [];
const spacingRootVarItems = [];
const fontRootVarItems = [];
const radiusRootVarItems = [];
const backgroundImageRootVarItems = [];

const renderIfPresent = (itemsArr, name) => {
    return itemsArr.length > 0 ? `/* Start: ${name} */
${constructRootPseudo(itemsArr)}
/* End: ${name} */\n\n` : '';
}

const recordAndReassignCustomProps = (declaration, recordArray) => {

    const {prop, value, important, parent} = declaration;

    /* Do not continue if we see a var() in the value */
    if (value.trim().includes('var')) {
        return;
    }

    const variable = createCustomPropertyObject({prefix, prop, value, important, parent});

    /* Handle when we get nothing back in return */
    if (variable === null) {
        return;
    }

    recordArray.push(variable);

    declaration.assign({ 
        prop, 
        value: generatePropertyValue({
            name: variable.name,
            prop,
            originalValue: variable.originalValue,
        }) 
    });
}

export const themer = () => {

    const root = postcss.parse(safeContent);

    root.walkRules(function(rule) {
        // colors
        rule.walkDecls(declarationColorRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, themeRootVarItems);
        });

        rule.walkDecls(declarationBoxShadowRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, boxShadowVarItems);
        });

        // box shadow

        // spacings
        rule.walkDecls(declarationSpacingRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, spacingRootVarItems);
        });

        // fonts
        rule.walkDecls(declarationFontRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, fontRootVarItems);
        });

        // border-radius
        rule.walkDecls(declarationRadiusRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, radiusRootVarItems);
        });

        rule.walkDecls(/^background-image$/, function(declaration) {
            recordAndReassignCustomProps(declaration, backgroundImageRootVarItems);
        });
    });

    const stringified = root.toResult().css;

    try {
        fs.writeFileSync(path.resolve(outputDir, fileOutput), `${renderIfPresent(themeRootVarItems, 'Colors')}${renderIfPresent(boxShadowVarItems, 'Box-shadow')}${renderIfPresent(radiusRootVarItems, 'Border-radius')}${renderIfPresent(radiusRootVarItems, 'Border-radius')}${renderIfPresent(fontRootVarItems, 'Typography')}${renderIfPresent(spacingRootVarItems, 'Spacing')}${renderIfPresent(backgroundImageRootVarItems, 'Background images')}${stringified}`);
        console.log(`File written: ${fileOutput}`); 
    } catch(err) {
        console.log('Error writing file')
    }
    
    
}

themer();