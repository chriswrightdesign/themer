import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {Command, Option} from 'commander';
import {declarationColorRegex, colorSyntaxRegex, declarationSpacingRegex, declarationRadiusRegex} from './regexHelpers.mjs';
import {generateStatsObject, getColorsByCategory, makeCommentsSafe, writeCSV} from './utils.mjs';

const cwd = process.cwd();
const program = new Command();

program
.addOption(new Option('-i, --input <file>', 'file to process'))
.addOption(new Option('-o, --outputdir <dir>', 'directory output').default(cwd));

program.parse();

const options = program.opts();


const fileInput = options.input;
const outputDir = options.outputdir;

const srcPath = path.resolve(process.cwd(), fileInput);
const content = fs.readFileSync(srcPath);

const safeContent = makeCommentsSafe(content);

const generalColorInfo = [];
const generalSpacingInfo = [];
const generalBoxShadowInfo = [];
const generalRadiusInfo = [];

const generalFontSizeInfo = [];

export const createReport = () => {
    const root = postcss.parse(safeContent);

    root.walkRules(function(rule) {

        rule.walkDecls(/font-size/, function(declaration) {
            const {prop, value} = declaration;

            /* Do not continue if we see a var() in the value */
            if (value.trim().includes('var')) {
                return;
            }

            generalFontSizeInfo.push({
                value,
                prop,
            });
        });

        rule.walkDecls(/box-shadow/, function(declaration) {
            const {prop, value} = declaration;

            /* Do not continue if we see a var() in the value */
            if (value.trim().includes('var')) {
                return;
            }

            generalBoxShadowInfo.push({
                value,
                prop,
            });

        });

        rule.walkDecls(declarationRadiusRegex, function(declaration) {
            const {prop, value} = declaration;

            /* Do not continue if we see a var() in the value */
            if (value.trim().includes('var')) {
                return;
            }

            // handle shorthand
            const values = value.split(' ');

            values.forEach((splitValue) => {
                generalRadiusInfo.push({
                    value: splitValue,
                    category: prop,
                });
            });
        });

        rule.walkDecls(declarationSpacingRegex, function(declaration) {
            const {prop, value} = declaration;

            /* Do not continue if we see a var() in the value */
            if (value.trim().includes('var')) {
                return;
            }

            // handle shorthand
            const values = value.split(' ');

            values.forEach((splitValue) => {
                generalSpacingInfo.push({
                    value: splitValue,
                    category: prop,
                });
            });

        });

        rule.walkDecls(declarationColorRegex, function(declaration) {

            const {prop, value} = declaration;

            /* Do not continue if we see a var() in the value */
            if (value.trim().includes('var')) {
                return;
            }

            const colors = (value.match(colorSyntaxRegex) || []).filter(Boolean);

            colors.forEach((color) => {
                generalColorInfo.push({
                    value: color,
                    category: prop,
                });
            });

        });

    });

    const colorReport = generateStatsObject(generalColorInfo);
    const borderReport = generateStatsObject(getColorsByCategory({categoryName: 'border', colorList: generalColorInfo, exact: false}));
    const textColors = generateStatsObject(getColorsByCategory({categoryName: 'color', colorList: generalColorInfo, exact: true}));
    const boxShadowColors = generateStatsObject(getColorsByCategory({categoryName: 'box-shadow', colorList: generalColorInfo, exact: false}));

    const spacingReport = generateStatsObject(generalSpacingInfo);
    const boxShadowReport = generateStatsObject(generalBoxShadowInfo);

    const radiusReport = generateStatsObject(generalRadiusInfo);

    const fontSizeReport = generateStatsObject(generalFontSizeInfo);

    writeCSV({data: colorReport, outputDir, outputFile: 'report-colors-general.csv', headings: 'Color, Occurrence'});
    writeCSV({data: borderReport, outputDir, outputFile: 'report-border-colors.csv', headings: 'Color, Occurrence'});
    writeCSV({data: textColors, outputDir, outputFile: 'report-text-colors.csv', headings: 'Color, Occurrence'});
    writeCSV({data: boxShadowColors, outputDir, outputFile: 'report-shadow-colors.csv', headings: 'Color, Occurrence'});

    writeCSV({data: spacingReport, outputDir, outputFile: 'report-spacings.csv', headings: 'Spacing, Occurrence'});
    writeCSV({data: radiusReport, outputDir, outputFile: 'report-border-radii.csv', headings: 'Radius, Occurrence'});
    writeCSV({data: boxShadowReport, outputDir, outputFile: 'report-box-shadows.csv', headings: 'Shadow, Occurrence'});
    writeCSV({data: fontSizeReport, outputDir, outputFile: 'report-font-sizes.csv', headings: 'Font size, Occurrence'});
}

createReport();
