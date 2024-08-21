import {describe, expect, test} from '@jest/globals';
import {makeCommentsSafe, parseSelector, getParsedPropName, createCustomPropertyName, createCustomPropertyObject, getPropertysByMediaQueryParams, getMediaQueries, generateCustomProperties, constructRootPseudo} from './utils.mjs';

describe('makeCommentsSafe', () => {
    it('should take // comment and replace with /* comment */', () => {
        const cssLine = `
        .selector {
            margin: 0; // [1] this is useful.
        }`;

        expect(makeCommentsSafe(cssLine)).not.toContain('//');
    });
});

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


describe('getParsedPropName', () => {
    it('should handle the border prop and produce border-color', () => {
        getParsedPropName('border');
    });

    it('should return background for background', () => {
        getParsedPropName('background');
    })
});

describe ('createCustomPropertyName', () => {

    it('should handle a parent selector', () => {

        const inputObject = {
            prefix: 'themer',
            selector: '.c-box',
            prop: 'border-color',
            parent: {
                parent: {
                    selector: '.c-form',
                }
            }
        }

        expect(createCustomPropertyName(inputObject)).toBe('--themer-c-form--c-box-border-color');
    });

    it('should handle no parent selector selector', () => {
        const inputObject = {
            prefix: 'themer',
            selector: '.c-box',
            prop: 'border-color',
            parent: {
                parent: {
                }
            }
        }

        expect(createCustomPropertyName(inputObject)).toBe('--themer-c-box-border-color');
    });
    
});

describe ('createCustomPropertyObject', () => {
    it('should create an object based on the inputs', () => {
        const inputObject = {
            prefix: 'themer', 
            prop: 'background', 
            value: '#f0f;', 
            important: false, 
            parent: {
                parent: {
                    type: null,
                }
            }
        };

        const createdObject = createCustomPropertyObject(inputObject);

        expect(createdObject).toHaveProperty('name');
        expect(createdObject).toHaveProperty('value');
        expect(createdObject).toHaveProperty('originalValue');
    });

    it('should parse the border value', () => {
        const inputObject = {
            prefix: 'themer', 
            prop: 'border', 
            value: '1px solid #f0f', 
            important: false, 
            parent: {
                parent: {
                    type: null,
                }
            }
        };

        const createdObject = createCustomPropertyObject(inputObject);

        expect(createdObject.value).toEqual('#f0f');

    })
});

describe('getPropertysByMediaQueryParams', () => {
    it('should return any custom props from the list that match the params given', () => {
        expect(getPropertysByMediaQueryParams([{params: '(min-width: 360px)'}], `(min-width: 360px)`)[0].params).toBe('(min-width: 360px)');
    });
});

describe('getMediaQueries', () => {

});

describe('generateCustomProperties', () => {

});

describe('constructRootPseudo', () => {

});