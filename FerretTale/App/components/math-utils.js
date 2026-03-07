class MathUtils {
    static clamp(inValue, inMin, inMax) {
        return (inValue < inMin ? inMin : inValue > inMax ? inMax : inValue);
    }

    static lerp(inStartVal, inEndVal, inAlpha) {
        return (1 - inAlpha) * inStartVal + inAlpha * inEndVal;
    }

    static isStringInt(inValue) {
        // Chrome tested. JS produces nonsense, and a lot of it:
        // 1. >> parseInt(null)
        // << NaN
        // >> typeof (NaN)
        // << 'number'
        // >> typeof (null)
        // << 'object'
        // >> isNaN(null)
        // << false
        //
        // 2. >> parseInt("15&*#&@snsb22")
        // << 15
        //
        // This method attempts to get to the point:
        // Is the string exactly an int or not!

        // To avoid 1.
        if (typeof (inValue) != 'string' || inValue == "") {
            return false;
        }

        // Check if we prefix with too many 0s.
        // I add this check for the HTML input type number allows such garbage (int 000002).
        if (inValue.startsWith("0") && inValue != "0") {
            return false;
        }

        // To avoid 2. Test int char by char.
        let foundNumber = false;
        for (let i = 0; i < inValue.length; i++) {
            const charX = inValue[i];

            if (charX == "-") {
                if (i != 0) {
                    // Allow only once, at start.
                    return false;
                }
            }
            else if (isNaN(parseInt(charX))) {
                return false;
            }
            else {
                foundNumber = true;
            }
        }

        if (!foundNumber) {
            // Garbage value, like ",".
            return false;
        }

        return true;
    }

    static isStringFloat(inValue) {
        // Chrome tested. JS produces nonsense, and a lot of it:
        // 1. >> parseInt(null)
        // << NaN
        // >> typeof (NaN)
        // << 'number'
        // >> typeof (null)
        // << 'object'
        // >> isNaN(null)
        // << false
        //
        // 2. >> parseInt("15&*#&@snsb22")
        // << 15
        //
        // 3. >> parseFloat("2.2.55")
        // << 2.2
        //
        // 4. Inconsistent use of . and , in input element type number.
        // Whatever system you use, console inputElement.value always returns a dot but step button changes value to comma on element.
        // Want to check for both systems here.
        //
        // This method attempts to get to the point:
        // Is the string exactly a float or not!

        // To avoid 1.
        if (typeof (inValue) != 'string' || inValue == "") {
            return false;
        }

        // Check if we prefix with too many 0s.
        // Float is commonly written in various ways (.5, 0.5, 0.), but not 0000.5.
        // I add this check for the HTML input type number allows such garbage (int 000002).
        if (inValue.startsWith("0") && inValue.length > 1) {
            if (inValue[1] != "." && inValue[1] != ",") {
                // If the second character is not a dot or comma, we have a garbage 0 prefix like "01", a value that should have been "1".
                return false;
            }
        }

        // To avoid 2. 3. and 4.
        let dots = 0;
        let commas = 0;
        let foundNumber = false;
        for (let i = 0; i < inValue.length; i++) {
            const charX = inValue[i];

            if (isNaN(parseInt(charX))) {
                if (charX == "-") {
                    if (i != 0) {
                        // Allow only once, at start.
                        return false;   
                    }
                }
                else if (charX == ".") {
                    if (dots == 0) {
                        if (commas > 0) {
                            // Don't mix dots and commas.
                            return false;
                        }
                        dots++;
                    }
                    else {
                        // Invalid to have multiple dots in a float.
                        return false;
                    }
                }
                else if (charX == ",") {
                    if (commas == 0) {
                        if (dots > 0) {
                            // Don't mix dots and commas.
                            return false;
                        }
                        commas++;
                    }
                    else {
                        // Invalid to have multiple dots in a float.
                        return false;
                    }
                }
                else {
                    // Invalid to have any other char in a float.
                    return false;
                }
            }
            else {
                foundNumber = true;
            }
        }

        if (!foundNumber) {
            // Garbage value, like ",".
            return false;
        }

        return true;
    }
}