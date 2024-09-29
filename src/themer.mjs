#!/usr/bin/env node

import {Command, Option} from 'commander';
import {globSync} from 'glob';

import {themeFile} from './themeFile.mjs';

const program = new Command();

const rootDir = process.cwd();

program
.addOption(new Option('-i, --input <file>', 'file to process'))
.addOption(new Option('-o, --outputdir <dir>', 'directory output').default(rootDir))
.addOption(new Option('-r, --replace [type]', 'replace existing file'))
.addOption(new Option('-t, --type [type]', 'output type').default('props'))
.addOption(new Option('-p, --prefix <string>', 'prefix for all variables').default('themer'));

program.parse();

const options = program.opts();

const inputPattern = options.input;

const cssFiles = globSync([`${inputPattern}`], { 
    ignore: {
        ignored: p => /\.processed.scss$/.test(p.name),
} });

if (cssFiles.length === 0) {
    console.log('No files found.');
    process.exit(0);
}

const prefix = options.prefix;
const outputDir = options.outputdir;
const outputType = options.type;

const getFileOutput = (fileInput, outputType) => {

    if (outputType === 'js') {
        return fileInput.replace(/.((s|p?)css)/, `.processed.js`)
    }

    return fileInput.replace(/.((s|p?)css)/, `.processed.$1`)
}

cssFiles.forEach((cssFile) => {
    const fileInput = cssFile;

    const fileOutput = options.replace && outputType !== 'js' ? fileInput : getFileOutput(fileInput, outputType);

    themeFile({
        fileInput, 
        fileOutput, 
        outputDir, 
        prefix, 
        outputType
    });
})





