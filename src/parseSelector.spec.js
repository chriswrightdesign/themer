import {describe, expect, test} from '@jest/globals';
import {parseSelector} from './parseSelector.mjs';

describe('parseSelector', () => {

    const standardSelectorList = [
        {value: '.box h1', expectation: '-box-h1'},
        {value: '.box.heading', expectation: '-box-heading'},
        {value: '.box heading', expectation: '-box-heading'},
        {value: `input[type="text"]`, expectation: 'input-type-text'},
        {value: '.person:focus', expectation: '-person-focus'},
        {value: '.person:focus-within', expectation: '-person-focus-within'},
        {value: '.person#hand', expectation: '-person#hand'},
        {value: '#person #hand', expectation: '#person-#hand'},
        {value: '.tooltip::active', expectation: '-tooltip-active'},
        {value: '.tooltip, .someotherthing, .yep:focus', expectation: '-tooltip'}
    ];

    const bemSelectorList = [
        {value: '.c-box .c-box__heading', expectation: '-c-box-c-box-heading'},
        {value: '.c-box.c-box--dark', expectation: '-c-box-c-box-dark'}
    ];

    const allSelectors = [
        ...standardSelectorList, 
        ...bemSelectorList
    ];

    allSelectors.forEach((selector) => {
        it(`should parse ${selector.value}`, () => {
            expect(parseSelector(selector.value)).toBe(selector.expectation);
        });
    })
   
});