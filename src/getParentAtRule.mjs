/**
 * Returns an object with information around parent at rule.
 * If none are specificied returns 'none' as parentAtRule
 * If one is present, also returns params
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
