/*****
** A content page, that can be injected by PageInjector on demand.
*****/
class ConfigPage {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.configFields = [];

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="injected-page"]'), nThis.getHTMLTemplate());
        
        nThis.eConfigFieldsetWrap = nThis.element.querySelector(".config-fieldset-wrap");

        nThis.supportFieldset = Fieldset.create(nThis.eConfigFieldsetWrap, "Support");
        nThis.configFields.push(ConfigFieldCheckbox.create(nThis.supportFieldset.element, "enable_help_page", "Enable help page", "The help page is enabled by default. You can disable it if you have read it before and prefer less distractions on your navigation menu / bar."));
        nThis.configFields.push(ConfigFieldCheckbox.create(nThis.supportFieldset.element, "save_file_download_reminder", "Remind to check downloads", "Enabling this will show a popup when you download your progress or exported story. This popup reminds you to check if your file(s) arrived in your downloads folder."));

        // Sync title and options with how WriterStoryAboutConfigPanel does it for consistency. The field differs!
        nThis.layoutFieldset = Fieldset.create(nThis.eConfigFieldsetWrap, "Reading layout");
        nThis.configFields.push(ConfigFieldSelect.create(nThis.layoutFieldset.element, "pc_reading_layout", "Large screen reading layout", 
            [
                { value: "Writer decides", title: "The writer decides which of the other options works best for the story." },
                { value: "Column", title: "Show text + image on the same row. Uses page width." },
                { value: "Column (compact)", title: "Show text + image on the same row. Uses compact width." },
                { value: "Row", title: "Show text and image on separate rows. Uses page width." },
                { value: "Row (compact text)", title: "Show text and image on separate rows. Uses compact width for text. Uses page width for images." },
                { value: "Row (compact)", title: "Show text and image on separate rows. Uses compact width." }
            ],
            "This adjusts the reading layout for average / large screen sizes. It can override the writer's recommendation.")
        );

        nThis.audioFieldset = Fieldset.create(nThis.eConfigFieldsetWrap, "Audio");
        nThis.configFields.push(ConfigFieldRange.create(nThis.audioFieldset.element, "music_volume", "Music volume", 0, 1, 0.1, "A story can include audio. Music is often continuous background audio, but not related to environmental sounds."));
        nThis.configFields.push(ConfigFieldRange.create(nThis.audioFieldset.element, "ambience_volume", "Ambience volume", 0, 1, 0.1, "A story can include audio. Ambience is background audio related to the environment, such as continuous rain or city sounds."));
        nThis.configFields.push(ConfigFieldRange.create(nThis.audioFieldset.element, "sound_effects_volume", "Sound effect volume", 0, 1, 0.1, "A story can include audio. A sound effect is a short sound which does not play continuously, related to a moment in the story, or a voice of a character."));

        for (let [fieldKey, fieldVal] of Object.entries(nThis.configFields)) {
            fieldVal.setValue(app.configData.getConfigVal(fieldVal.fieldName), false);
        }

        /* Events */

        for (let [fieldKey, fieldVal] of Object.entries(nThis.configFields)) {
            fieldVal.element.addEventListener("user-change", nThis.actOnAnyConfigFieldChange.bind(nThis), { signal: nThis.acEventListener.signal });
        }

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.supportFieldset.prepareRemoval();
        this.supportFieldset = null;

        this.layoutFieldset.prepareRemoval();
        this.layoutFieldset = null;

        for (let settingX of this.configFields) {
            settingX.prepareRemoval();
        }
        this.configFields = [];

        this.element.remove();
		this.element = null;

        this.eConfigFieldsetWrap = null;
        
        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="config-page">
    <div class="max-width-wrap">
        <h1>Settings</h1>

        <div class="config-fieldset-wrap">
        
        </div>
    </div>
</div>

        `);
    }


    /* Events */

    actOnAnyConfigFieldChange(inEvent) {
        if (inEvent.isUserChange) {
            app.configData.setConfigVal(inEvent.configField.fieldName, inEvent.configField.getValidatedValue());
        }
    }
}