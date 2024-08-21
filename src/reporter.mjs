import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {declarationColorRegex, colorSyntaxRegex, declarationSpacingRegex} from './regexHelpers.mjs';
import {generateStatsObject, getColorsByCategory, makeCommentsSafe, writeCSV} from './utils.mjs';

const fileInput = 'test.scss';
const outputDir = process.cwd();

const srcPath = path.resolve(process.cwd(), fileInput);
const content = fs.readFileSync(srcPath);

const safeContent = makeCommentsSafe(content);

const generalColorInfo = [];
const generalSpacingInfo = [];
const generalBoxShadowInfo = [];

export const createReport = () => {
    const root = postcss.parse(safeContent);

    root.walkRules(function(rule) {

        rule.walkDecls(/box-shadow/, function(decl) {
            const {prop, value} = decl;

            /* Do not continue if we see a var() in the value */
            if (value.trim().includes('var')) {
                return;
            }

            generalBoxShadowInfo.push({
                value,
                prop,
            });

        });

        rule.walkDecls(declarationSpacingRegex, function(decl) {
            const {prop, value} = decl;

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

        rule.walkDecls(declarationColorRegex, function(decl) {

            const {prop, value} = decl;

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

    writeCSV({data: colorReport, outputDir, outputFile: 'report-colors-general.csv', headings: 'Color, Occurrence'});
    writeCSV({data: borderReport, outputDir, outputFile: 'report-border-colors.csv', headings: 'Color, Occurrence'});
    writeCSV({data: textColors, outputDir, outputFile: 'report-text-colors.csv', headings: 'Color, Occurrence'});
    writeCSV({data: boxShadowColors, outputDir, outputFile: 'report-shadow-colors.csv', headings: 'Color, Occurrence'});

    writeCSV({data: spacingReport, outputDir, outputFile: 'report-spacings.csv', headings: 'Spacing, Occurrence'});
    writeCSV({data: boxShadowReport, outputDir, outputFile: 'report-box-shadows.csv', headings: 'Shadow, Occurrence'});
}

createReport();
