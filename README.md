# Themer
A project to help extract CSS property values into custom properties.
Also comes with reporting tools to help understand the occurrences of property values.

## Themer usage
`npx @chriswrightdesign/themer -i inputfile.css`

This will output a file named `inputfile.processed.css` that will have the custom properties.

## Reporter usage
`npx -p @chriswrightdesign/themer reporter -i inputfile.css -o /data`

This will then output multiple csv files to `/data`

*These include:*
- Color
- Border colors
- Text colors
- Shadow colors
- Spacing values (margin, padding, gap);
- Border radii
- Font sizes

## Limitations
- In order to create valid custom property names - this attempts to grab any word character and piece them together with hyphens. 
- The * in CSS is treated differently here and is replaced with `_all_`.
- A sizeable CSS file will give you a LOT of custom properties.
