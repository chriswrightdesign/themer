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

            console.log(value);

            // blows up on green
            // cases we need box-shadow: 0px 0px 0 green;
            // case box-shadow: 0px 0px 0px green, inset 0px 0px green;

            const colors = value.match(/\w+(-)?\w+\(.+\)|#\w+|([a-z]+);|([a-z]+),/gi).filter(Boolean);

            console.log(colors);

            colors.forEach((color) => {
                generalColorInfo.push({
                    value: color,
                    category: prop,
                })
            })

            // if (simpleProps.includes(prop)) {
            //     // report
            //     generalColorInfo.push({
            //         value,
            //         category: prop,
            //     })
            // }

            // if (prop === 'border') {

            //     const borderValue = value.split(' ').slice(2).join(' ');
            //     if (borderValue === '') {
            //         return;
            //     }

            //     generalColorInfo.push({
            //         value: value.split(' ').slice(2).join(' '),
            //         category: prop,
            //     })
            // }

            // if (prop === 'background') {
            //     generalColorInfo.push({
            //         value,
            //         category: prop,
            //     })
            // }

            // if (prop === 'border-color') {

              
            //     generalColorInfo.push({
            //         value: value,
            //         category: prop,
            //     });
                
            // }

            // if (prop === 'box-shadow') {

            //     const boxShadowColors = value.match(/\w+(-)?\w+\(.+\)|#\w+/gi);

            //     boxShadowColors.forEach((boxShadowColor) => {
            //         generalColorInfo.push({
            //             value: boxShadowColor,
            //             category: prop,
            //         });
            //     })


            //     // will need to write a lot to handle box shadows
            // }

            // box-shadow is always the last value, but it doesn't alway start at the same area

            // /^(|box-shadow|border-color|background$)

        });

    });

    const colorReport = generateColorStats(generalColorInfo);

    writeCSV({data: colorReport});

    
}

reportColors();
