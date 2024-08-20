import path from 'path';
import fs from 'fs';

export const generateStatsObject = (itemList) => {
    const statsObject = itemList.reduce((stats, curr) => {

        const itemKey = curr.value;
        // for every colour that you find, add it to the list
        if (!stats[itemKey]) {
            return {
                ...stats,
                [itemKey]: 1,
            }
        }

        if (stats[itemKey]) {
            return {
                ...stats,
                [itemKey]: stats[itemKey] + 1,
            }
        }
        return stats;

    }, {});

    return statsObject;
}

export const getColorsByCategory = ({categoryName, colorList, exact = false}) => {
    const categoryColors = colorList.filter((color) => {
        return exact ? color.category === categoryName : color.category.includes(categoryName);
    });

    return categoryColors;
}

export const arrayToCSVFormat = ({data, dataArr, headings}) => {
    return dataArr.reduce((acc, value) => {
        return acc += `"${value}", ${data[value]}\n`
    }, `${headings} \n`);
}

export const convertStatsObjectToSortedArray = (data) => {
    return Object.keys(data).sort((a, b) => {
        if (data[a] > data[b]) {
            return -1;
        }
        if (data[a] < data[b]) {
            return 1;
        }
        return 0;
    });
}

export const writeCSV = ({data, outputFile, outputDir, headings = 'Color, Occurrence'}) => {

    const output = path.resolve(outputDir, outputFile);

    const sortedData = convertStatsObjectToSortedArray(data);

    const dataOutput = arrayToCSVFormat({dataArr: sortedData, headings, data});

    fs.writeFileSync(output, dataOutput, 'utf8');

    console.log(`CSV written: ${outputFile}`);
}
