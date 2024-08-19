/*
 * Searches declaration for properties which a color value will likely occur.
 */
export const declarationColorRegex = /^(border$|box-shadow|border-color|fill|stroke|color|background-color|background$)/;

/**
 * Searches declaration for properties which 'spacing' is likely to occur.
 */
export const declarationSpacingRegex = /^(padding-?|margin-?)/;

/**
 * Searches declaration for properties which font related properties will likely occur.
 */

export const declarationFontRegex = /^(font-?|line-height)/;