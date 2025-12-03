/*****
** 
*****/
class WriterStoryInfoPanelsConfigPanel {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.infoPanel = null;

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="writer-story-info-panels-config-panel"]'), nThis.getHTMLTemplate());

        nThis.eToolbarSelectPanel = nThis.element.querySelector('[name="select-panel"]');
        nThis.rebuildToolbarSelectPanel();

        nThis.eToolbarButtonAddPanel = nThis.element.querySelector(".button-add-panel");

        nThis.eToolbarButtonDeletePanel = nThis.element.querySelector(".button-delete-panel");

        nThis.eInfoPanelWrap = nThis.element.querySelector(".info-panels-config-panel-info-panel-wrap");

        nThis.tryLoadDefaultPanel();

        /* Events */

        app.writerData.element.addEventListener("set-active-story", nThis.actOnWriterDataSetActiveStory.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("reset-story", nThis.actOnWriterDataResetStory.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("added-info-panel", nThis.actOnWriterDataAddedInfoPanel.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("deleted-info-panel", nThis.actOnWriterDataDeletedInfoPanel.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("renamed-info-panel", nThis.actOnWriterDataRenamedInfoPanel.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("move-info-panel", nThis.actOnWriterDataMoveInfoPanel.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarSelectPanel.addEventListener("change", nThis.actOnToolbarSelectPanelChange.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonAddPanel.addEventListener("click", nThis.actOnToolbarButtonAddPanelClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonAddPanel.addEventListener("keyup", nThis.actOnToolbarButtonAddPanelKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonDeletePanel.addEventListener("click", nThis.actOnToolbarButtonDeletePanelClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonDeletePanel.addEventListener("keyup", nThis.actOnToolbarButtonDeletePanelKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.unloadInfoPanel();

        this.element.remove();
        this.element = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-story-info-panels-config-panel config-panel">
    <fieldset>
        <Legend>Info Panel</Legend>

        <p>An info panel is an extra panel your readers can view while they are reading.</p>
        <p>Panels and content are ordered by index.</p>
        <p>Content is not interactive, and displays for configurable info conditions.</p>
        <p>Example panels: Map / Journal / Spells / Inventory / Tasks / Achievements.</p>

        <div class="writer-page-toolbar writer-page-toolbar-alt writer-story-info-panels-config-toolbar">
            <div class="writer-page-toolbar-button-wrap">
                <div tabindex="0" class="button-type-2 button-delete-panel">
                    Delete Panel
                </div> 

                <select class="flex-fill button-type-1" name="select-panel"></select>

                <div tabindex="0" class="button-type-2 button-add-panel">
                    Create Panel
                </div> 
            </div> 
        </div>    

        <div class="info-panels-config-panel-info-panel-wrap">
            
        </div>
    </fieldset>
</div>

        `);
    }

    rebuildToolbarSelectPanel() {
        // First clean.

        // Removing options also clears the text displayed on the select element itself. 
        for (let i = Object.keys(this.eToolbarSelectPanel.options).length - 1; i >= 0; i--) {
            this.eToolbarSelectPanel.options.remove(i);
        }

        // Then build.
        
        // I don't sort the option list by panel name, but by index.
        // This is to reflect the index input that controls their order.
        for (const panelKey of Object.keys(app.writerData.getInfoPanels())) {
            // Append shows panel with highest index number as lowest in the option list.
            UIUtils.appendInnerHTML(this.eToolbarSelectPanel, `<option value="${panelKey}">${app.writerData.getInfoPanel(panelKey).name}</option>`);
        }

        if (this.infoPanel != null) {
            // Restore value to the active info panel. 
            // Otherwise the select shows an incorrect active value.
            this.eToolbarSelectPanel.value = this.infoPanel.panelKey;
        }
    }

    tryLoadDefaultPanel() {
        const lastVisited = app.writerData.getLastVisitedInfoPanelId();
        if (lastVisited != null) {
            // Assume valid.
            this.loadInfoPanel(lastVisited);
        }
        else if (Object.entries(app.writerData.getInfoPanels()).length > 0) {
            // Get first available. Since they are keyed like indexes, just load the first.
            this.loadInfoPanel("0");
        }
        else {
            this.loadInfoPanel(null);
        }
    }

    unloadInfoPanel() {
        // Don't do this, because we want to remember another time what we visited, not what we unvisited.
        // app.writerData.setLastVisitedInfoPanelId(null);

        if (this.infoPanel != null) {
            this.infoPanel.prepareRemoval();
            this.infoPanel = null;
        }
    }

    loadInfoPanel(inPanelKey) {
        // Unload panel

        this.unloadInfoPanel();

        // Load panel

        app.writerData.setLastVisitedInfoPanelId(inPanelKey);

        if (inPanelKey != null) {
            if (app.writerData.getInfoPanel(inPanelKey) == null) {
                // This point should not be reached at all, or there is a system fault. 
                // WriterData must manage the keys properly and inPanelKey must be a correct argument.
                console.error(`inPanelKey: "${inPanelKey}" is not null, but no info panel was found for it.`);
                return;
            }

            this.eToolbarSelectPanel.value = inPanelKey;
            this.infoPanel = WriterStoryInfoPanelConfigPanel.create(this.eInfoPanelWrap, inPanelKey);
        }
        else {
            // Removes the text displayed on the select element itself. 
            this.eToolbarSelectPanel.value = "";
        }

        this.updateDeletePanelButtonVisibility();
    }

    updateDeletePanelButtonVisibility() {
        this.eToolbarButtonDeletePanel.classList.toggle("disabled", this.infoPanel == null);
    }

    /* Events */

    actOnWriterDataSetActiveStory() {
        this.rebuildToolbarSelectPanel();
        this.tryLoadDefaultPanel();
    }

    actOnWriterDataResetStory() {
        this.rebuildToolbarSelectPanel();
        this.tryLoadDefaultPanel();
    }

    actOnToolbarSelectPanelChange() {
        this.loadInfoPanel(this.eToolbarSelectPanel.value);
    }

    actOnToolbarButtonAddPanelClick() {
        app.writerData.addInfoPanel();
    }

    actOnToolbarButtonAddPanelKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnToolbarButtonAddPanelClick();
        }
    }

    actOnToolbarButtonDeletePanelClick() {
        if (this.infoPanel != null) {
            app.writerData.deleteInfoPanel(this.infoPanel.panelKey);
        }
    }

    actOnToolbarButtonDeletePanelKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnToolbarButtonDeletePanelClick();
        }
    }

    actOnWriterDataAddedInfoPanel(inEvent) {
        this.rebuildToolbarSelectPanel();
        this.loadInfoPanel(inEvent.newPanelKey);
    }

    actOnWriterDataDeletedInfoPanel() {
        this.rebuildToolbarSelectPanel();
        this.tryLoadDefaultPanel();
    }

    actOnWriterDataRenamedInfoPanel() {
        this.rebuildToolbarSelectPanel();
    }

    actOnWriterDataMoveInfoPanel(inEvent) {
        this.rebuildToolbarSelectPanel();
        // I'm currently rebuilding the entire panel when this happens,
        // because it and nested components rely on the panel key.
        // I don't want to go through all of them with listeners.
        // Until all are rebuilt, their panel key is invalid.
        this.loadInfoPanel(inEvent.toPanelKey);
    }
}
