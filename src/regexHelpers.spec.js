import {describe, expect, test} from '@jest/globals';
import {colorSyntaxRegex} from './regexHelpers.mjs';

describe('colorSyntaxRegex', () => {

  const regexMatch = (str) => str.match(colorSyntaxRegex);

  const backgroundColorTests = [
    {value: 'background-color: #fff;', expected: ['#fff'], exclusions: []},
    {value: 'background-color: #fff;', expected: ['#fff'], exclusions: []},
    {value: 'background-color: #ff00ffaa;', expected: ['#ff00ffaa'], exclusions: []},
    {value: 'background-color: rgba(0, 1, 16, 0.25);', expected: ['rgba(0, 1, 16, 0.25)'], exclusions: []},
    {value: 'background-color: rgb(0, 0, 255);', expected: ['rgb(0, 0, 255)'], exclusions: []},
    {value: 'background-color: hsl(30deg 82% 43%)', expected: ['hsl(30deg 82% 43%)'], exclusions: []},
    {value: 'background-color: hsla(237deg 74% 33% / 61%);', expected: ['hsla(237deg 74% 33% / 61%)'], exclusions: []},
    {value: 'background-color: hwb(152deg 0% / 70%);', expected: ['hwb(152deg 0% / 70%)']},
    {value: 'background-color: green;', expected: ['green'], exclusions: []},
];

const strokeTests = [
    {value: 'stroke: rgb(153 51 102 / 1);', expected: ['rgb(153 51 102 / 1)'], exclusions: []},
    {value: 'stroke: context-stroke', expected: [], exclusions: ['content-stroke']},
    {value: 'stroke: color-mix(in lch, #f0f 35%, gray 15%));', expected: ['#f0f'], exclusions: ['lch', 'in']},
];

const fillTests = [
    {value: `fill: url(#gradientElementId) blue;`, expected: ['blue']},
    {value: `fill: url(star.png) none;`, expected: [],  exclusions: ['none']}, // avoid none
    {value: `fill: red;`, expected: ['red'], exclusions: []},
    {value: `fill: hsl(120deg 75% 25% / 60%);`, expected: ['hsl(120deg 75% 25% / 60%)']},
    {value: `fill: context-stroke;`, expected: [], exclusions: ['content-stroke']}, // avoid context stroke
    {value: `fill: context-fill;`, expected: [], exclusions: ['context-fill']},
    {value: `fill: none;`, expected: [], exclusions: ['none']} // avoid none
];

const backgroundTests = [
    {value: `background: content-box radial-gradient(crimson, skyblue);`, expected: [], exclusions: ['content-box']},
    {value: `background: left 5% / 15% repeat-x url('../../');`, expected: [], exclusions: ['repeat-x', 'left', `url('../../')`]},
    {value: `background: center / contain no-repeat #eee 35% url('../../');`, expected: ['#eee'], exclusions: ['center', 'contain', 'no-repeat', `url('../../')`, '35%']},
    {value: 'background: border-box red', expected: ['red'], exclusions: ['border-box']},
];


const singleBoxShadowTests = [
    {value: 'box-shadow: 10px 5px 5px red;', expected: ['red'], exclusions: []},
    {value: 'box-shadow: 10px 5px -5px teal;', expected: ['teal'], exclusions: []},
    {value: 'box-shadow: 10px 5px -5px #f0f;', expected: ['#f0f'], exclusions: []},
    {value: 'box-shadow: 10px 5px -5px rgba(0, 0, 255, .2);', expected: ['rgba(0, 0, 255, .2)'], exclusions: []},
    {value: 'box-shadow: inset 5em -5px gold;', expected: ['gold'], exclusions: ['inset']},
];

const multiBoxShadowTests = [
    {value: 'box-shadow: 3px 3px rgba(0, 0, 0, 0.5) inset, -1em 0 0.4em #f0f;', expected: ['rgba(0, 0, 0, 0.5)', '#f0f'], exclusions: ['inset', '3px']},
    {value: 'box-shadow: 3px 3px red inset, -1em 0 0.4em olive;', expected: ['red', 'olive'], exclusions: ['inset']},
]
const borderColorTests = [
    {value: 'border-color: red;', expected: ['red'], exclusions: []},
    {value: 'border-color: red #32a1ce;', expected: ['red', '#32a1ce'], exclusions: []},
    {value: 'border-color: red rgba(170, 50, 220, 0.2) green', expected: ['red', 'rgba(170, 50, 220, 0.2)','green'], exclusions: []},
    {value: 'border-color: red yellow green transparent', expected: ['red', 'yellow', 'green'], exclusions: ['transparent']},
];

const borderTests = [
    {value: 'border: 1px solid;', expected: [], exclusions: ['solid']},
    {value: 'border: thick double #32a1ce;', expected: ['#32a1ce'], exclusions: ['thick', 'double']},
    {value: 'border: dashed red', expected: ['red'], exclusions: ['dashed']},
    {value: 'border: 4mm ridge rgba(211, 220, 50, 0.6);', expected: ['rgba(211, 220, 50, 0.6)'], exclusions: ['ridge']}
]
  

const generateTests = (testArr) => {
    testArr.forEach((testItem) => {

        test(`${testItem.value}`, () => {
            const expList = testItem.expected;

            expList.forEach((exp) => {
                const testedValue = regexMatch(testItem.value);
                expect(testedValue).toContain(exp);
            });

        });
    });
}

generateTests(backgroundColorTests);

generateTests(fillTests);

generateTests(strokeTests);

generateTests(backgroundTests);

generateTests(singleBoxShadowTests);

generateTests(multiBoxShadowTests);

generateTests(borderColorTests);

generateTests(borderTests);

});