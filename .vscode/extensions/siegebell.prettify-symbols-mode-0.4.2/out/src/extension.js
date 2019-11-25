"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const document_1 = require("./document");
const tm = require("./text-mate");
/** globally enable or disable all substitutions */
let prettySymbolsEnabled = true;
/** Tracks all documents that substitutions are being applied to */
let documents = new Map();
/** The current configuration */
let settings;
const onEnabledChangeHandlers = new Set();
exports.additionalSubstitutions = new Set();
function getLanguageScopeName(languageId) {
    try {
        const languages = vscode.extensions.all
            .filter(x => x.packageJSON && x.packageJSON.contributes && x.packageJSON.contributes.grammars)
            .reduce((a, b) => [...a, ...b.packageJSON.contributes.grammars], []);
        const matchingLanguages = languages.filter(g => g.language === languageId);
        if (matchingLanguages.length > 0) {
            console.info(`Mapping language ${languageId} to initial scope ${matchingLanguages[0].scopeName}`);
            return matchingLanguages[0].scopeName;
        }
    }
    catch (err) { }
    console.info(`Cannot find a mapping for language ${languageId}; assigning default scope source.${languageId}`);
    return 'source.' + languageId;
}
const grammarLocator = {
    getFilePath: function (scopeName) {
        try {
            const grammars = vscode.extensions.all
                .filter(x => x.packageJSON && x.packageJSON.contributes && x.packageJSON.contributes.grammars)
                .reduce((a, b) => [...a, ...b.packageJSON.contributes.grammars.map(x => Object.assign({ extensionPath: b.extensionPath }, x))], []);
            const matchingLanguages = grammars.filter(g => g.scopeName === scopeName);
            if (matchingLanguages.length > 0) {
                const ext = matchingLanguages[0];
                const file = path.join(ext.extensionPath, ext.path);
                console.info(`Found grammar for ${scopeName} at ${file}`);
                return file;
            }
        }
        catch (err) { }
        return undefined;
    }
};
/** initialize everything; main entry point */
function activate(context) {
    function registerTextEditorCommand(commandId, run) {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand(commandId, run));
    }
    function registerCommand(commandId, run) {
        context.subscriptions.push(vscode.commands.registerCommand(commandId, run));
    }
    registerTextEditorCommand('prettifySymbolsMode.copyWithSubstitutions', copyWithSubstitutions);
    registerCommand('prettifySymbolsMode.disablePrettySymbols', disablePrettySymbols);
    registerCommand('prettifySymbolsMode.enablePrettySymbols', enablePrettySymbols);
    registerCommand('prettifySymbolsMode.togglePrettySymbols', (editor) => {
        if (prettySymbolsEnabled) {
            disablePrettySymbols();
        }
        else {
            enablePrettySymbols();
        }
    });
    registerCommand('extension.disablePrettySymbols', () => { vscode.window.showErrorMessage('Command "extension.disablePrettySymbols" is deprecated; use "prettifySymbolsMode.disablePrettySymbols" instead.'); });
    registerCommand('extension.enablePrettySymbols', () => { vscode.window.showErrorMessage('Command "extension.enablePrettySymbols" is deprecated; use "prettifySymbolsMode.enablePrettySymbols" instead.'); });
    registerCommand('extension.togglePrettySymbols', () => { vscode.window.showErrorMessage('Command "extension.togglePrettySymbols" is deprecated; use "prettifySymbolsMode.togglePrettySymbols" instead.'); });
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(selectionChanged));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(openDocument));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(closeDocument));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(onConfigurationChanged));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(changeActiveTextEditor));
    reloadConfiguration();
    const result = {
        onDidEnabledChange: function (handler) {
            onEnabledChangeHandlers.add(handler);
            return {
                dispose() {
                    onEnabledChangeHandlers.delete(handler);
                }
            };
        },
        isEnabled: function () {
            return prettySymbolsEnabled;
        },
        registerSubstitutions: function (substitutions) {
            exports.additionalSubstitutions.add(substitutions);
            // TODO: this could be smart about not unloading & reloading everything 
            reloadConfiguration();
            return {
                dispose() {
                    exports.additionalSubstitutions.delete(substitutions);
                }
            };
        }
    };
    return result;
}
exports.activate = activate;
function copyWithSubstitutions(editor) {
    try {
        if (!editor)
            return;
        const prettyDoc = documents.get(editor.document.uri);
        if (prettyDoc)
            prettyDoc.copyDecorated(editor);
    }
    catch (e) {
    }
}
function changeActiveTextEditor(editor) {
    try {
        if (!editor)
            return;
        const prettyDoc = documents.get(editor.document.uri);
        if (prettyDoc)
            prettyDoc.gotFocus(editor);
    }
    catch (e) {
    }
}
/** A text editor selection changed; forward the event to the relevant document */
function selectionChanged(event) {
    try {
        const prettyDoc = documents.get(event.textEditor.document.uri);
        if (prettyDoc)
            prettyDoc.selectionChanged(event.textEditor);
    }
    catch (e) {
        console.error(e);
    }
}
/** Te user updated their settings.json */
function onConfigurationChanged() {
    reloadConfiguration();
}
/** Re-read the settings and recreate substitutions for all documents */
function reloadConfiguration() {
    try {
        exports.textMateRegistry = new tm.Registry(grammarLocator);
    }
    catch (err) {
        exports.textMateRegistry = undefined;
        console.error(err);
    }
    const configuration = vscode.workspace.getConfiguration("prettifySymbolsMode");
    settings = {
        substitutions: configuration.get("substitutions", []),
        revealOn: configuration.get("revealOn", "cursor"),
        adjustCursorMovement: configuration.get("adjustCursorMovement", false),
        prettyCursor: configuration.get("prettyCursor", "boxed"),
        hideTextMethod: configuration.get("hideTextMethod", "hack-letterSpacing"),
    };
    // Set default values for language-properties that were not specified
    for (const language of settings.substitutions) {
        if (language.revealOn === undefined)
            language.revealOn = settings.revealOn;
        if (language.adjustCursorMovement === undefined)
            language.adjustCursorMovement = settings.adjustCursorMovement;
        if (language.prettyCursor === undefined)
            language.prettyCursor = settings.prettyCursor;
        if (language.combineIdenticalScopes === undefined)
            language.combineIdenticalScopes = false;
    }
    // Recreate the documents
    unloadDocuments();
    for (const doc of vscode.workspace.textDocuments)
        openDocument(doc);
}
function disablePrettySymbols() {
    prettySymbolsEnabled = false;
    onEnabledChangeHandlers.forEach(h => h(false));
    unloadDocuments();
}
function enablePrettySymbols() {
    prettySymbolsEnabled = true;
    onEnabledChangeHandlers.forEach(h => h(true));
    reloadConfiguration();
}
/** Attempts to find the best-matching language entry for the language-id of the given document.
 * @param the document to match
 * @returns the best-matching language entry, or else `undefined` if none was found */
function getLanguageEntry(doc) {
    const rankings = settings.substitutions
        .map((entry) => ({ rank: vscode.languages.match(entry.language, doc), entry: entry }))
        .filter(score => score.rank > 0)
        .sort((x, y) => (x.rank > y.rank) ? -1 : (x.rank == y.rank) ? 0 : 1);
    let entry = rankings.length > 0
        ? Object.assign({}, rankings[0].entry)
        : {
            language: doc.languageId,
            substitutions: [],
            adjustCursorMovement: settings.adjustCursorMovement,
            revealOn: settings.revealOn,
            prettyCursor: settings.prettyCursor,
            combineIdenticalScopes: true,
        };
    for (const language of exports.additionalSubstitutions) {
        if (vscode.languages.match(language.language, doc) > 0) {
            entry.substitutions.push(...language.substitutions);
        }
    }
    return entry;
}
function loadGrammar(scopeName) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                exports.textMateRegistry.loadGrammar(scopeName, (err, grammar) => {
                    if (err)
                        reject(err);
                    else
                        resolve(grammar);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    });
}
function openDocument(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!prettySymbolsEnabled)
            return;
        try {
            const prettyDoc = documents.get(doc.uri);
            if (prettyDoc) {
                prettyDoc.refresh();
            }
            else {
                const language = getLanguageEntry(doc);
                if (language && language.substitutions.length > 0) {
                    const usesScopes = language.substitutions.some(s => s.scope !== undefined);
                    let grammar = undefined;
                    if (exports.textMateRegistry && usesScopes) {
                        try {
                            const scopeName = language.textMateInitialScope || getLanguageScopeName(doc.languageId);
                            grammar = yield loadGrammar(scopeName);
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                    documents.set(doc.uri, new document_1.PrettyDocumentController(doc, language, { hideTextMethod: settings.hideTextMethod, textMateGrammar: grammar }));
                }
            }
        }
        catch (err) { }
    });
}
function closeDocument(doc) {
    const prettyDoc = documents.get(doc.uri);
    if (prettyDoc) {
        prettyDoc.dispose();
        documents.delete(doc.uri);
    }
}
function unloadDocuments() {
    for (const prettyDoc of documents.values()) {
        prettyDoc.dispose();
    }
    documents.clear();
}
/** clean-up; this extension is being unloaded */
function deactivate() {
    onEnabledChangeHandlers.forEach(h => h(false));
    unloadDocuments();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map