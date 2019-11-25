'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const openurl_1 = require("openurl");
function activate(context) {
    const disposable = vscode_1.commands.registerCommand('carbon.show', () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor)
            return vscode_1.window.showErrorMessage('😱 Feed me code!');
        const { getText, languageId } = editor.document;
        const url = `https://carbon.now.sh/?bg=rgba(0,0,0,0)&t=dracula&l=${languageId}&ds=true&wc=true&wa=true&pv=43px&ph=57px&ln=false&code=${encodeURI(getText())}`;
        openurl_1.open(url);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map