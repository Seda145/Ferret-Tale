/*****
** 
*****/
class WriterStoryInfoPanelConfigPanel {
    static create(inScopeElement, inPanelKey) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.panelKey = inPanelKey;

        nThis.infoPanelFields = {};

        nThis.infoPanelFieldsToolbars = [];

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.nameField = null;

        nThis.indexField = null;
        
        nThis.hasInfoField = null;

        nThis.notInfoField = null;

        nThis.eConfigFieldsWrap = nThis.element.querySelector(".writer-story-info-panel-config-panel-config-fields-wrap");
        nThis.loadConfigFields();

        nThis.eInfoPanelFieldsWrap = nThis.element.querySelector(".writer-story-info-panel-config-panel-info-panel-fields-wrap");
        nThis.loadInfoPanelFields();

        /* Events */

        // I'm not responding to set active / reset story events on WriterData, 
        // because the parent panel this class is put on does it.
        // This panel is expected to be destructed when such events happen.

        app.writerData.element.addEventListener("info-description-keys-change-cancel", nThis.actOnWriterDataInfoDescriptionKeysChangeCancel.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("info-description-keys-changed", nThis.actOnWriterDataInfoDescriptionKeysChanged.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("move-info-panel-cancel", nThis.actOnWriterDataMoveInfoPanelCancel.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.unloadConfigFields();

        this.unloadInfoPanelFields();

        this.element.remove();
        this.element = null;

        this.eConfigFieldsWrap = null;
        this.eInfoPanelFieldsWrap = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-story-info-panel-config-panel config-panel">
    <div class="writer-story-info-panel-config-panel-config-fields-wrap">
        
    </div>

    <div class="writer-story-info-panel-config-panel-info-panel-fields-wrap">
        
    </div>
</div>

        `);
    }

    unloadConfigFields() {
        if (this.nameField != null) {
            this.nameField.element.removeEventListener("user-change", this.actOnNameFieldChange);
            this.nameField.prepareRemoval();
            this.nameField = null;
        }

        if (this.indexField != null) {
            this.indexField.element.removeEventListener("user-change", this.actOnIndexFieldChange);
            this.indexField.prepareRemoval();
            this.indexField = null;
        }

        if (this.hasInfoField != null) {
            this.hasInfoField.element.removeEventListener("user-change", this.actOnInfoConditionFieldChanged);
            this.hasInfoField.prepareRemoval();
            this.hasInfoField = null;
        }

        if (this.notInfoField != null) {
            this.notInfoField.element.removeEventListener("user-change", this.actOnInfoConditionFieldChanged);
            this.notInfoField.prepareRemoval();
            this.notInfoField = null;
        }
    }

    loadConfigFields() {
        // Unload first

        this.unloadConfigFields();

        // Load new

        this.nameField = ConfigFieldText.create(this.eConfigFieldsWrap, "name", "Panel Name", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "This name is displayed only to the writer. If you want to display a panel name to the reader, then add it as content.");
        this.nameField.setValue(app.writerData.getInfoPanel(this.panelKey).name, false);
        this.nameField.element.addEventListener("user-change", this.actOnNameFieldChange.bind(this), { signal: this.acEventListener.signal });

        this.indexField = ConfigFieldNumber.create(this.eConfigFieldsWrap, "index", "Panel Index", 0, null, 1, true, "Panels are ordered by index (low to high).");
        this.indexField.setValue(this.panelKey, false);
        this.indexField.element.addEventListener("user-change", this.actOnIndexFieldChange.bind(this), { signal: this.acEventListener.signal });

        // Keep in sync with WriterStoryNodeConfigPanel. Description altered.
        this.hasInfoField = ConfigFieldText.create(this.eConfigFieldsWrap, "has_info", "Has info", ConfigFieldUtils.fArrayAsString, ConfigFieldUtils.vStringAsArray, "This info panel only shows when info is present (comma separated).");
        this.hasInfoField.setValue(app.writerData.getInfoPanel(this.panelKey).has_info, false);
        this.hasInfoField.element.addEventListener("user-change", this.actOnInfoConditionFieldChanged.bind(this), { signal: this.acEventListener.signal });

        // Keep in sync with WriterStoryNodeConfigPanel. Description altered.
        this.notInfoField = ConfigFieldText.create(this.eConfigFieldsWrap, "not_info", "Not info", ConfigFieldUtils.fArrayAsString, ConfigFieldUtils.vStringAsArray, "This info panel only shows when info is absent (comma separated).");
        this.notInfoField.setValue(app.writerData.getInfoPanel(this.panelKey).not_info, false);
        this.notInfoField.element.addEventListener("user-change", this.actOnInfoConditionFieldChanged.bind(this), { signal: this.acEventListener.signal });
    }

    unloadInfoPanelFields() {
        for (let [fieldKey, fieldVal] of Object.entries(this.infoPanelFields)) {
            fieldVal.prepareRemoval();
        }
        this.infoPanelFields = {};

        for (let fieldX of this.infoPanelFieldsToolbars) {
            fieldX.prepareRemoval();
        }
        this.infoPanelFieldsToolbars = [];
    }

    loadInfoPanelFields() {
        // Fields are reconstructed because this is simple.
        // There can be a new number of fields (because of delete / add / move actions).

        // Unload first

        this.unloadInfoPanelFields();

        // Load new

        this.infoPanelFieldsToolbars.push(WriterStoryInfoPanelFieldsToolbar.create(this.eInfoPanelFieldsWrap, this.panelKey, "0", null));

        for (const keyX of Object.keys(app.writerData.getInfoPanel(this.panelKey).infoDescriptions)) {
            this.infoPanelFields[keyX] = WriterStoryInfoPanelField.create(this.eInfoPanelFieldsWrap, this.panelKey, keyX);
            // I'm adding 1 to the key to add post, not at index.
            this.infoPanelFieldsToolbars.push(WriterStoryInfoPanelFieldsToolbar.create(this.eInfoPanelFieldsWrap, this.panelKey, (parseInt(keyX) + 1).toString(), keyX));
        }
    }

    scrollToInfoField(inKey) {
        const theField = this.infoPanelFields[inKey];
        if (theField == null) {
            // This point should not be reached at all, or there is a system fault.
            console.error(`No info panel field found at key: ${inKey}`)
            return;
        }

        // Calculate scroll and do it. I'm not using scrollIntoView here because that hijacks all nested scrollbars.
        // I'm also not using it because it gives me inconsistent positions.
        // The calculation gives a window scroll position where the bottom of the field element ends up at the bottom of the window.
        // extraScroll gives some room to see the toolbar below a field (currently just hardcoding it).
        const extraScroll = 60;
        const coordY = extraScroll + window.scrollY + theField.element.getBoundingClientRect().top + theField.element.offsetHeight - window.innerHeight;
        // I restore scroll because the whole list of info panel fields is reconstructed, which causes the scroll to jump elsewhere.
        // For this reason I also scroll instantly.
        // console.log(`Scrolling info panel field into view at key: ${inKey}`);
        window.scrollTo({ top: coordY, behavior: 'instant' });
    }

    /* Events */

    actOnNameFieldChange(inEvent) {
        if (inEvent.isUserChange) {
            app.writerData.renameInfoPanel(this.panelKey, inEvent.configField.getValidatedValue());
        }
    }

    actOnIndexFieldChange(inEvent) {
        if (inEvent.isUserChange) {
            app.writerData.moveInfoPanel(this.panelKey, inEvent.configField.getValidatedValue());
        }
    }

    actOnInfoConditionFieldChanged(inEvent) {
        if (inEvent.isUserChange) {
            app.writerData.alterInfoPanelInfoConditions(this.panelKey, inEvent.configField.fieldName, inEvent.configField.getValidatedValue());
        }
    }
 
    actOnWriterDataInfoDescriptionKeysChangeCancel(inEvent) {
        // console.log("Info description keys change cancel detected.")
        this.loadInfoPanelFields();

        // While toKey will be invalid to use here (since we cancel),
        // Then there should always be a panel at fromKey.

        this.scrollToInfoField(inEvent.fromKey);
    }

    actOnWriterDataInfoDescriptionKeysChanged(inEvent) {
        // console.log("Info description keys changed detected.")
        this.loadInfoPanelFields();

        let newKey = null;

        if (inEvent.deletedKey != null) {
            // If we delete a key, keys with a higher index shift down towards 0.
            // Here newKey be -1 if info at key 0 was deleted!.
            newKey = (parseInt(inEvent.deletedKey) - 1).toString();
        }
        else if (inEvent.toKey != null) {
            newKey = inEvent.toKey;
        }
        else {
            console.error("Can't recover scroll position for info description keys event.");
            return;
        }

        if (newKey == "-1") {
            // Just return here since we're at top of the page (first info field element), 
            // or, there are no panels to recover to.
            return;
        }

        // Then there should always be a panel at the key.

        this.scrollToInfoField(newKey);
    }

    actOnWriterDataRenamedInfoPanel() {
        if (this.nameField != null) {
            this.nameField.setValue(app.writerData.getInfoPanel(this.panelKey).name, false);
        }
    }

    actOnWriterDataMoveInfoPanelCancel(inEvent) {
        if (this.indexField != null) {
            this.indexField.setValue(inEvent.fromPanelKey, false);
        }
    }
}
