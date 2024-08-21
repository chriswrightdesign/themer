/**
 * Replace any // with * * becase postcss hates it
 * @param cssFile {string} 
 * @returns {string}
 */
export const makeCommentsSafe = (cssFile) => {
    return cssFile.toString().replace(/(\/\/).(.+)/gi, `/* $2 */`);
}