/*****
** Used in combination with a page or panel, one that implements a response to this field.
** This class automatically process input through provided display, validation logic.
*****/
class ConfigFieldSelect {
    static create(inScopeElement, inFieldName, inDisplayName, inOptions, inHelpText) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.validatedValue = null;

        nThis.fieldName = inFieldName;

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eTitle = nThis.element.querySelector("span");
        nThis.eTitle.innerText = `${inDisplayName}:`;
        nThis.eTitle.title = inHelpText;

        nThis.eSelect = nThis.element.querySelector("select");
        nThis.eSelect.name = `config-field-${nThis.fieldName}`;

        for (const optionX of inOptions) {
            UIUtils.prependInnerHTML(nThis.eSelect, `<option title="${optionX.title}" value="${optionX.value}">${optionX.value}</option>`);
        }

        /* Events */

        nThis.eSelect.addEventListener("change", nThis.actOnChange.bind(nThis), { signal: nThis.acEventListener.signal });

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
 
<label class="config-field config-field-select">
    <span></span>
    <select class="button-type-2">
    
    </select>
</label>

        `);
    }

    getValidatedValue() {
        return this.validatedValue;
    }

    getDisplayFormattedValue() {
        return this.eSelect.value;
    }

    setValue(inValue, inIsUserChange) {
        // Event "change" seems to trigger only when the user finishes editing the field,
        // not when loading a value through code. This is useful to avoid a loop.

        const oldValidatedValue = this.getValidatedValue();

        // inValue is always expected to be string.
        // When input from the user, this should already be so. 
        // When loaded from JSON, it can be anything.
        const valueString = inValue != null ? inValue.toString() : "";

        for (const optionX of this.eSelect.options) {
            if (optionX.value === valueString) {
                this.validatedValue = valueString;
                break;
            }
        }

        this.eSelect.value = this.validatedValue;

        let userChangeEvent = new Event('user-change', { bubbles: false });
        userChangeEvent.configField = this;
        userChangeEvent.oldValidatedValue = oldValidatedValue;
        userChangeEvent.isUserChange = inIsUserChange;
        this.element.dispatchEvent(userChangeEvent);
    }

    actOnChange() {
        this.setValue(this.eSelect.value, true);
    }
}