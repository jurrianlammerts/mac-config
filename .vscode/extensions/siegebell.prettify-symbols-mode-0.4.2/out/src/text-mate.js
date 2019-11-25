"use strict";
const path = require("path");
const tm = loadTextMate();
function loadTextMate() {
    try {
        require(path.join(require.main.filename, '../../node_modules/vscode-textmate/release/main.js'));
    }
    catch (error) {
        return null;
    }
}
// namespace N {
//   /**
//    * The registry that will hold all grammars.
//    */
//   export declare class Registry {
//     private readonly _locator;
//     private readonly _syncRegistry;
//     constructor(locator?: IGrammarLocator);
//     /**
//      * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
//      */
//     loadGrammar(initialScopeName: string, callback: (err: any, grammar: IGrammar) => void): void;
//     /**
//      * Load the grammar at `path` synchronously.
//      */
//     loadGrammarFromPathSync(path: string): IGrammar;
//     /**
//      * Get the grammar for `scopeName`. The grammar must first be created via `loadGrammar` or `loadGrammarFromPathSync`.
//      */
//     grammarForScopeName(scopeName: string): IGrammar;
//   }  
// }
function matchScope(scope, scopes) {
    if (!scope)
        return true;
    const parts = scope.split(/\s+/);
    let idx = 0;
    for (let part of parts) {
        while (idx < scopes.length && !scopes[idx].startsWith(part))
            ++idx;
        if (idx >= scopes.length)
            return false;
        ++idx;
    }
    return true;
}
exports.matchScope = matchScope;
const dummyGrammar = {
    tokenizeLine(lineText, prevState) {
        return {
            tokens: [],
            ruleStack: prevState,
        };
    }
};
class DummyRegistry {
    constructor(locator) { }
    loadGrammar(initialScopeName, callback) {
        callback(new Error("textmate cannot be loaded"), undefined);
    }
    loadGrammarFromPathSync(path) {
        return dummyGrammar;
    }
    grammarForScopeName(scopeName) {
        return dummyGrammar;
    }
}
exports.Registry = tm == null ? DummyRegistry : tm.Registry;
function combineIdenticalTokenScopes(tokens) {
    if (!tokens || tokens.length === 0)
        return [];
    const result = [tokens[0]];
    let prevToken = tokens[0];
    for (let idx = 1; idx < tokens.length; ++idx) {
        const token = tokens[idx];
        if (prevToken.endIndex === token.startIndex && token.scopes.length === prevToken.scopes.length && token.scopes.every((t, idx) => t === prevToken.scopes[idx])) {
            // Note: create a copy of the object so the source tokens are unmodified
            result[result.length - 1] = { startIndex: prevToken.startIndex, endIndex: token.endIndex, scopes: prevToken.scopes };
            prevToken = result[result.length - 1];
        }
        else {
            result.push(token);
            prevToken = token;
        }
    }
    return result;
}
exports.combineIdenticalTokenScopes = combineIdenticalTokenScopes;
//# sourceMappingURL=text-mate.js.map