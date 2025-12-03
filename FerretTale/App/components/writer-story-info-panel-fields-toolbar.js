/*****
** 
*****/
class WriterStoryInfoPanelFieldsToolbar {
    static create(inScopeElement, inPanelKey, inAddIndex, inDeleteIndex) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.panelKey = inPanelKey;

        nThis.addIndex = inAddIndex;

        nThis.deleteIndex = inDeleteIndex;

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eButtonWrap = nThis.element.querySelector(".writer-story-info-panel-fields-toolbar-button-wrap");

        nThis.eButtonAdd = null;
        if (nThis.addIndex != null) {
            nThis.eButtonAdd = UIUtils.prependInnerHTML(nThis.eButtonWrap, `<span class="button-type-2 button-add" tabindex="0" title="Create a content block here.">+</span>`);
        }

        nThis.eButtonDelete = null;
        if (nThis.deleteIndex != null) {
            nThis.eButtonDelete = UIUtils.prependInnerHTML(nThis.eButtonWrap, `<span class="button-type-2 button-delete" tabindex="0" title="Delete the content block above. (Index ${nThis.deleteIndex})">-</span>`);
        }

        /* Events */

        if (nThis.eButtonAdd != null) {
            nThis.eButtonAdd.addEventListener("click", nThis.actOnButtonAddClick.bind(nThis), { signal: nThis.acEventListener.signal });
            nThis.eButtonAdd.addEventListener("keyup", nThis.actOnButtonAddKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });
        }

        if (nThis.eButtonDelete != null) {
            nThis.eButtonDelete.addEventListener("click", nThis.actOnButtonDeleteClick.bind(nThis), { signal: nThis.acEventListener.signal });
            nThis.eButtonDelete.addEventListener("keyup", nThis.actOnButtonDeleteKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });
        }

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
 
<div class="writer-story-info-panel-fields-toolbar">
    <div class="writer-story-info-panel-fields-toolbar-button-wrap">
        
    </div>
</div>

        `);
    }

    /* Events */

    actOnButtonAddClick() {
        app.writerData.addInfoDescriptionAtKey(this.panelKey, this.addIndex);
    }

    actOnButtonAddKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnButtonAddClick();
        }
    }

    actOnButtonDeleteClick() {
        app.writerData.deleteInfoDescriptionAtKey(this.panelKey, this.deleteIndex);
    }

    actOnButtonDeleteKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnButtonAddClick();
        }
    }
}
