"use strict";
const vscode = require("vscode");
// 'sticky' flag is not yet supported :(
const lineEndingRE = /([^\r\n]*)(\r\n|\r|\n)?/;
function offsetAt(text, pos) {
    let line = pos.line;
    let lastIndex = 0;
    while (line > 0) {
        const match = lineEndingRE.exec(text.substring(lastIndex));
        if (match[2] === '' || match[2] === undefined)
            return -1; // the position is beyond the length of text
        else {
            lastIndex += match[0].length;
            --line;
        }
    }
    return lastIndex + pos.character;
}
exports.offsetAt = offsetAt;
/** Calculates the offset into text of pos, where textStart is the position where text starts and both pos and textStart are absolute positions
 * @return the offset into text indicated by pos, or -1 if pos is out of range
 *
 * 'abc\ndef'
 * 'acbX\ndef'
 * +++*** --> +++_***
 * */
function relativeOffsetAtAbsolutePosition(text, textStart, pos) {
    let line = textStart.line;
    let currentOffset = 0;
    // count the relative lines and offset w.r.t text
    while (line < pos.line) {
        const match = lineEndingRE.exec(text.substring(currentOffset));
        ++line; // there was a new line
        currentOffset += match[0].length;
    }
    if (line > pos.line)
        return -1;
    else if (textStart.line === pos.line)
        return Math.max(-1, pos.character - textStart.character);
    else
        return Math.max(-1, pos.character + currentOffset);
}
exports.relativeOffsetAtAbsolutePosition = relativeOffsetAtAbsolutePosition;
/**
 * @returns the Position (line, column) for the location (character position), assuming that text begins at start
 */
function positionAtRelative(start, text, offset) {
    if (offset > text.length)
        offset = text.length;
    let line = start.line;
    let currentOffset = 0; // offset into text we are current at; <= `offset`
    let lineOffset = start.character;
    let lastIndex = start.character;
    while (true) {
        const match = lineEndingRE.exec(text.substring(currentOffset));
        // match[0] -- characters plus newline
        // match[1] -- characters up to newline
        // match[2] -- newline (\n, \r, or \r\n)
        if (!match || match[0].length === 0 || currentOffset + match[1].length >= offset)
            return new vscode.Position(line, lineOffset + Math.max(offset - currentOffset, 0));
        currentOffset += match[0].length;
        lineOffset = 0;
        ++line;
    }
}
exports.positionAtRelative = positionAtRelative;
/**
 * @returns the Position (line, column) for the location (character position)
 */
function positionAt(text, offset) {
    if (offset > text.length)
        offset = text.length;
    let line = 0;
    let lastIndex = 0;
    while (true) {
        const match = lineEndingRE.exec(text.substring(lastIndex));
        if (lastIndex + match[1].length >= offset)
            return new vscode.Position(line, Math.max(0, offset - lastIndex));
        lastIndex += match[0].length;
        ++line;
    }
}
exports.positionAt = positionAt;
/**
 * @returns the lines and characters represented by the text
 */
function toRangeDelta(oldRange, text) {
    const newEnd = positionAt(text, text.length);
    let charsDelta;
    if (oldRange.start.line == oldRange.end.line)
        charsDelta = newEnd.character - (oldRange.end.character - oldRange.start.character);
    else
        charsDelta = newEnd.character - oldRange.end.character;
    return {
        start: oldRange.start,
        end: oldRange.end,
        linesDelta: newEnd.line - (oldRange.end.line - oldRange.start.line),
        endCharactersDelta: charsDelta
    };
}
exports.toRangeDelta = toRangeDelta;
function rangeDeltaNewRange(delta) {
    let x;
    if (delta.linesDelta > 0)
        x = delta.endCharactersDelta;
    else if (delta.linesDelta < 0 && delta.start.line == delta.end.line + delta.linesDelta)
        x = delta.end.character + delta.endCharactersDelta + delta.start.character;
    else
        x = delta.end.character + delta.endCharactersDelta;
    return new vscode.Range(delta.start, new vscode.Position(delta.end.line + delta.linesDelta, x));
}
exports.rangeDeltaNewRange = rangeDeltaNewRange;
function positionRangeDeltaTranslate(pos, delta) {
    if (pos.isBefore(delta.end))
        return pos;
    else if (delta.end.line == pos.line) {
        let x = pos.character + delta.endCharactersDelta;
        if (delta.linesDelta > 0)
            x = x - delta.end.character;
        else if (delta.start.line == delta.end.line + delta.linesDelta && delta.linesDelta < 0)
            x = x + delta.start.character;
        return new vscode.Position(pos.line + delta.linesDelta, x);
    }
    else
        return new vscode.Position(pos.line + delta.linesDelta, pos.character);
}
function positionRangeDeltaTranslateEnd(pos, delta) {
    if (pos.isBeforeOrEqual(delta.end))
        return pos;
    else if (delta.end.line == pos.line) {
        let x = pos.character + delta.endCharactersDelta;
        if (delta.linesDelta > 0)
            x = x - delta.end.character;
        else if (delta.start.line == delta.end.line + delta.linesDelta && delta.linesDelta < 0)
            x = x + delta.start.character;
        return new vscode.Position(pos.line + delta.linesDelta, x);
    }
    else
        return new vscode.Position(pos.line + delta.linesDelta, pos.character);
}
function rangeTranslate(range, delta) {
    return new vscode.Range(positionRangeDeltaTranslate(range.start, delta), positionRangeDeltaTranslateEnd(range.end, delta));
}
exports.rangeTranslate = rangeTranslate;
function rangeContains(range, pos, exclStart = false, inclEnd = false) {
    return range.start.isBeforeOrEqual(pos)
        && (!exclStart || !range.start.isEqual(pos))
        && ((inclEnd && range.end.isEqual(pos)) || range.end.isAfter(pos));
}
exports.rangeContains = rangeContains;
function maxPosition(x, y) {
    if (x.line < y.line)
        return x;
    if (x.line < x.line)
        return y;
    if (x.character < y.character)
        return x;
    else
        return y;
}
exports.maxPosition = maxPosition;
//# sourceMappingURL=text-util.js.map