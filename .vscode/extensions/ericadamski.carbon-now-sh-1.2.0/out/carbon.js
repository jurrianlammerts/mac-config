"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const opn_url_1 = require("opn-url");
const url_1 = require("url");
function getLanguage(languageId) {
    const languageMap = new Map([
        ["c", "text/x-csrc"],
        ["csharp", "text/x-csharp"],
        ["cpp", "text/x-c++src"],
        ["diff", "text/x-diff"],
        ["fsharp", "mllike"],
        ["html", "htmlmixed"],
        ["java", "text/x-java"],
        ["javascriptreact", "jsx"],
        ["json", "application/json"],
        ["objective-c", "text/x-objectivec"],
        ["php", "text/x-php"],
        ["plaintext", "text"],
        ["shellscript", "application/x-sh"]
    ]);
    if (languageMap.has(languageId)) {
        return languageMap.get(languageId);
    }
    else {
        return "auto";
    }
}
function activate(context) {
    const disposable = vscode_1.commands.registerCommand("carbon.show", () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor)
            return vscode_1.window.showErrorMessage("😱 Feed me code!");
        const { languageId, lineAt, getText } = editor.document;
        const settings = vscode_1.workspace.getConfiguration("carbon");
        const language = getLanguage(languageId);
        const { start, end, active } = editor.selection;
        const selection = (start.isEqual(end)
            ? lineAt(active.line).text
            : getText(new vscode_1.Range(start, end))).trim();
        const maxCharacterLength = 1000;
        if (selection.length > maxCharacterLength)
            return vscode_1.window.showErrorMessage(`Selected code is longer than ${maxCharacterLength} characters, refusing to send to carbon.`);
        const url = new url_1.URL(settings.get("url"));
        if (settings.get("useBrowserCache")) {
            url.searchParams.set("code", encodeURIComponent(selection));
            opn_url_1.open(url.toString(), err => err &&
                (() => {
                    vscode_1.window.showErrorMessage(`There was an issue sending code to carbon. Please try again.`);
                    console.error(`
              URL: ${url}
              Code: ${selection}
              Error: ${err}
            `);
                })());
            context.subscriptions.push(disposable);
            return;
        }
        url.searchParams.set("bg", settings.get("backgroundColor"));
        url.searchParams.set("t", settings.get("theme"));
        url.searchParams.set("wt", settings.get("windowTheme"));
        url.searchParams.set("l", language);
        url.searchParams.set("ds", settings.get("dropShadow"));
        url.searchParams.set("dsyoff", `${settings.get("dropShadowOffset")}px`);
        url.searchParams.set("dsblur", `${settings.get("dropShadowBlurRadius")}px`);
        url.searchParams.set("wc", settings.get("windowControls"));
        url.searchParams.set("wa", settings.get("autoAdjustWidth"));
        url.searchParams.set("pv", `${settings.get("paddingVertical")}px`);
        url.searchParams.set("ph", `${settings.get("paddingHorizontal")}px`);
        url.searchParams.set("ln", settings.get("lineNumbers"));
        url.searchParams.set("f", settings.get("fontFamily"));
        url.searchParams.set("fs", `${settings.get("fontSize")}px`);
        url.searchParams.set("lh", `${settings.get("lineHeight")}%`);
        url.searchParams.set("wm", settings.get("showWatermark"));
        url.searchParams.set("code", encodeURIComponent(selection));
        opn_url_1.open(url.toString(), err => err &&
            (() => {
                vscode_1.window.showErrorMessage(`There was an issue sending code to carbon. Please try again.`);
                console.error(`
            URL: ${url}
            Code: ${selection}
            Error: ${err}
          `);
            })());
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=carbon.js.map