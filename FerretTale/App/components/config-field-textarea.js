/*****
** Used in combination with a page or panel, one that implements a response to this field.
** This class automatically process input through provided display, validation logic.
*****/
class ConfigFieldTextarea {
    static create(inScopeElement, inFieldName, inDisplayName, inDisplayFormatter, inValidator, inHelpText) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.validatedValue = null;

        nThis.fieldName = inFieldName;
        nThis.displayFormatter = inDisplayFormatter;
        nThis.validator = inValidator;

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eTitle = nThis.element.querySelector("span");
        nThis.eTitle.innerText = `${inDisplayName}:`;
        nThis.eTitle.title = inHelpText;

        nThis.eTextArea = nThis.element.querySelector("textarea");
        nThis.eTextArea.name = `config-field-${nThis.fieldName}`;

        /* Events */

        nThis.eTextArea.addEventListener("keydown", nThis.actOnKeyDown.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eTextArea.addEventListener("change", nThis.actOnChange.bind(nThis), { signal: nThis.acEventListener.signal });

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
 
<label class="config-field config-field-textarea">
    <span></span>
    <textarea></textarea>
</label>

        `);
    }

    getValidatedValue() {
        return this.validatedValue;
    }

    getDisplayFormattedValue() {
        return this.eTextArea.value;
    }

    setValue(inValue, inIsUserChange) {
        // Event "change" seems to trigger only when the user finishes editing the field,
        // not when loading a value through code. This is useful to avoid a loop.

        const oldValidatedValue = this.getValidatedValue();

        // inValue is always expected to be string.
        // When input from the user, this should already be so. 
        // When loaded from JSON, it can be anything.
        const valueString = inValue != null ? inValue.toString() : "";
        
        // The validator turns it into what type the app (and JSON) is using.
        this.validatedValue = this.validator != null ? this.validator(valueString) : valueString;

        // The display formatter turns it into a string the end user sees, formatted for readability.
        this.eTextArea.value = this.displayFormatter != null ? this.displayFormatter(this.getValidatedValue()) : this.getValidatedValue();

        let userChangeEvent = new Event('user-change', { bubbles: false });
        userChangeEvent.configField = this;
        userChangeEvent.oldValidatedValue = oldValidatedValue;
        userChangeEvent.isUserChange = inIsUserChange;
        this.element.dispatchEvent(userChangeEvent);
    }

    actOnKeyDown(inEvent){
        if (inEvent.key == "PageDown"
            || inEvent.key == "PageUp"
        ) {
            // There seems to be a browser bug (Chrome) when pressing these keys within a textarea.
            // When I do, the entire page shifts to the left or right if I'm zoomed in a bit.
            // This effect appears to be reset when I remove (and set again) the negative css margin from .writer-page.
            // Besides that bug, there is no added value to having pageDown and pageUp in these textareas, so I disable it.

            // console.log(inEvent);
            inEvent.preventDefault();
        }
    }

    actOnChange() {
        this.setValue(this.eTextArea.value, true);
    }
}
