import {
    orange500, orange800,
    pinkA200,
    grey100, grey300, grey400, grey500,
    white, darkBlack, fullBlack,
} from 'material-ui/styles/colors';

import {fade} from 'material-ui/utils/colorManipulator';

export default {
    fontFamily: 'Roboto, sans-serif',
    palette: {
        primary1Color: orange500,
        primary2Color: orange800,
        primary3Color: grey400,
        accent1Color: pinkA200,
        accent2Color: grey100,
        accent3Color: grey500,
        textColor: darkBlack,
        softTextColor: fade(darkBlack, 0.5),
        alternateTextColor: white,
        canvasColor: white,
        borderColor: grey300,
        disabledColor: fade(darkBlack, 0.3),
        pickerHeaderColor: orange500,
        clockCircleColor: fade(darkBlack, 0.07),
        shadowColor: fullBlack,
        headerBlack: '#333'
    },
};