import {describe, expect, test} from '@jest/globals';
import {makeCommentsSafe, parseSelector, getParsedPropName, createCustomPropertyName, createCustomPropertyObject, getPropertysByMediaQueryParams, getMediaQueries, generateCustomProperties, constructRootPseudo, generatePropertyValue} from './utils.mjs';

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

describe('generatePropertyValue', () => {
    it('should create the value for a property', () => {
        const props = {name: '--box-background', prop: 'background', originalValue: '#fff'};

        expect(generatePropertyValue(props)).toEqual(`var(--box-background)`);
    });

    it('should handle the value of a border shorthand', () => {

        const props = {name: '--box-border', prop: 'border', originalValue: '1px solid #fff'};

        expect(generatePropertyValue(props)).toEqual(`1px solid var(--box-border)`);

    })
});

describe('getMediaQueries', () => {

    it('should get properties with media queries', () => {

        const customPropertyList = [
            {name: '--themer-box-background', value: '#fff' , originalValue: '#fff', propertyType: 'background', originalSelector: '.box', important: false, parentAtRule: 'media', params: '(min-width: 360px)'},
            {name: '--themer-box-color', value: '#fff' , originalValue: '#fff', propertyType: 'color', originalSelector: '.box', important: false, parentAtRule: 'media', params: '(max-width: 300px)'},
            {name: '--themer-box-padding', value: '0px' , originalValue: '0px', propertyType: 'padding', originalSelector: '.box', important: false, parentAtRule: null, params: null}
        ];

    expect(getMediaQueries(customPropertyList).length).toEqual(2);

    });
    
        
});

describe('generateCustomProperties', () => {
    it('should generate a string with custom properties', () => {
        const customPropertyList = [
            {name: '--themer-box-background', value: '#fff' , originalValue: '#fff', propertyType: 'background', originalSelector: '.box', important: false, parentAtRule: 'media', params: '(min-width: 360px)'},
            {name: '--themer-box-color', value: '#fff' , originalValue: '#fff', propertyType: 'color', originalSelector: '.box', important: false, parentAtRule: 'media', params: '(max-width: 300px)'},
            {name: '--themer-box-padding', value: '0px' , originalValue: '0px', propertyType: 'padding', originalSelector: '.box', important: false, parentAtRule: null, params: null}
        ];

        const generatedPropertyString = generateCustomProperties(customPropertyList);
        expect(generatedPropertyString).toContain('--themer-box-background: #fff;');
        expect(generatedPropertyString).toContain('--themer-box-color: #fff;');
        expect(generatedPropertyString).toContain('--themer-box-padding: 0px;');
    });
});

describe('constructRootPseudo', () => {
    const customPropertyList = [
        {name: '--themer-box-background', value: '#fff' , originalValue: '#fff', propertyType: 'background', originalSelector: '.box', important: false, parentAtRule: 'media', params: '(min-width: 360px)'},
        {name: '--themer-box-color', value: '#fff' , originalValue: '#fff', propertyType: 'color', originalSelector: '.box', important: false, parentAtRule: 'media', params: '(max-width: 300px)'},
        {name: '--themer-box-padding', value: '0px' , originalValue: '0px', propertyType: 'padding', originalSelector: '.box', important: false, parentAtRule: null, params: null}
    ];

    it('should generate a string with a :root{} and custom properties', () => {
        const constructedRoot = constructRootPseudo(customPropertyList);

        expect(constructedRoot).toContain(':root {');
        expect(constructedRoot).toContain('--themer-box-background: #fff;');
        expect(constructedRoot).toContain('--themer-box-color: #fff;');
        expect(constructedRoot).toContain('--themer-box-padding: 0px;');
    });
});
