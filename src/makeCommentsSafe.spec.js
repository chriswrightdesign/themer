import {describe, expect, test} from '@jest/globals';
import {makeCommentsSafe} from './makeCommentsSafe.mjs';

describe('makeCommentsSafe', () => {
    it('should take // comment and replace with /* comment */', () => {
        const cssLine = `
        .selector {
            margin: 0; // [1] this is useful.
        }`;

        expect(makeCommentsSafe(cssLine)).not.toContain('//');
    });
});