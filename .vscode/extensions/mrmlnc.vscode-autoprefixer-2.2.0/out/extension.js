'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const vscode = require("vscode");
const postcss = require("postcss");
const resolver = require("npm-module-path");
const micromatch = require("micromatch");
let output;
let autoprefixerConfiguration;
let autoprefixerModule = null;
/**
 * Update Autoprefixer module.
 *
 * @param {IConfiguration} config
 */
function requireCore(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!config.findExternalAutoprefixer) {
            autoprefixerModule = require('autoprefixer');
            return;
        }
        try {
            const modulePath = yield resolver.resolveOne('autoprefixer', vscode.workspace.rootPath || '');
            autoprefixerModule = require(modulePath);
        }
        catch (err) {
            throw [
                'Failed to load autoprefixer library.',
                'Please install autoprefixer in your workspace folder using **npm install autoprefixer**',
                'or globally using **npm install -g autoprefixer** and then run command again.'
            ].join(' ');
        }
    });
}
/**
 * Get PostCSS options.
 *
 * @param {string} language
 * @returns {*}
 */
function getPostcssOptions(language) {
    switch (language) {
        case 'less':
            return {
                syntax: require('postcss-less')
            };
        case 'scss':
            return {
                syntax: require('postcss-scss')
            };
        case 'css':
            return {
                parser: require('postcss-safe-parser')
            };
        default:
            return null;
    }
}
/**
 * Check syntax support.
 *
 * @param {any} ext
 * @returns {boolean}
 */
function isSupportedSyntax(document) {
    return /(css|postcss|less|scss)/.test(document.languageId);
}
/**
 * transform warning message.
 *
 * @param {postcss.ResultMessage} warn
 * @returns {string}
 */
function transformWarningMessage(warn) {
    return warn.toString().replace(/autoprefixer:\s<.*?>:(.*)?:\s(.*)/, '[$1] $2');
}
/**
 * Show message in iutput channel.
 *
 * @param {string} msg
 */
function showOutput(msg) {
    if (!output) {
        output = vscode.window.createOutputChannel('Autoprefixer');
    }
    output.clear();
    output.appendLine('[Autoprefixer]\n');
    output.append(msg);
    output.show();
}
/**
 * Use Autoprefixer module.
 *
 * @param {vscode.TextDocument} document
 * @param {vscode.Selection} selection
 * @returns {Promise<IResult>}
 */
function useAutoprefixer(document, selection) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!isSupportedSyntax(document)) {
            console.error('Cannot execute Autoprefixer because there is not style files. Supported: LESS, SCSS, PostCSS and CSS.');
            return null;
        }
        yield requireCore(autoprefixerConfiguration);
        const processOptions = getPostcssOptions(document.languageId);
        const autoprefixerOptions = {
            browsers: autoprefixerConfiguration.browsers,
            grid: autoprefixerConfiguration.grid === 'off' ? false : autoprefixerConfiguration.grid
        };
        let range;
        let text;
        if (!selection || (selection && selection.isEmpty)) {
            const lastLine = document.lineAt(document.lineCount - 1);
            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);
            range = new vscode.Range(start, end);
            text = document.getText();
        }
        else {
            range = new vscode.Range(selection.start, selection.end);
            text = document.getText(range);
        }
        return postcss([autoprefixerModule(autoprefixerOptions)])
            .process(text, processOptions)
            .then((result) => {
            let warnings = '';
            result.warnings().forEach((warn) => {
                warnings += '\t' + transformWarningMessage(warn) + '\n';
            });
            if (warnings) {
                showOutput('Warnings\n' + warnings);
            }
            return {
                css: result.css,
                warnings: Boolean(warnings),
                range
            };
        });
    });
}
function activate(context) {
    autoprefixerConfiguration = vscode.workspace.getConfiguration().get('autoprefixer');
    const command = vscode.commands.registerTextEditorCommand('autoprefixer.execute', (textEditor) => {
        useAutoprefixer(textEditor.document, textEditor.selection).then((result) => {
            // If we have warnings then don't update Editor
            if (result.warnings) {
                return;
            }
            textEditor.edit((editBuilder) => {
                editBuilder.replace(result.range, result.css);
            });
        }).catch((err) => {
            showOutput(err.toString());
        });
    });
    const onSave = vscode.workspace.onWillSaveTextDocument((event) => {
        // Skip the formatting code without Editor configuration or if file not supported
        if (!autoprefixerConfiguration || !autoprefixerConfiguration.formatOnSave || !isSupportedSyntax(event.document)) {
            return;
        }
        const edit = useAutoprefixer(event.document, null).then((result) => {
            // If we have warnings then don't update Editor
            if (result.warnings) {
                return null;
            }
            if (autoprefixerConfiguration.ignoreFilesOnSave.length !== 0) {
                const currentFile = path.relative(vscode.workspace.rootPath, event.document.fileName);
                if (micromatch([currentFile], autoprefixerConfiguration.ignoreFilesOnSave).length !== 0) {
                    return null;
                }
            }
            return vscode.TextEdit.replace(result.range, result.css);
        }).catch((err) => {
            showOutput(err.toString());
        });
        event.waitUntil(Promise.all([edit]));
    });
    const configurationWatcher = vscode.workspace.onDidChangeConfiguration(() => {
        autoprefixerConfiguration = vscode.workspace.getConfiguration().get('autoprefixer');
    });
    // Subscriptions
    context.subscriptions.push(command);
    context.subscriptions.push(onSave);
    context.subscriptions.push(configurationWatcher);
}
exports.activate = activate;
