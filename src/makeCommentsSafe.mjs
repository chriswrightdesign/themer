// Replace any // with /* */ becase postcss hates it
export const makeCommentsSafe = (cssFile) => {
    return cssFile.toString().replace(/(\/\/).(.+)/gi, `/* $2 */`);
}