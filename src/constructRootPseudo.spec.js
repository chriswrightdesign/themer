import {describe, expect, test} from '@jest/globals';
import { getPropertysByMediaQueryParams, getMediaQueries, generateCustomProperties, constructRootPseudo } from './constructRootPseudo.mjs';

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