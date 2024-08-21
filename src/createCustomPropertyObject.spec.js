import {describe, expect, test} from '@jest/globals';
import {getParsedPropName, createCustomPropertyName, createCustomPropertyObject} from './createCustomPropertyObject.mjs';

describe('getParsedPropName', () => {
    it('should handle the border prop and produce border-color', () => {
        getParsedPropName('border');
    });

    it('should return background for background', () => {
        getParsedPropName('background');
    })
});

// describe ('createCustomPropertyName', () => {

// });

// describe ('createCustomPropertyObject', () => {

// });