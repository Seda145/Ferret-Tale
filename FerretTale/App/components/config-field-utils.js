/*****
** Independend global utility to validate and format config field values.
**
** v: Validates input into data ready for app usage.
** f: Used to make validated input easier to read for end users, not for app usage.
*****/
class ConfigFieldUtils {
	// Formatters

	static fAsString(inVal) {
		// converts any value to string. Returns string.
		return inVal != null ? inVal.toString() : "";
	}

	static fArrayAsString (inArr) { 
		// Converts an array to string, then adds a whitespace after every comma. Returns string.
		return inArr.toString().replaceAll(",", ", "); 
	};

	// Validators

	static vString (inString) {
		// Removes all whitespace from start and end of string. Returns string.
		return inString.trim(); 
	};

	static vStringAsArray(inString) {
		// Converts string to array, adds unique trimmed entries, if not empty. Returns array.
		let tempVal = []; 
		for (const valX of inString.split(",")) { 
			if (!tempVal.includes(valX.trim())) { 
				tempVal.push(valX.trim()); 
			} 
		} 
		
		return tempVal.filter((valX) => { return valX != ""; }) 
	};
}
