/**
 * Returns an object with information around parent at rule.
 * @param {{parent: {parent: {type: string}}}} parent
 * @returns {{parentAtRule: string, params: string}}
 */
export const getParentAtRule = (parent) => {

    if (parent.parent.type !== 'atrule') {
        return {
            parentAtRule: null,
            params: null
        }
    }
    
    return {
        parentAtRule: parent.parent.name,
        params: parent.parent.params,
    };
};
