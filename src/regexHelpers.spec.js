import {describe, expect, test} from '@jest/globals';
import {colorSyntaxRegex, declarationColorRegex, declarationFontRegex, declarationSpacingRegex} from './regexHelpers.mjs';

const regexTest = (regEx) => (str) => str.match(regEx) || [];

describe('declarationColorRegex', () => {
    const declarationColorRegexMatch = regexTest(declarationColorRegex);

    it('should identify border, border-bottom-color, and border-color, but not border-style', () => {
        expect(declarationColorRegexMatch('border')).toContain('border');
        expect(declarationColorRegexMatch('border-color')).toContain('border-color');
        expect(declarationColorRegexMatch('border-bottom-color')).toContain('border-bottom-color');
        expect(declarationColorRegexMatch('border-style')).not.toContain('border-style');
        expect(declarationColorRegexMatch('border-width')).not.toContain('border-width');
    });

    it('should identify stroke, fill, color, and box-shadow', () => {
        expect(declarationColorRegexMatch('stroke')).toContain('stroke');
        expect(declarationColorRegexMatch('fill')).toContain('fill');
        expect(declarationColorRegexMatch('color')).toContain('color');
        expect(declarationColorRegexMatch('box-shadow')).toContain('box-shadow');
    });

    it('should identify background, background-color, but not background-image', () => {
        expect(declarationColorRegexMatch('background')).toContain('background');
        expect(declarationColorRegexMatch('background-color')).toContain('background-color');
        expect(declarationColorRegexMatch('background-image')).not.toContain('background-image');
    });
});

describe('declarationFontRegex', () => {
    const declarationFontRegexMatch = regexTest(declarationFontRegex);

    it('should identify font-family, font, font-weight, font-size', () => {
        expect(declarationFontRegexMatch('font')).toContain('font');
        expect(declarationFontRegexMatch('font-family')).toContain('font-family');
        expect(declarationFontRegexMatch('font-weight')).toContain('font-weight');
        expect(declarationFontRegexMatch('font-size')).toContain('font-size');
    });

    it('should identify line-height', () => {
        expect(declarationFontRegexMatch('line-height')).toContain('line-height');
    });
});

describe('declarationSpacingRegex', () => {

    const declarationSpacingRegexMatch = regexTest(declarationSpacingRegex);

    it('should identify padding, padding-left', () => {
        expect(declarationSpacingRegexMatch('padding')).toContain('padding');
        expect(declarationSpacingRegexMatch('padding-left')).toContain('padding-left');
        expect(declarationSpacingRegexMatch('padding-right')).toContain('padding-right');
        expect(declarationSpacingRegexMatch('padding-bottom')).toContain('padding-bottom');
        expect(declarationSpacingRegexMatch('padding-right')).toContain('padding-right');
    });

    it('should identify margin, margin-right', () => {
        expect(declarationSpacingRegexMatch('margin')).toContain('margin');
        expect(declarationSpacingRegexMatch('margin-left')).toContain('margin-left');
        expect(declarationSpacingRegexMatch('margin-right')).toContain('margin-right');
        expect(declarationSpacingRegexMatch('margin-bottom')).toContain('margin-bottom');
        expect(declarationSpacingRegexMatch('margin-right')).toContain('margin-right');
    });

    it('should identify gap', () => {
        expect(declarationSpacingRegexMatch('gap')).toContain('gap');
        expect(declarationSpacingRegexMatch('row-gap')).toContain('row-gap');
        expect(declarationSpacingRegexMatch('column-gap')).toContain('column-gap');
    })
})


describe('colorSyntaxRegex', () => {

  const colorSyntaxRegExMatch = regexTest(colorSyntaxRegex);

  const backgroundColorTests = [
    {value: 'background-color: #fff;', expected: ['#fff'], exclusions: []},
    {value: 'background-color: #fff;', expected: ['#fff'], exclusions: []},
    {value: 'background-color: #ff00ffaa;', expected: ['#ff00ffaa'], exclusions: []},
    {value: 'background-color: rgba(0, 1, 16, 0.25);', expected: ['rgba(0, 1, 16, 0.25)'], exclusions: []},
    {value: 'background-color: rgb(0, 0, 255);', expected: ['rgb(0, 0, 255)'], exclusions: []},
    {value: 'background-color: hsl(30deg 82% 43%)', expected: ['hsl(30deg 82% 43%)'], exclusions: []},
    {value: 'background-color: hsla(237deg 74% 33% / 61%);', expected: ['hsla(237deg 74% 33% / 61%)'], exclusions: []},
    {value: 'background-color: hwb(152deg 0% / 70%);', expected: ['hwb(152deg 0% / 70%)'], exclusions: []},
    {value: 'background-color: green;', expected: ['green'], exclusions: []},
    ];

    const strokeTests = [
        {value: 'stroke: rgb(153 51 102 / 1);', expected: ['rgb(153 51 102 / 1)'], exclusions: []},
        {value: 'stroke: context-stroke', expected: [], exclusions: ['content-stroke']},
        {value: 'stroke: color-mix(in lch, #f0f 35%, gray 15%));', expected: ['#f0f'], exclusions: ['lch', 'in']},
    ];

    const fillTests = [
        {value: `fill: url(#gradientElementId) blue;`, expected: ['blue'], exclusions: []},
        {value: `fill: url(star.png) none;`, expected: [],  exclusions: ['none']}, // avoid none
        {value: `fill: red;`, expected: ['red'], exclusions: []},
        {value: `fill: hsl(120deg 75% 25% / 60%);`, expected: ['hsl(120deg 75% 25% / 60%)'], exclusions: []},
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

                const exclusionsList = testItem.exclusions;

                const testedValue = colorSyntaxRegExMatch(testItem.value);

                expList.forEach((exp) => {
                    
                    expect(testedValue).toContain(exp);
                });

                exclusionsList.forEach((exclusion) => {
                    expect(testedValue).not.toContain(exclusion);
                })

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