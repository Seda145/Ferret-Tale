/*****
** Used in combination with a page or panel, one that implements a response to this field.
** This class automatically process input through provided display, validation logic.
*****/
class ConfigFieldNumber {
    static create(inScopeElement, inFieldName, inDisplayName, inMin, inMax, inStep, inPreventFloat, inHelpText) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.validatedValue = null;

        nThis.fieldName = inFieldName;

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eTitle = nThis.element.querySelector("span");
        nThis.eTitle.innerText = `${inDisplayName}:`;
        nThis.eTitle.title = inHelpText;

        nThis.eInput = nThis.element.querySelector("input");
        if (inMin != null) {
            nThis.eInput.min = inMin;
        }
        if (inMax != null) {
            nThis.eInput.max = inMax;
        }
        if (inStep != null) {
            nThis.eInput.step = inStep;
        }

        nThis.preventFloat = inPreventFloat;

        nThis.eInput.name = `config-field-${nThis.fieldName}`;

        /* Events */
        
        nThis.eInput.addEventListener("beforeinput", nThis.actOnBeforeInput.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eInput.addEventListener("change", nThis.actOnChange.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.element.remove();
		this.element = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<label class="config-field config-field-number">
    <span></span>
    <input type="number">
</label>

        `);
    }

    getValidatedValue() {
        return this.validatedValue;
    }

    getDisplayFormattedValue() {
        return this.getValidatedValue();
    }

    setValue(inValue, inIsUserChange) {
        // Event "change" seems to trigger only when the user finishes editing the field,
        // not when loading a value through code. This is useful to avoid a loop.

        const oldValidatedValue = this.getValidatedValue();

        // inValue is expected a string when input by a user or when loaded from JSON.
        let newValue = oldValidatedValue != null ? oldValidatedValue : this.eInput.min;

        // First remove 0s if prefixed with them.
        // This removes 0s when too many.
        // Floats can be written like .5 and ints should never prefix 0. Both can be 0.
        //
        // I don't do this on actOnBeforeInput because I can't decide on incomplete user input.
        // If this is not done, it won't pass MathUtils.isStringFloat.
        //
        // The validation on actOnBeforeInput is not processed here, 
        // because setValue from a non user interaction is assumed valid (loaded from JSON / system setup.).
        //
        let fixedInValue = "";
        {
            let isPostZeroPrefix = false;
            for (const charX of inValue) {
                if (!isPostZeroPrefix) {
                    if (charX == "0") {
                        continue;
                    }
                    else {
                        // We skipped any 0 chars so far.
                        // Now we found another char, we stop skipping. 
                        isPostZeroPrefix = true;
                        fixedInValue += charX;
                    }
                }
                else {
                    fixedInValue += charX;
                }
            }
            if (fixedInValue.length == 0 && inValue.startsWith("0")) {
                // The value was just 0 (or written as multiple 0s).
                fixedInValue = "0";
            }
        } 

        if (MathUtils.isStringFloat(fixedInValue)) {
            // I'm ignoring step size on this setter, but I'm clamping.
            newValue = MathUtils.clamp(parseFloat(fixedInValue), parseFloat(this.eInput.min), parseFloat(this.eInput.max));
        }

        this.validatedValue = newValue.toString();

        this.eInput.value = this.getValidatedValue();

        let userChangeEvent = new Event('user-change', { bubbles: false });
        userChangeEvent.configField = this;
        userChangeEvent.oldValidatedValue = oldValidatedValue;
        userChangeEvent.isUserChange = inIsUserChange;
        this.element.dispatchEvent(userChangeEvent);
    }

    actOnBeforeInput(inEvent) {
        // Found that this method is reached when: typing into UI, cut / paste / backspace into UI, using step buttons. Good! All user interactions.
        //
        // Chrome allows a lot of junk input (see MathUtils.isStringFloat and comments below).
        //
        // I attempt to prevent some inconsistency / junk before the UI user ends up with it.
        //
        // This prevents users from thinking that typing values like 2+8 actually results in 10,
        // and dealing with other oddities and inconsistent behavior.
        //
        // Here are some problems the browser ships with:
        // 1. Write "5." in this.eInput on the UI. Result: this.eInput.value == "", not the expected "5". Does not alter its UI to reflect.
        // 2. Write ".5" in this.eInput on the UI. Result: this.eInput.value == ".5", then alters itself again to 0.5. 
        // 3. Write "000002" in this.eInput on the UI. Result: "000002" instead of the expected 2. Using the step buttons removes the 0 prefixes. 
        // 4. Write a "." on the UI. The step button changes the UI "." to a ",", yet this.eInput.value == "." and inEvent.data == ".".
        // 5. You can type 6+6 but the result is 6. Extra: parseInt("6+6") == 6.
        //
        // Completely unreliable right? What if someone (me) wants to use accurate input for keying things in JSON?
        // Browser is supposed to be a proper framework. This field is not supposed to be a browser.
        
        // Flashbacks aside I'm only going to do some quick hijacks here if I can make a quick improvement or if required for the app.
        // Otherwise it's nothing but VERY time consuming and I just can't ensure every browser does things the way I want to.

        // console.log(inEvent.data);
        // console.log(this.eInput.value);

        // The combo of above oddities leaves us with just a small possible filter. Blame browser.

        const hasMin = MathUtils.isStringFloat(this.eInput.min);
        const hasNegMin = hasMin && parseFloat(this.eInput.min) < 0;
        if (inEvent.data == null || inEvent.data == "") {
            // This check always needs to be done.

            // Expecting this is either a partial or full delete operation on the value.
            // But, can't reliably read full this.eInput.value here to check that.
            //
            // Not preventing default here could be useful to a user editing through the UI.
            // If I could read the entire value, preventing here shows the user immediately that input will not be valid.
            // Use case: see implementation of WriterStoryInfoPanelField.indexField, which must have a very strict int formatting.

            // console.log("Prevented partial or full delete operation.");
            // inEvent.preventDefault();
        }
        else if (inEvent.data.includes("+")) {
            inEvent.preventDefault();
            // console.log("Prevented + in number input.");
        }
        else if (!hasNegMin && inEvent.data.includes("-")) {
            inEvent.preventDefault();
            // console.log("Prevented - in number input.");
        }
        else if (this.preventFloat) {
            // This check is on "else if" instead of "if", because the first (null / "") check is currently commented (not prevented).
            // MathUtils.isStringInt doesn't take those arguments.
            // The above is treated as an exception to this case currently.

            // This wouldn't work properly if step size is not int,
            // But then the surrounding system itself would be incorrect to load an int mode (saved value) for float operations (step size).
            // TODO I'm not bothering with that now, and probably I shouldn't.
            if (!MathUtils.isStringInt(inEvent.data)) {
                inEvent.preventDefault();
                // console.log("Prevented float input.");
            }
        }
    }

    actOnChange() {
        this.setValue(this.eInput.value, true);
    }
}