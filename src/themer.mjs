#!/usr/bin/env node

import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {Command, Option} from 'commander';
import {constructRootPseudo, makeCommentsSafe, createCustomPropertyObject, generatePropertyValue} from './utils.mjs';
import {declarationColorRegex, declarationBackgroundRegex, declarationBorderRegex, declarationBoxShadowRegex, declarationSpacingRegex, declarationFontRegex, declarationRadiusRegex} from './regexHelpers.mjs';

const cwd = process.cwd();
const program = new Command();

program
.addOption(new Option('-i, --input <file>', 'file to process'))
.addOption(new Option('-o, --outputdir <dir>', 'directory output').default(cwd))
.addOption(new Option('-r, --replace [type]', 'replace existing file'))
.addOption(new Option('-p, --prefix <string>', 'prefix for all variables').default('themer'));

program.parse();

const options = program.opts();

const fileInput = options.input;
const fileOutput = options.replace ? fileInput : fileInput.replace(/.((s|p?)css)/, `.processed.$1`);

const prefix = options.prefix;
const outputDir = options.outputdir;

const srcPath = path.resolve(process.cwd(), fileInput);
const content = fs.readFileSync(srcPath);

// Replace any // with /* */ because postcss hates it
const safeContent = makeCommentsSafe(content);

const colorVarItems = [];
const boxShadowVarItems = [];
const spacingRootVarItems = [];
const fontRootVarItems = [];
const radiusRootVarItems = [];
const backgroundImageVarItems = [];
const backgroundVarItems = [];
const borderVarItems = [];

const renderIfPresent = (itemsArr, name) => {
    return itemsArr.length > 0 ? `/* Start: ${name} */
${constructRootPseudo(itemsArr)}
/* End: ${name} */\n\n` : '';
}

const zeroValues = ['0', '0px', '0rem', '0 auto', '0em', '0 auto 0'];


const recordAndReassignCustomProps = (declaration, recordArray) => {

    const {prop, value, important, parent} = declaration;

    /* Do not continue if we see a var() in the value */
    if (value.trim().includes('var') || value === 'currentColor') {
        return;
    }

    /* Line heights of 1 aren't useful */
    if (prop === 'line-height' && value === '1') {
        return;
    }

    /* Do not include zero values */
    if (zeroValues.includes(value)) {
        return;
    }

    const variable = createCustomPropertyObject({prefix, prop, value, important, parent});

    /* Handle when we get nothing back in return */
    if (variable === null) {
        return;
    }

    const existsAlready = recordArray.some((record) => {
        return record.name === variable.name && record.value === variable.value;
    })

    if (!existsAlready) {
        recordArray.push(variable);
    }

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
            recordAndReassignCustomProps(declaration, backgroundImageVarItems);
        });
    });

    const stringified = root.toResult().css;

    try {
        fs.writeFileSync(path.resolve(outputDir, fileOutput), `${renderIfPresent(colorVarItems, 'Colors')}${renderIfPresent(borderVarItems, 'Border')}${renderIfPresent(backgroundVarItems, 'Background')}${renderIfPresent(boxShadowVarItems, 'Box-shadow')}${renderIfPresent(radiusRootVarItems, 'Border-radius')}${renderIfPresent(fontRootVarItems, 'Typography')}${renderIfPresent(spacingRootVarItems, 'Spacing')}${renderIfPresent(backgroundImageVarItems, 'Background images')}${stringified}`);
        console.log(`File written: ${fileOutput}`); 
    } catch(err) {
        console.log('Error writing file: ', err);
    }
    
    
}

themer();