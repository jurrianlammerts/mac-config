'use strict';
const vscode = require("vscode");
const textUtil = require("./text-util");
class RangeSet {
    constructor() {
        // sorted by start position; assume none overlap or touch
        this.ranges = [];
    }
    clear() {
        this.ranges = [];
        this.ranges[0].start.translate(0, 0);
    }
    /** Adjust the ranges by the given delta */
    shiftDelta(delta) {
        this.ranges.forEach((r, idx) => {
            this.ranges[idx] = textUtil.rangeTranslate(this.ranges[idx], delta);
        });
    }
    getOverlappingIndices(range, options) {
        if (this.ranges.length <= 0)
            return { begin: 0, end: 0 };
        let begin = Math.max(0, this.indexAt(range.start));
        if (this.ranges[begin].end.isBefore(range.start))
            ++begin;
        else if (!options.includeTouchingStart && this.ranges[begin].end.isEqual(range.start))
            ++begin;
        let end = Math.max(begin, this.indexAt(range.end, begin));
        if (end < this.ranges.length && this.ranges[end].end.isAfter(range.start) && this.ranges[end].start.isBefore(range.end))
            ++end;
        else if (end < this.ranges.length && options.includeTouchingEnd && this.ranges[end].start.isEqual(range.end))
            ++end;
        else if (end < this.ranges.length && options.includeTouchingStart && this.ranges[end].end.isEqual(range.start))
            ++end;
        return { begin: begin, end: end };
    }
    /** Calculate the set of ranges that overlap `range` */
    getOverlapping(range, options) {
        const { begin: begin, end: end } = this.getOverlappingIndices(range, options);
        return this.ranges.slice(begin, end);
    }
    /** Removes all ranges that intersect with `range`, returning the removed elements */
    removeOverlapping(range, options) {
        const { begin: begin, end: end } = this.getOverlappingIndices(range, options);
        return this.ranges.splice(begin, end - begin);
    }
    add(range) {
        if (range.isEmpty)
            return;
        if (this.ranges.length == 0) {
            this.ranges.push(range);
            return;
        }
        // find the first intersecting range
        const beginPos = this.ranges.findIndex((r) => r.end.isAfterOrEqual(range.start));
        if (beginPos == -1) {
            this.ranges.push(range);
            return;
        }
        const r0 = this.ranges[beginPos];
        if (r0.start.isAfter(range.end)) {
            // insert before pos
            this.ranges.splice(beginPos, 0, range);
            return;
        }
        // find the range *just after* the last intersecting range
        let endPos = this.ranges.findIndex((r) => r.start.isAfter(range.end));
        // assume beginPos <= endPos (because this.ranges is sorted)
        if (endPos == -1)
            endPos = this.ranges.length;
        const r1 = this.ranges[endPos - 1];
        this.ranges[beginPos] = r0.union(r1.union(range));
        this.ranges.splice(beginPos + 1, endPos - beginPos - 1);
    }
    subtract(range) {
        if (this.ranges.length == 0 || this.ranges[0].isEmpty || range.isEmpty) {
            return; // no intersection
        }
        // find the first intersecting range
        const beginPos = this.ranges.findIndex((r) => r.end.isAfter(range.start));
        if (beginPos == -1)
            return; // after pos; no intersection
        const r0a = this.ranges[beginPos].start;
        let remainder1;
        if (r0a.isAfterOrEqual(range.end))
            return; // no intersection
        else if (r0a.isAfterOrEqual(range.start))
            remainder1 = new vscode.Range(r0a, r0a);
        else
            remainder1 = new vscode.Range(r0a, range.start);
        // find the range *just after* the last intersecting range
        let endPos = this.ranges.findIndex((r) => r.end.isAfter(range.end));
        // assume beginPos <= endPos (because this.ranges is sorted)
        let remainder2;
        if (endPos == -1) {
            endPos = this.ranges.length;
            remainder2 = new vscode.Range(r0a, r0a); // empty range
        }
        else if (this.ranges[endPos].start.isAfterOrEqual(range.end))
            remainder2 = new vscode.Range(r0a, r0a);
        else {
            remainder2 = new vscode.Range(range.end, this.ranges[endPos].end);
            ++endPos; // endPos needs to be spliced below
        }
        if (remainder1.isEmpty) {
            if (remainder2.isEmpty)
                this.ranges.splice(beginPos, endPos - beginPos);
            else {
                this.ranges.splice(beginPos, endPos - beginPos, remainder2);
            }
        }
        else if (remainder2.isEmpty)
            this.ranges.splice(beginPos, endPos - beginPos, remainder1);
        else
            this.ranges.splice(beginPos, endPos - beginPos, remainder1, remainder2);
    }
    applyEdit(delta) {
        for (let idx = 0; idx < this.ranges.length; ++idx)
            this.ranges[idx] = textUtil.rangeTranslate(this.ranges[idx], delta);
    }
    toString() {
        return this.ranges.toString();
    }
    /**
     * @returns the index of the range at or before the position, or -1 if no such range exists
     * case:  [A] X [B]  --> A
     * case:  [A-X] [B]  --> A
     */
    indexAt(position, begin, end) {
        // binary search!
        if (!begin)
            begin = 0;
        if (!end)
            end = this.ranges.length;
        while (begin < end) {
            const pivot = (begin + end) >> 1;
            const pivotRange = this.ranges[pivot];
            if (position.isBefore(pivotRange.start))
                end = pivot;
            else if (position.isBefore(pivotRange.end))
                return pivot;
            else if (begin == pivot)
                break;
            else
                begin = pivot;
        }
        return begin;
    }
    // 
    //   public insertShift(position: vscode.Position, linesDelta: number, charactersDelta: number) : boolean {
    //     if(linesDelta == 0 && charactersDelta == 0)
    //       return;
    //     if(linesDelta < 0 || charactersDelta < 0)
    //       return;
    //     const beginIdx = this.indexAt(position);
    //     const beginSent = this.ranges[beginIdx];
    //     if(beginSent.end.isAfter(position) {
    //       // contains the position
    // 
    //       beginSent.end.translate(linesDelta).with(undefined,charactersDelta);
    //     } else if(beginIdx < this.sentencesByPosition.length-1
    //       && -count > this.sentencesByPosition[beginIdx+1].textBegin-beginSent.textEnd) {
    //       return false; // cannot remove more characters than exist between sentences      
    //     }
    //     
    //     // shift subsequent sentences
    //     for (let idx = beginIdx+1; idx < this.sentencesByPosition.length; ++idx) {
    //       this.sentencesByPosition[idx].textBegin+= count;
    //       this.sentencesByPosition[idx].textEnd+= count;
    //     }
    //     
    //     return true;
    //   }
    getRanges() {
        return this.ranges;
    }
}
exports.RangeSet = RangeSet;
// 
//   // Adds or removes from the range, starting at position and affecting all subsequent ranges
//   public shift(position: vscode.Position, linesDelta: number, charactersDelta: number) : boolean {
//     if(linesDelta == 0 && charactersDelta == 0)
//       return;
//     const beginIdx = this.indexAt(position);
//     const beginSent = this.ranges[beginIdx];
//     if(beginSent.end.isAfter(position) {
//       // contains the position
//       beginSent.end = tryTranslatePosition(beginSent.end, linesDelta, charactersDelta);
//       if(-count > beginSent.textEnd - beginSent.textBegin)
//         return false; // cannot remove more characters than a sentence has
//       beginSent.textEnd += count;
//     } else if(beginIdx < this.sentencesByPosition.length-1
//       && -count > this.sentencesByPosition[beginIdx+1].textBegin-beginSent.textEnd) {
//       return false; // cannot remove more characters than exist between sentences      
//     }
//     
//     // shift subsequent sentences
//     for (let idx = beginIdx+1; idx < this.sentencesByPosition.length; ++idx) {
//       this.sentencesByPosition[idx].textBegin+= count;
//       this.sentencesByPosition[idx].textEnd+= count;
//     }
//     
//     return true;
//   }
/*
) Starting ranges
[*****|***]   [****
*****]
1) insert on same line
[*****<++++++>***]   [****
*****]
2) insert with a line break
[*****<+++
+++>***]   [****
*****]

) Deleting on same line
[***<----->**]   [****
*****]
=
[*****]   [****
*****]

) Deleting on multiple lines
[***<--
----->**]   [****
*****]
=
[*****]   [****
*****]

*/
// 
// function shiftPosition(pos: vscode.Position, linesDelta: number, charactersDelta: number) : vscode.Position {
//   if(linesDelta > 1) {
//     return new vscode.Position(linesDelta,pos.character - );
//   }
//   if(linesDelta == 0 && ) {
//     
//   }
//   return null;
// } 
//# sourceMappingURL=RangeSet.js.map