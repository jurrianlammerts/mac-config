"use strict";
const vscode = require("vscode");
const copyPaste = require("copy-paste");
const pos = require("./position");
const PrettyModel_1 = require("./PrettyModel");
const debugging = false;
const activeEditorDecorationTimeout = 100;
const updateSelectionTimeout = 20;
const inactiveEditorDecorationTimeout = 500;
function arrayEqual(a1, a2, isEqual = ((x, y) => x === y)) {
    if (a1.length != a2.length)
        return false;
    for (let idx = 0; idx < a1.length; ++idx) {
        if (!isEqual(a1[idx], a2[idx]))
            return false;
    }
    return true;
}
class DebounceFunction {
    constructor(timeout) {
        this.timeout = timeout;
        this.timer = null;
        this.callback = null;
    }
    dispose() {
        if (this.timer != null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    call(callback) {
        this.callback = callback;
        if (this.timer == null) {
            this.timer = setTimeout(() => {
                this.callback();
                this.callback = null;
                this.timer = null;
            }, this.timeout);
        }
    }
}
class PrettyDocumentController {
    constructor(doc, settings, options, document = doc, adjustCursorMovement = settings.adjustCursorMovement) {
        this.document = document;
        this.adjustCursorMovement = adjustCursorMovement;
        this.subscriptions = [];
        this.currentDecorations = [];
        this.updateActiveEditor = new DebounceFunction(activeEditorDecorationTimeout);
        this.updateInactiveEditors = new DebounceFunction(inactiveEditorDecorationTimeout);
        this.updateSelection = new DebounceFunction(updateSelectionTimeout);
        this.lastSelections = new Map();
        // Cache of revealed ranges (to prevent unnecessary updates)
        this.revealedRanges = [];
        this.cursorRanges = [];
        const docModel = {
            getText: (r) => this.document.getText(r),
            getLine: (n) => this.document.lineAt(n).text,
            getLineRange: (n) => this.document.lineAt(n).range,
            getLineCount: () => this.document.lineCount,
            validateRange: (r) => this.document.validateRange(r),
        };
        this.model = new PrettyModel_1.PrettyModel(docModel, settings, options);
        this.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document == this.document)
                this.onChangeDocument(e);
        }));
        this.applyDecorations(this.getEditors(), this.model.getDecorationsList());
    }
    dispose() {
        this.model.dispose();
        this.subscriptions.forEach((s) => s.dispose());
    }
    getEditors() {
        return vscode.window.visibleTextEditors
            .filter((editor) => {
            return editor.document.uri === this.document.uri;
        });
    }
    gotFocus(editor) {
        this.applyDecorations(this.getEditors(), this.currentDecorations);
    }
    copyDecorated(editor) {
        function doCopy(x) {
            return new Promise((resolve, reject) => copyPaste.copy(x, (err) => err ? reject(err) : resolve()));
        }
        const copy = editor.selections.map(sel => this.model.getDecoratedText(sel));
        if (copy.length === 0)
            return Promise.resolve();
        else
            return doCopy(copy.join('\n'));
    }
    applyActiveEditorDecorations(editors, decs, revealRanges, prettyCursors) {
        this.updateActiveEditor.call(() => {
            try {
                for (const editor of editors) {
                    const cursors = prettyCursors
                        || this.model.renderPrettyCursor(editor.selections);
                    // Which ranges should *not* be prettified?
                    const reveal = revealRanges
                        || this.model.revealSelections(editor.selections).ranges;
                    decs.forEach(d => editor.setDecorations(d.decoration, 
                    // d.ranges.map(r => {range: r})
                    d.ranges
                        .filter(r => reveal.every(s => s.intersection(r) === undefined))
                        .map(r => ({
                        range: r,
                        renderOptions: cursors && cursors.ranges.isOverlapping(r)
                            ? cursors.decoration
                            : undefined
                    }))));
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    applyInactiveEditorDecorations(editors, decs) {
        this.updateInactiveEditors.call(() => {
            try {
                for (const editor of editors) {
                    if (editor === vscode.window.activeTextEditor)
                        continue;
                    decs.forEach(d => editor.setDecorations(d.decoration, d.ranges));
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    applyDecorations(editors, decs) {
        this.currentDecorations = decs;
        this.applyActiveEditorDecorations([vscode.window.activeTextEditor], decs);
        this.applyInactiveEditorDecorations(editors, decs);
    }
    onChangeDocument(event) {
        if (this.model.applyChanges(event.contentChanges))
            this.applyDecorations(this.getEditors(), this.model.getDecorationsList());
    }
    refresh() {
        this.model.recomputeDecorations();
        this.applyDecorations(this.getEditors(), this.model.getDecorationsList());
    }
    adjustCursor(editor) {
        let updated = false;
        let adjustedSelections = [];
        let before = this.lastSelections.get(editor);
        if (!before) {
            this.lastSelections.set(editor, editor.selections);
            return editor.selections;
        }
        const after = editor.selections;
        if (arrayEqual(before, after))
            return null;
        after.forEach((sel, idx) => {
            if (before[idx] === undefined) {
                adjustedSelections.push(new vscode.Selection(sel.anchor, sel.active));
                return;
            }
            const adjusted = pos.adjustCursorMovement(before[idx].active, sel.active, this.document, this.model.getPrettySubstitutionsRanges());
            if (!adjusted.pos.isEqual(sel.active)) {
                updated = true;
            }
            // if anchor==active, then adjust both; otherwise just adjust the active position
            if (sel.anchor.isEqual(sel.active))
                adjustedSelections.push(new vscode.Selection(adjusted.pos, adjusted.pos));
            else
                adjustedSelections.push(new vscode.Selection(sel.anchor, adjusted.pos));
        });
        this.lastSelections.set(editor, adjustedSelections);
        // could cause this method to be called again, but since we've set the
        // last-selection to adjustedSelections, we will immediately return. 
        if (updated)
            editor.selections = adjustedSelections;
        return adjustedSelections;
    }
    /**
     * The cursor has moved / the selection has changed. Reveal the original text,
     * box symbols, tec. as needed.
     * @param editor
     */
    selectionChanged(editor) {
        this.updateSelection.call(() => {
            let selections;
            if (this.adjustCursorMovement) {
                selections = this.adjustCursor(editor);
            }
            else {
                selections = editor.selections;
            }
            if (selections == null) {
                return;
            }
            const cursors = this.model.renderPrettyCursor(selections);
            const cR = cursors == null ? [] : cursors.ranges.getRanges();
            const revealed = this.model.revealSelections(selections);
            if (!arrayEqual(revealed.ranges, this.revealedRanges)
                || !arrayEqual(cR, this.cursorRanges)) {
                this.applyActiveEditorDecorations([editor], this.model.getDecorationsList(), revealed.ranges, cursors);
            }
            this.revealedRanges = revealed.ranges;
            this.cursorRanges = cR;
        });
        // const r1 = this.model.revealSelections(editor.selections);
        // const r2 = this.model.renderPrettyCursor(editor.selections);
        // if(this.adjustCursorMovement)
        //   this.adjustCursor(editor);
        // if(r1) {
        //   editor.setDecorations(r1.decoration, r1.ranges);
        // }
        // if(r2)
        //   editor.setDecorations(r2.decoration, r2.ranges);
    }
}
exports.PrettyDocumentController = PrettyDocumentController;
//# sourceMappingURL=document.js.map