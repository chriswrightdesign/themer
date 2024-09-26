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
.addOption(new Option('-p, --prefix <string>', 'prefix for all variables').default('themer'));

program.parse();

const options = program.opts();

const inputPattern = options.input;

const cssFiles = globSync([inputPattern], { 
    ignore: {
        ignored: p => /\.processed.scss$/.test(p.name),
} });

if (cssFiles.length === 0) {
    console.log('No files found.');
    process.exit(0);
}

const fileInput = cssFiles[0];

const fileOutput = options.replace ? fileInput : fileInput.replace(/.((s|p?)css)/, `.processed.$1`);

const prefix = options.prefix;
const outputDir = options.outputdir;

themeFile({fileInput, fileOutput, outputDir, prefix});
