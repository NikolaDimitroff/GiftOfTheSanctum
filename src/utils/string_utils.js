"use strict";

function padLeft(string, paddingValue) {
    return String(paddingValue + string).slice(-paddingValue.length);
}

// String extensions. Taken from:
// http://stackoverflow.com/questions/2534803/string-format-in-javascript

function StringFormat(/* format, args */) {
    return toFormattedString(false, arguments);
}

function toFormattedString(useLocale, args) {
    var result = "";
    var format = args[0];

    for (var i = 0; ; ) {
        // Find the next opening or closing brace
        var open = format.indexOf("{", i);
        var close = format.indexOf("}", i);
        if ((open < 0) && (close < 0)) {
            // Not found: copy the end of the string and break
            result += format.slice(i);
            break;
        }
        if ((close > 0) && ((close < open) || (open < 0))) {

            if (format.charAt(close + 1) !== "}") {
                throw new Error("format stringFormatBraceMismatch");
            }

            result += format.slice(i, close + 1);
            i = close + 2;
            continue;
        }

        // Copy the string before the brace
        result += format.slice(i, open);
        i = open + 1;

        // Check for double braces (which display as one and are not arguments)
        if (format.charAt(i) === "{") {
            result += "{";
            i++;
            continue;
        }

        if (close < 0) throw new Error("format stringFormatBraceMismatch");


        // Find the closing brace

        // Get the string between the braces, and split it around the ":" (if any)
        var brace = format.substring(i, close);
        var colonIndex = brace.indexOf(":");
        var argNumber = parseInt((colonIndex < 0) ?
                        brace :
                        brace.substring(0, colonIndex), 10) + 1;

        if (isNaN(argNumber)) throw new Error("format stringFormatInvalid");
        var arg = args[argNumber];
        if (typeof (arg) === "undefined" || arg === null) {
            arg = "";
        }
        // jscs: disable
        result += arg.toString();
        // jscs: enable
        i = close + 1;
    }

    return result;
}

module.exports.format = StringFormat;
module.exports.padLeft = padLeft;
