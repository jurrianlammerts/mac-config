"use strict";
/** Copy all defined stying properties to the target */
function assignStyleProperties(target, source) {
    if (target === undefined || source === undefined)
        return;
    if (source.backgroundColor)
        target.backgroundColor = source.backgroundColor;
    if (source.border)
        target.border = source.border;
    if (source.color)
        target.color = source.color;
    if (source.textDecoration) {
        target.textDecoration = source.textDecoration + (source.hackCSS ? '; ' + source.hackCSS : "");
    }
    else if (source.hackCSS)
        target.textDecoration = 'none; ' + source.hackCSS;
}
exports.assignStyleProperties = assignStyleProperties;
//# sourceMappingURL=configuration.js.map