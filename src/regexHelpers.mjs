/*
 * Searches declaration for properties which a color value will likely occur.
 */
export const declarationColorRegex = /^(border$|box-shadow|border-color|border-\w+-color|fill|stroke|color|background-color|background$)/;

/**
 * Searches declaration for properties which 'spacing' is likely to occur.
 */
export const declarationSpacingRegex = /^(padding-?|margin-?)/;

/**
 * Searches declaration for properties which font related properties will likely occur.
 */

export const declarationFontRegex = /^(font-?|line-height)/;

/**
 * Find all color syntaxes, useful in border-color/border/box-shadow
 */
export const colorSyntaxRegex = /\w+(-)?\w+\(.+\)|#\w+|(\w+);/;

// neg lookahead ^(?!ignoreme|ignoreme2)([a-zA-Z]+)$