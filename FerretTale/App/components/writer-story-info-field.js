/*****
** 
*****/
class WriterStoryInfoField {
    static create(inScopeElement, inInfo) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.info = inInfo;

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eButtonCopy = nThis.element.querySelector(".writer-story-info-field-button-copy");

        // Make sure to use the right info formatter and validator.
        // Basically the single (non array) version of what I use on the matching WriterStoryNodeConfigPanel fields.
        nThis.infoConfigField = ConfigFieldText.create(nThis.element, "info", "Info", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "This is an 'info' (logic) field found in your story.");
        nThis.infoConfigField.setValue(nThis.info, false);

        /* Events */

        nThis.eButtonCopy.addEventListener("click", nThis.actOnButtonCopyClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eButtonCopy.addEventListener("keyup", nThis.actOnButtonCopyKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.infoConfigField.element.addEventListener("user-change", nThis.actOnInfoConfigFieldChange.bind(nThis), { signal: nThis.acEventListener.signal });
        
        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.infoConfigField.prepareRemoval();
        this.infoConfigField = null;

        this.element.remove();
        this.element = null;
        
        this.eButtonCopy = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-story-info-field">
    <span class="button-type-2 writer-story-info-field-button-copy" tabindex="0">Copy</span>
    
</div>

        `);
    }

    /* Events */

    actOnButtonCopyClick() {
        navigator.clipboard.writeText(this.info);
    }

    actOnButtonCopyKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnButtonCopyClick();
        }
    }

    actOnInfoConfigFieldChange(inEvent) {
        if (!inEvent.isUserChange) {
            // Not relevant.
            return;
        }

        const oldVal = inEvent.oldValidatedValue;
        const newVal = inEvent.configField.getValidatedValue();

        app.writerData.bulkEditInfo(oldVal, newVal);
    }
}
