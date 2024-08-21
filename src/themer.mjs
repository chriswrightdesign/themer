import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import { Command, Option } from 'commander';
import {constructRootPseudo, makeCommentsSafe, createCustomPropertyObject, generatePropertyValue} from './utils.mjs';
import {declarationColorRegex, declarationSpacingRegex, declarationFontRegex} from './regexHelpers.mjs';

const cwd = process.cwd();
const program = new Command();

program
.addOption(new Option('-i, --input <file>', 'file to process'))
.addOption(new Option('-o, --outputdir <dir>', 'directory output').default(cwd))
.addOption(new Option('-p, --prefix <string>', 'prefix for all variables').default('themer'));

program.parse();

const options = program.opts();

console.log(options);

const fileInput = options.input;
const fileOutput = fileInput.replace(/.((s?)css)/, `.processed.$1`);

const prefix = options.prefix;
const outputDir = options.outputdir;

const srcPath = path.resolve(process.cwd(), fileInput);
const content = fs.readFileSync(srcPath);

// Replace any // with /* */ becase postcss hates it
const safeContent = makeCommentsSafe(content);

const themeRootVarItems = [];
const spacingRootVarItems = [];
const fontRootVarItems = [];

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
        rule.walkDecls(declarationColorRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, themeRootVarItems);
        });

        rule.walkDecls(declarationSpacingRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, spacingRootVarItems);
        });

        rule.walkDecls(declarationFontRegex, function(declaration) {
            recordAndReassignCustomProps(declaration, fontRootVarItems);

        });
    });

    const stringified = root.toResult().css;
    fs.writeFileSync(path.resolve(outputDir, fileOutput), `${constructRootPseudo([...themeRootVarItems, ...spacingRootVarItems, ...fontRootVarItems])}${stringified}`);
    console.log('Output CSS file written.'); 
}

themer();