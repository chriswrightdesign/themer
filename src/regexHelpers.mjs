/*
 * Searches declaration for properties which a color value will likely occur.
 */
export const declarationColorRegex = /^(fill$|stroke$|color)/;

export const declarationBackgroundRegex = /^(background-color|background$)/;

export const declarationBackgroundImageRegex = /^(background-image$)/;

export const declarationBorderRegex = /^(border$|border-color|border-\w+-color|border-(bottom$|top$|left$|right$))/;

export const declarationBoxShadowRegex = /^(box-shadow$)/;
/**
 * Searches declaration for properties which 'spacing' is likely to occur.
 */
export const declarationSpacingRegex = /^(padding(-\w+)?|margin(-\w+)?|gap|row-gap|column-gap|flex-gap|grid-gap)/;

/**
 * Searches declaration for properties which font related properties will likely occur.
 */

export const declarationLineHeightRegex = /^(line-height)/;

export const declarationFontFamilyRegex = /^(font-family)/;

export const declarationFontSizeRegex = /^(font-size)/;

/**
 * Searches declaration for any border-radius syntax.
 */
export const declarationRadiusRegex = /^(border-radius|border-\w+-\w+-radius)/;

/**
 * Find all color syntaxes, useful in border-color/border/box-shadow
 */
export const colorSyntaxRegex = /(rgb|rgba|hsl|hsla|hwb|oklab|lch|light-dark)\([^\)]*\)|(#[0-9A-Fa-f]{3,8})|black|silver|gray|whitesmoke|maroon|red|purple|fuchsia|green|lime|olivedrab|yellow|navy|blue|teal|aquamarine|orange|aliceblue|antiquewhite|aqua|azure|beige|bisque|blanchedalmond|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|gainsboro|ghostwhite|goldenrod|gold|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavenderblush|lavender|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|limegreen|linen|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|oldlace|olive|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|thistle|tomato|turquoise|violet|wheat|white|yellowgreen|rebeccapurple/gi;
