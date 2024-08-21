export const parseSelector = (selector) => {

    /**
     * Handle comma separated selectors, e.g. .something, somethingelse, somethingelse {} take the first one
     */
    const [firstSelector] = selector.split(',');

    const selectorBrackets = firstSelector.replace(/\[(?<attribute>\w+)=("?)(?<contents>\w+)("?)\]/, `-$<attribute>-$<contents>`);
    /*
     *  Handle parent selectors e.g. .box h1 make box-h1, handle .box .boxchild as box-boxchild
     */
    const selectorWithNoSpaces = selectorBrackets.replace(/\s/ig, '-').replace(/\./ig, '-');

    


    /**
     * Handle pseudo selectors, pseudo classes, BEM __, --, and any remaining .
     * We leave # so there is no confusion around . and # selection
     */
    return `${selectorWithNoSpaces}`.replace(/::|:|__|--/gi, '-');
};
