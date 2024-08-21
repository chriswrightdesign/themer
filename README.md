# themer
A project to help extract CSS property values into custom properties.
Also comes with reporting tools to help understand the occurrences of property values.

## Themer usage
`node themer.mjs -i inputfile.css`

This will output a file named `inputfile.processed.css` that will have the custom properties.

## Reporter usage
`node reporter.mjs -i inputfile.css -o /data`

This will then output multiple csv files to `/data`

These include:
- Color
- Border colors
- Text colors
- Shadow colors
- Spacing values (margin, padding, gap);
- Border radii
- Font sizes