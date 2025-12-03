/*****
** 
*****/
class WriterStoryInfoConfigPanel {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.infoFields = [];

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="writer-story-info-config-panel"]'), nThis.getHTMLTemplate());

        nThis.eInfoFieldsWrap = nThis.element.querySelector(".info-config-panel-info-fields-wrap");

        nThis.loadActiveStory();

        /* Events */

        app.writerData.element.addEventListener("cancel-bulk-edit-info", nThis.actOnWriterDataCancelBulkEditInfo.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("bulk-edited-info", nThis.actOnWriterDataBulkEditedInfo.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("set-active-story", nThis.actOnWriterDataSetActiveStory.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("reset-story", nThis.actOnWriterDataResetStory.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.unloadInfoFields();

        this.element.remove();
        this.element = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-story-info-config-panel config-panel">
    <fieldset>
        <Legend>Info</Legend>

        <p>This panel displays all "info" (logic) detected in your story.</p>
        <p>You can rename, merge or remove info by editing its field here.</p>
        <p>A copy button copies the info text to your clipboard.</p>
        <p>Editing makes large scale changes. Save (backup) your project first.</p>

        <div class="info-config-panel-info-fields-wrap">
            
        </div>
    </fieldset>
</div>

        `);
    }

    unloadInfoFields() {
        for (let fieldX of this.infoFields) {
            fieldX.prepareRemoval();
        }
        this.infoFields = [];
    }

    loadActiveStory() {
        // Fields are reconstructed because this is simple.
        // There can be a new number of fields (because of delete / merge actions).

        // Unload config fields

        this.unloadInfoFields();

        // Load config fields

        const uniqueInfo = app.writerData.collectUniqueInfo().toSorted((a,b) => a.localeCompare(b));
        for (const infoX of uniqueInfo) {
            this.infoFields.push(WriterStoryInfoField.create(this.eInfoFieldsWrap, infoX));
        }
    }

    /* Events */

    actOnWriterDataCancelBulkEditInfo() {
        // We should recover any config field changes to actual state.
        this.loadActiveStory();
    }

    actOnWriterDataBulkEditedInfo() {
        // I don't respond directly to every change on WriterData (info related) fields, to reduce calls.
        // Since we should be using / seeing just this panel with info fields on it,
        // I'm just responding to the specific bulk edit event.
        this.loadActiveStory();
    }

    actOnWriterDataSetActiveStory() {
        this.loadActiveStory();
    }

    actOnWriterDataResetStory() {
        this.loadActiveStory();
    }
}
