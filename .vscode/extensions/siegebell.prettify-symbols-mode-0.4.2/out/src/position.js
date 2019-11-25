"use strict";
function adjustCursorMovement(start, end, doc, avoidRanges) {
    try {
        const match = findInSortedRanges(end, avoidRanges, { excludeStart: true, excludeEnd: true });
        if (match) {
            if (start.line == end.line && start.character > end.character)
                return { pos: match.range.start, range: match.range }; // moving left
            else if (start.line == end.line && start.character < end.character)
                return { pos: match.range.end, range: match.range }; // moving right
        }
    }
    catch (e) { }
    return { pos: end, range: undefined };
}
exports.adjustCursorMovement = adjustCursorMovement;
// function findClosestInPrettyDecorations(pos: vscode.Position, prettySubsts: PrettySubstitution[], options: {excludeStart?: boolean, excludeEnd?: boolean} = {excludeStart: false, excludeEnd: false}) {
// 	for(let prettyIdx = 0; prettyIdx < prettySubsts.length; ++prettyIdx) {
// 		const subst = prettySubsts[prettyIdx];
// 		let match = findClosestInSortedRanges(pos,subst.preRanges,options);
// 		if(match)
// 		  return {range:match.range,index:match.index,prettyIndex:prettyIdx,pre: true};
// 		match = findClosestInSortedRanges(pos,subst.postRanges,options);
// 		if(match)
// 		  return {range:match.range,index:match.index,prettyIndex:prettyIdx,pre:false};		
// 	}
// 	return undefined;
// }
function findInSortedRanges(pos, ranges, options = { excludeStart: false, excludeEnd: false }) {
    const exclStart = options.excludeStart || false;
    const exclEnd = options.excludeEnd || false;
    let begin = 0;
    let end = ranges.length;
    while (begin < end) {
        const idx = Math.floor((begin + end) / 2);
        const range = ranges[idx];
        if (range.contains(pos) && !(exclStart && range.start.isEqual(pos)) && !(exclEnd && range.end.isEqual(pos)))
            return { range: range, index: idx };
        else if (pos.isBefore(range.start))
            end = idx;
        else
            begin = idx + 1;
    }
    return undefined;
}
function findClosestInSortedRanges(pos, ranges, options = { excludeStart: false, excludeEnd: false }) {
    const exclStart = options.excludeStart || false;
    const exclEnd = options.excludeEnd || false;
    let begin = 0;
    let end = ranges.length;
    while (begin < end) {
        const idx = Math.floor((begin + end) / 2);
        const range = ranges[idx];
        if (range.contains(pos) && !(exclStart && range.start.isEqual(pos)) && !(exclEnd && range.end.isEqual(pos)))
            return { range: range, index: idx };
        else if (pos.isBefore(range.start))
            end = idx;
        else
            begin = idx + 1;
    }
    for (let idx = begin; idx < ranges.length; ++idx) {
        const range = ranges[idx];
        if (range.start.isAfterOrEqual(pos) && !(exclStart && range.start.isEqual(pos)))
            return { range: range, index: idx };
    }
    return undefined;
}
//# sourceMappingURL=position.js.map