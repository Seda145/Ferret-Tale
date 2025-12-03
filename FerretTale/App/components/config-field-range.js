/*****
** Used in combination with a page or panel, one that implements a response to this field.
** This class automatically process input through provided display, validation logic.
*****/
class ConfigFieldRange {
    static create(inScopeElement, inFieldName, inDisplayName, inMinValue, inMaxValue, inStepValue, inHelpText) {
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
        nThis.eInput.name = `config-field-${nThis.fieldName}`;

        nThis.eInput.min = inMinValue;
        nThis.eInput.max = inMaxValue;
        nThis.eInput.step = inStepValue;

        /* Events */

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
 
<label class="config-field config-field-range">
    <span></span>
    <input type="range">
</label>

        `);
    }

    getValidatedValue() {
        return this.validatedValue;
    }

    getDisplayFormattedValue() {
        return this.eInput.value;
    }

    setValue(inValue, inIsUserChange) {
        // Event "change" seems to trigger only when the user finishes editing the field,
        // not when loading a value through code. This is useful to avoid a loop.

        const oldValidatedValue = this.getValidatedValue();

        // inValue is expected a string when input by a user or when loaded from JSON.
        const valueString = inValue != null ? inValue.toString() : "0";
        // This would be enough as validation.
        const valueFloat = MathUtils.clamp(parseFloat(valueString), parseFloat(this.eInput.min), parseFloat(this.eInput.max));
        // Just everything stores it as a string. So convert it back again.
        this.validatedValue = valueFloat.toString();

        let userChangeEvent = new Event('user-change', { bubbles: false });
        userChangeEvent.configField = this;
        userChangeEvent.oldValidatedValue = oldValidatedValue;
        userChangeEvent.isUserChange = inIsUserChange;
        this.element.dispatchEvent(userChangeEvent);
    }

    actOnChange() {
        this.setValue(this.eInput.value, true);
    }
}
