"use strict";
const vscode = require("vscode");
const configuration_1 = require("./configuration");
function makePrettyDecoration_fontSize_hack(prettySubst) {
    const showAttachmentStyling = '';
    let styling = {
        after: {},
        dark: { after: {} },
        light: { after: {} },
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    if (prettySubst.style) {
        configuration_1.assignStyleProperties(styling.after, prettySubst.style);
        if (prettySubst.style.dark)
            configuration_1.assignStyleProperties(styling.dark.after, prettySubst.style.dark);
        if (prettySubst.style.light)
            configuration_1.assignStyleProperties(styling.light.after, prettySubst.style.light);
    }
    styling.after.contentText = prettySubst.pretty;
    // Use a dirty hack to change the font size (code injection)
    styling.after.textDecoration = (styling.after.textDecoration || 'none') + showAttachmentStyling;
    // and make sure the user's textDecoration does not break our hack
    if (styling.light.after.textDecoration)
        styling.light.after.textDecoration = styling.light.after.textDecoration + showAttachmentStyling;
    if (styling.dark.after.textDecoration)
        styling.dark.after.textDecoration = styling.dark.after.textDecoration + showAttachmentStyling;
    return vscode.window.createTextEditorDecorationType(styling);
}
exports.makePrettyDecoration_fontSize_hack = makePrettyDecoration_fontSize_hack;
function makePrettyDecoration_letterSpacing_hack(prettySubst) {
    // const showAttachmentStyling = '; font-size: 10em; letter-spacing: normal; visibility: visible';
    const showAttachmentStyling = '; letter-spacing: normal; visibility: visible';
    let styling = {
        after: {},
        dark: { after: {} },
        light: { after: {} },
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    if (prettySubst.style) {
        configuration_1.assignStyleProperties(styling.after, prettySubst.style);
        if (prettySubst.style.dark)
            configuration_1.assignStyleProperties(styling.dark.after, prettySubst.style.dark);
        if (prettySubst.style.light)
            configuration_1.assignStyleProperties(styling.light.after, prettySubst.style.light);
    }
    styling.after.contentText = prettySubst.pretty;
    // Use a dirty hack to change the font size (code injection)
    styling.after.textDecoration = (styling.after.textDecoration || 'none') + showAttachmentStyling;
    // and make sure the user's textDecoration does not break our hack
    if (styling.light.after.textDecoration)
        styling.light.after.textDecoration = styling.light.after.textDecoration + showAttachmentStyling;
    if (styling.dark.after.textDecoration)
        styling.dark.after.textDecoration = styling.dark.after.textDecoration + showAttachmentStyling;
    return vscode.window.createTextEditorDecorationType(styling);
}
exports.makePrettyDecoration_letterSpacing_hack = makePrettyDecoration_letterSpacing_hack;
function makePrettyDecoration_noPretty(prettySubst) {
    const showAttachmentStyling = '';
    let styling = {
        dark: {},
        light: {},
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    if (prettySubst.style) {
        configuration_1.assignStyleProperties(styling, prettySubst.style);
        if (prettySubst.style.dark)
            configuration_1.assignStyleProperties(styling.dark, prettySubst.style.dark);
        if (prettySubst.style.light)
            configuration_1.assignStyleProperties(styling.light, prettySubst.style.light);
    }
    return vscode.window.createTextEditorDecorationType(styling);
}
exports.makePrettyDecoration_noPretty = makePrettyDecoration_noPretty;
function makePrettyDecoration_noHide(prettySubst) {
    const showAttachmentStyling = '';
    let styling = {
        after: {},
        dark: { after: {} },
        light: { after: {} },
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    if (prettySubst.style) {
        configuration_1.assignStyleProperties(styling.after, prettySubst.style);
        if (prettySubst.style.dark)
            configuration_1.assignStyleProperties(styling.dark.after, prettySubst.style.dark);
        if (prettySubst.style.light)
            configuration_1.assignStyleProperties(styling.light.after, prettySubst.style.light);
    }
    styling.after.contentText = prettySubst.pretty;
    // Use a dirty hack to change the font size (code injection)
    styling.after.textDecoration = (styling.after.textDecoration || 'none') + showAttachmentStyling;
    // and make sure the user's textDecoration does not break our hack
    if (styling.light.after.textDecoration)
        styling.light.after.textDecoration = styling.light.after.textDecoration + showAttachmentStyling;
    if (styling.dark.after.textDecoration)
        styling.dark.after.textDecoration = styling.dark.after.textDecoration + showAttachmentStyling;
    return vscode.window.createTextEditorDecorationType(styling);
}
exports.makePrettyDecoration_noHide = makePrettyDecoration_noHide;
function makeDecorations_fontSize_hack() {
    return {
        uglyDecoration: vscode.window.createTextEditorDecorationType({
            textDecoration: 'none; font-size: 0.001em',
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }),
        revealedUglyDecoration: vscode.window.createTextEditorDecorationType({
            textDecoration: 'none; font-size: inherit !important',
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            after: {
                textDecoration: 'none; font-size: 0pt',
            }
        }),
        boxedSymbolDecoration: {
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            after: {
                border: '0.1em solid',
                margin: '-0em -0.05em -0em -0.1em',
            }
        },
    };
}
exports.makeDecorations_fontSize_hack = makeDecorations_fontSize_hack;
function makeDecorations_letterSpacing_hack() {
    return {
        uglyDecoration: vscode.window.createTextEditorDecorationType({
            letterSpacing: "-0.55em; font-size: 0.1em; visibility: hidden",
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }),
        revealedUglyDecoration: vscode.window.createTextEditorDecorationType({
            letterSpacing: "normal !important; font-size: inherit !important; visibility: visible !important",
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            after: {
                // letterSpacing: '-0.55em; font-size: 0.1pt; visibility: hidden',
                textDecoration: 'none !important; font-size: 0.1pt !important; visibility: hidden',
            }
        }),
        boxedSymbolDecoration: {
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            after: {
                border: '0.1em solid',
                margin: '-0em -0.05em -0em -0.1em',
            }
        },
    };
}
exports.makeDecorations_letterSpacing_hack = makeDecorations_letterSpacing_hack;
function makeDecorations_none() {
    return {
        uglyDecoration: vscode.window.createTextEditorDecorationType({
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        }),
        revealedUglyDecoration: vscode.window.createTextEditorDecorationType({
            textDecoration: 'none; font-size: inherit !important',
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            after: {
                textDecoration: 'none; font-size: 0pt',
            }
        }),
        boxedSymbolDecoration: {
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            after: {
                border: '0.1em solid',
                margin: '-0em -0.05em -0em -0.1em',
            }
        },
    };
}
exports.makeDecorations_none = makeDecorations_none;
//# sourceMappingURL=decorations.js.map