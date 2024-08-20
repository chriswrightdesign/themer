import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import {makeCommentsSafe} from './makeCommentsSafe.mjs';
import {declarationColorRegex, colorSyntaxRegex} from './regexHelpers.mjs';

const fileInput = 'test.scss';
const outputDir = process.cwd();
const CSVFileOutput = 'report.csv';

const srcPath = path.resolve(process.cwd(), fileInput);
const content = fs.readFileSync(srcPath);

const safeContent = makeCommentsSafe(content);
/**
 * 
 * Report occurrences of 'color'
 * Report by property (how many box shadows exist and what are they)
 * find selectors with similar combinations of properties (max-width: 1600, margin auto for example)
 */

const generalColorInfo = [];

const borderColors = [];
const backgroundColors = [];
const textColors = [];
const svgColors = [];
const shadowColors = [];

const simpleProps = ['fill', 'background-color', 'stroke', 'color'];

/**
 * {
 *    propertyType: 'color' | 'fill' | 'stroke' | 'background-color'
 *    value: #hexrgba  
 * }
 */

const writeCSV = ({data, headings = 'Color, Occurrence'}) => {

    const output = path.resolve(outputDir, CSVFileOutput);

    // sort first, then output

    const dataOutput = Object.keys(data).reduce((acc, value) => {
        return acc += `"${value}", ${data[value]}\n`
    }, `${headings} \n`);


    fs.writeFileSync(output, dataOutput, 'utf8');

    console.log('CSV written');
}


const generateColorStats = (colorList) => {
    const colorStats = colorList.reduce((stats, curr) => {

        const colorValue = curr.value;
        // for every colour that you find, add it to the list
        if (!stats[colorValue]) {
            return {
                ...stats,
                [colorValue]: 1,
            }
        }

        if (stats[colorValue]) {
            return {
                ...stats,
                [colorValue]: stats[colorValue] + 1,
            }
        }
        return stats;
    }, {});

    return colorStats;
}

export const reportColors = () => {
    const root = postcss.parse(safeContent);

    root.walkRules(function(rule) {

        rule.walkDecls(declarationColorRegex, function(decl) {

            const {prop, value, parent} = decl;

            /* Do not continue if we see a var() in the value */
            if (value.trim().includes('var')) {
                return;
            }


            const colors = (value.match(colorSyntaxRegex) || []).filter(Boolean);

            colors.forEach((color) => {
                generalColorInfo.push({
                    value: color,
                    category: prop,
                })
            });

        });

    });

    const colorReport = generateColorStats(generalColorInfo);

    writeCSV({data: colorReport});

    
}

reportColors();
