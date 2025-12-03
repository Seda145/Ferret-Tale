/*****
** Used in combination with a page or panel, one that implements a response to this field.
** This class automatically process input through provided display, validation logic.
*****/
class ConfigFieldCheckbox {
    static create(inScopeElement, inFieldName, inDisplayName, inHelpText) {
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

        /* Events */
        
        nThis.eInput.addEventListener("change", nThis.actOnChange.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eInput.addEventListener("keyup", nThis.actOnKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

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
 
<label class="config-field config-field-checkbox">
    <span></span>
    <input type="checkbox">
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

        // inValue is always expected to be bool.
        // When input from the user, this should already be so. 
        // When loaded from JSON, it can be anything.
        this.validatedValue = inValue === true;
        this.eInput.checked = this.validatedValue;

        let userChangeEvent = new Event('user-change', { bubbles: false });
        userChangeEvent.configField = this;
        userChangeEvent.oldValidatedValue = oldValidatedValue;
        userChangeEvent.isUserChange = inIsUserChange;
        this.element.dispatchEvent(userChangeEvent);
    }

    actOnChange() {
        this.setValue(this.eInput.checked, true);
    }

    actOnKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnChange();
        }
    }
}