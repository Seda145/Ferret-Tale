/*****
** This class makes text block JSON fields editable through ConfigField classes.
** It's used together with WriterPage.
*****/
class WriterStoryNodeConfigPanel {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.configFields = {};

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="writer-story-node-config-panel"]'), nThis.getHTMLTemplate());

        nThis.eConfigPanelFirst = nThis.element.querySelector(".config-panel-side:first-child");
        nThis.eConfigPanelLast = nThis.element.querySelector(".config-panel-side:last-child");

        // Base + check to see if the id input in "next" actually exists as a text block id, and is not the current id.
        const nextValidator = function (inVal) { return ConfigFieldUtils.vStringAsArray(inVal).filter((valX) => { return app.writerData.getTextBlockById(valX) != null && valX != app.writerData.getLastVisitedNodeId() }) };
        // Base + removing capital characters if value is intended to be "stop".
        const audioFileStopValidator = function (inVal) {
            const fileFieldValidated = ConfigFieldUtils.vString(inVal);
            return fileFieldValidated.toLowerCase() == "stop" ? "stop" : fileFieldValidated;
        };

        nThis.textBlockFieldset = Fieldset.create(nThis.eConfigPanelFirst, "Text block");
        nThis.configFields["next"] = ConfigFieldText.create(nThis.textBlockFieldset.element, "next", "Next", ConfigFieldUtils.fArrayAsString, nextValidator, "Text block IDs that come after this one (comma separated).");
        nThis.configFields["speaker"] = ConfigFieldText.create(nThis.textBlockFieldset.element, "speaker", "Speaker", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "The person or thing speaking in this text block, if any.");
        nThis.configFields["text"] = ConfigFieldTextarea.create(nThis.textBlockFieldset.element, "text", "Text", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "The text to display to the reader");
        
        nThis.logicFieldset = Fieldset.create(nThis.eConfigPanelLast, "Logic");
        nThis.configFields["rnd_next"] = ConfigFieldCheckbox.create(nThis.logicFieldset.element, "rnd_next", "Random next", "Choose randomly between 'next' IDs for the reader?");
        // Keep in sync with WriterStoryInfoPanelField.
        nThis.configFields["has_info"] = ConfigFieldText.create(nThis.logicFieldset.element, "has_info", "Has info", ConfigFieldUtils.fArrayAsString, ConfigFieldUtils.vStringAsArray, "This text block only shows when info is present (comma separated).");
        // Keep in sync with WriterStoryInfoPanelField.
        nThis.configFields["not_info"] = ConfigFieldText.create(nThis.logicFieldset.element, "not_info", "Not info", ConfigFieldUtils.fArrayAsString, ConfigFieldUtils.vStringAsArray, "This text block only shows when info is absent (comma separated).");
        nThis.configFields["add_info"] = ConfigFieldText.create(nThis.logicFieldset.element, "add_info", "Add info", ConfigFieldUtils.fArrayAsString, ConfigFieldUtils.vStringAsArray, "Add this info when this text block is shown.");
        nThis.configFields["rem_info"] = ConfigFieldText.create(nThis.logicFieldset.element, "rem_info", "Remove info", ConfigFieldUtils.fArrayAsString, ConfigFieldUtils.vStringAsArray, "Remove this info when this text block is shown.");

        nThis.mediaFieldset = Fieldset.create(nThis.eConfigPanelLast, "Media");
        nThis.configFields["music"] = ConfigFieldText.create(nThis.mediaFieldset.element, "music", "Music", ConfigFieldUtils.fAsString, audioFileStopValidator, "Start music on loop when this text block is shown. Enter file name + extension. Write 'stop' on a next text block to stop.");
        nThis.configFields["music_once"] = ConfigFieldCheckbox.create(nThis.mediaFieldset.element, "music_once", "Music once", "If checked, don't loop music started by this text block.");
        nThis.configFields["ambience"] = ConfigFieldText.create(nThis.mediaFieldset.element, "ambience", "Ambience", ConfigFieldUtils.fAsString, audioFileStopValidator, "Play ambient audio on loop when this text block is shown. Enter file name + extension. Write 'stop' on a next text block to stop.");
        nThis.configFields["sound"] = ConfigFieldText.create(nThis.mediaFieldset.element, "sound", "Sound", ConfigFieldUtils.fAsString, audioFileStopValidator, "Play sound effect once when this text block is shown. Enter file name + extension.");
        nThis.configFields["image"] = ConfigFieldText.create(nThis.mediaFieldset.element, "image", "Image", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "Show image when this text block is shown. Enter file name + extension.");

        /* Events */

        for (let [fieldKey, fieldVal] of Object.entries(nThis.configFields)) {
            fieldVal.element.addEventListener("user-change", nThis.actOnAnyConfigFieldChange.bind(nThis), { signal: nThis.acEventListener.signal });
        }

        nThis.configFields["music"].element.addEventListener("user-change", nThis.actOnConfigFieldMusicChange.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.configFields["music_once"].element.addEventListener("user-change", nThis.actOnConfigFieldMusicOnceChange.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.configFields["ambience"].element.addEventListener("user-change", nThis.actOnConfigFieldAmbienceChange.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.configFields["sound"].element.addEventListener("user-change", nThis.actOnConfigFieldSoundChange.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.configFields["image"].element.addEventListener("user-change", nThis.actOnConfigFieldImageChange.bind(nThis), { signal: nThis.acEventListener.signal });

        app.writerData.element.addEventListener("last-visited-node-id-change", nThis.actOnWriterDataLastVisitedNodeIdChange.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Late setup */

        nThis.loadTextBlockData();

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.textBlockFieldset.prepareRemoval();
        this.textBlockFieldset = null;

        this.logicFieldset.prepareRemoval();
        this.logicFieldset = null;

        this.mediaFieldset.prepareRemoval();
        this.mediaFieldset = null;

        // console.log(`WriterStoryNodeConfigPanel is preparing removal. It stops audioTracks: ${app.audioController.getMusicTrackId()}, ${app.audioController.getAmbienceTrackId()}, ${app.audioController.getSoundTrackId()}.`);
        app.audioController.stopAudio(app.audioController.getMusicTrackId(), app.audioController.longFadeDuration);
        app.audioController.stopAudio(app.audioController.getAmbienceTrackId(), app.audioController.longFadeDuration);
        app.audioController.stopAudio(app.audioController.getSoundTrackId(), app.audioController.longFadeDuration);
        
        for (let [fieldKey, fieldVal] of Object.entries(this.configFields)) {
            fieldVal.prepareRemoval();
        }
        this.configFields = {};

        this.element.remove();
		this.element = null;

        this.eConfigPanelFirst = null;
        this.eConfigPanelLast = null;
        
        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-story-node-config-panel config-panel">
    <div class="config-panel-side">

    </div>
    <div class="config-panel-side">

    </div>
</div>

        `);
    }

    loadTextBlockData() {
        app.audioController.stopAudio(app.audioController.getMusicTrackId(), app.audioController.longFadeDuration);
        app.audioController.stopAudio(app.audioController.getAmbienceTrackId(), app.audioController.longFadeDuration);
        app.audioController.stopAudio(app.audioController.getSoundTrackId(), app.audioController.longFadeDuration);

        for (let [fieldKey, fieldVal] of Object.entries(this.configFields)) {
            fieldVal.setValue(app.writerData.getTextBlockFieldValue(app.writerData.getLastVisitedNodeId(), fieldVal.fieldName), false);
        }
    }

    /* Events */

    actOnAnyConfigFieldChange(inEvent) {
        if (inEvent.isUserChange) {
            app.writerData.setStoryTextBlockFieldValue(app.writerData.getLastVisitedNodeId(), inEvent.configField.fieldName, inEvent.configField.getValidatedValue());
        }
    }

    // Todo, Thoughts: The GET error on file names referring to files that don't exist are ugly. 
    // Would rather not show them on the writer page? Try / catch doesn't work here. 
    // What about a fetch request to see if a file exists first? Possible? Or, just leave the errors.

    actOnConfigFieldMusicOnceChange(inEvent) {
        // Trigger change on music, so that it can process if it should loop or not.
        // Not seeing an eInput "change" method to call, so I'm just going to call actOnChange.
        // actOnChange will also treat this as an end user interaction, which is exactly how it should be processed.
        let musicField = this.configFields["music"];
        musicField.setValue(musicField.getValidatedValue(), inEvent.isUserChange);
    }

    actOnConfigFieldMusicChange(inEvent) {
        const theValue = inEvent.configField.getValidatedValue();
        if (theValue != null && theValue != "" && theValue != "stop") {
            // Preview the audio. Fade in / out in sync with StoryPage. Allowing re request (required for processing music_once here).
            const thisTextBlock = app.writerData.getTextBlockById(app.writerData.getLastVisitedNodeId());
            const canLoopMusic = thisTextBlock.music_once != null ? thisTextBlock.music_once != true : true;
            app.audioController.setAudio(app.audioController.getMusicTrackId(), app.writerData.getActiveStoryTitle(), theValue, canLoopMusic, true, app.audioController.longFadeDuration, app.configData.getConfigVal("music_volume"));
        }
        else {
            app.audioController.stopAudio(app.audioController.getMusicTrackId(), app.audioController.longFadeDuration);
        }
    }

    actOnConfigFieldAmbienceChange(inEvent) {
        const theValue = inEvent.configField.getValidatedValue();
        if (theValue != null && theValue != "" && theValue != "stop") {
            // Preview the audio. Fade in / out in sync with StoryPage. Allowing re request for consistency with music field.
            app.audioController.setAudio(app.audioController.getAmbienceTrackId(), app.writerData.getActiveStoryTitle(), theValue, true, true, app.audioController.longFadeDuration, app.configData.getConfigVal("ambience_volume"));
        } 
        else {
            app.audioController.stopAudio(app.audioController.getAmbienceTrackId(), app.audioController.longFadeDuration);
        }
    }

    actOnConfigFieldSoundChange(inEvent) {
        const theValue = inEvent.configField.getValidatedValue();
        if (theValue != null && theValue != "") {
            // Preview the audio. Fade in / out in sync with StoryPage. Allowing re request because it's a sound effect.
            app.audioController.setAudio(app.audioController.getSoundTrackId(), app.writerData.getActiveStoryTitle(), theValue, false, true, app.audioController.shortFadeDuration, app.configData.getConfigVal("sound_effects_volume"));
        }
        else {
            app.audioController.stopAudio(app.audioController.getSoundTrackId(), app.audioController.shortFadeDuration);
        }
    }

    actOnConfigFieldImageChange(inEvent) {
        // I do a little image preview like I do in WriterStoryInfoPanelField.
        const theValue = inEvent.configField.getValidatedValue();
        let theEInputStyle = inEvent.configField.eInput.style;
        if (theValue != null && theValue != "") {
            // Adds a little image preview on the right of the input element background.
            theEInputStyle.backgroundImage = `url('${PathUtils.getStoryImagesPath(app.writerData.getActiveStoryTitle(), theValue)}')`;
            theEInputStyle.backgroundSize = "contain";
            theEInputStyle.backgroundRepeat = "no-repeat";
            theEInputStyle.backgroundPosition = "right";
        }
        else {
            theEInputStyle.backgroundImage = "none";
        }
    }

    actOnWriterDataLastVisitedNodeIdChange() {
        this.loadTextBlockData();
    }
}
