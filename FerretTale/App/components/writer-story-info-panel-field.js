/*****
** 
*****/
class WriterStoryInfoPanelField {
    static create(inScopeElement, inPanelName, inKey) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.descriptionFields = {};

        nThis.panelName = inPanelName;
		
        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.key = inKey;

        nThis.descriptionFields["header"] = ConfigFieldText.create(nThis.element, "header", "Header", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "This is its short title to display to a reader, if you wish to do so. This allows readers to view their progress in the story.");

        nThis.descriptionFields["header_size"] = ConfigFieldSelect.create(nThis.element, "header_size", "Header size",
            [
                { value: "Normal", title: "Normal size. Commonly used as title for individual content blocks. Larger in size than the content description." },
                { value: "Large", title: "Large size. Commonly used for grouping content on this panel, by category." },
                { value: "Extra Large", title: "Extra large size. Commonly used for displaying the title of this panel. Colored, and centered on screen." },
            ],
            "This sets the size of your header text."
        );

        nThis.descriptionFields["description"] = ConfigFieldText.create(nThis.element, "description", "Description", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "This is its description to display to a reader, if you wish to do so. This allows readers to view their progress in the story.");

        nThis.descriptionFields["image"] = ConfigFieldText.create(nThis.element, "image", "Image", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "This is its image to display to a reader, if you wish to do so. This allows readers to view their progress in the story. Enter file name + extension. If you set the image mode to 'column', the image resolution must be 100x100 pixels. In 'Row' mode, its resolution is up to preference. Maximum width does not exceed 1620px on screen, but will scale down (in ratio) to fit screen size.");

        nThis.descriptionFields["image_mode"] = ConfigFieldSelect.create(nThis.element, "image_mode", "Image mode",
            [
                { value: "Column", title: "Small size. Add next to description text while screen is large enough." },
                { value: "Row", title: "Large size. Takes up full available width." },
            ],
            "This sets the layout mode for your image."
        );

        // Keep in sync with WriterStoryNodeConfigPanel. Description altered.
        nThis.descriptionFields["has_info"] = ConfigFieldText.create(nThis.element, "has_info", "Has info", ConfigFieldUtils.fArrayAsString, ConfigFieldUtils.vStringAsArray, "This content only shows when info is present (comma separated).");

        // Keep in sync with WriterStoryNodeConfigPanel. Description altered.
        nThis.descriptionFields["not_info"] = ConfigFieldText.create(nThis.element, "not_info", "Not info", ConfigFieldUtils.fArrayAsString, ConfigFieldUtils.vStringAsArray, "This content only shows when info is absent (comma separated).");

        nThis.indexField = ConfigFieldNumber.create(nThis.element, "index", "Index", 0, null, 1, true, "Content is ordered by index (low to high).");
        nThis.indexField.setValue(nThis.key, false);

        /* Events */

        nThis.descriptionFields["image"].element.addEventListener("user-change", nThis.actOnConfigFieldImageChange.bind(nThis), { signal: nThis.acEventListener.signal });

        for (let [fieldKey, fieldVal] of Object.entries(nThis.descriptionFields)) {
            fieldVal.element.addEventListener("user-change", nThis.actOnInfoDescriptionFieldChange.bind(nThis), { signal: nThis.acEventListener.signal });
        }

        nThis.indexField.element.addEventListener("user-change", nThis.actOnInputIndexChange.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Late Setup */

        // Since descriptions are optional, any description and the container itself can be null. 
        const infoDescriptions = app.writerData.getInfoDescriptionByKey(nThis.panelName, nThis.key);
        for (let [fieldKey, fieldVal] of Object.entries(nThis.descriptionFields)) {
            const data = infoDescriptions != null ? infoDescriptions[fieldKey] : null;
            fieldVal.setValue(data != null ? data : "", false);
        }
        
        {
            // I can set up the select fields in a few ways:
            // 1. setValue("Value", false), not storing the value in JSON, but treating null as the default displayed here elsewhere.
            //  * Risk of inconsistency / error, but doesn't bloat JSON.
            // 2. setValue("Value", true), storing the value in JSON by default, even if we don't ever use it. 
            //  * No risk of inconsistency / error, bloats JSON
            // 3. Dynamically add / delete, depending on if it's relevant (delete "header_size" if there's no "header").
            //  * Added complexity. Hijacks user interaction without notification. Keeps JSON clean.
            //
            // I'm going with 2. Cleanup can be done another moment (when exporting JSON etc.).
            //
            // Note: While the bool on setValue is reserved for marking user interaction (should normally not be used for system setup), 
            // it doesn't lead to side effects here right now.

            let headerSizeField = nThis.descriptionFields["header_size"];
            if (headerSizeField.getValidatedValue() == null) {
                headerSizeField.setValue("Normal", true);
            }

            let imageLayoutField = nThis.descriptionFields["image_mode"];
            if (imageLayoutField.getValidatedValue() == null) {
                imageLayoutField.setValue("Column", true);
            }
        }

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        for (let [fieldKey, fieldVal] of Object.entries(this.descriptionFields)) {
            fieldVal.prepareRemoval();
        }
        this.descriptionFields = {};

        this.indexField.prepareRemoval();
        this.indexField = null;

        this.element.remove();
        this.element = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-story-info-panel-field">
    
</div>

        `);
    }

    /* Events */

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

    actOnInfoDescriptionFieldChange(inEvent) {
        if (!inEvent.isUserChange) {
            // Not relevant.
            return;
        }

        app.writerData.alterInfoDescriptionByKey(this.panelName, this.key, inEvent.configField.fieldName, inEvent.configField.getValidatedValue());
    }

    actOnInputIndexChange(inEvent) {
        if (!inEvent.isUserChange) {
            return;
        }

        app.writerData.moveInfoDescriptionToKey(this.panelName, inEvent.oldValidatedValue, inEvent.configField.getValidatedValue());
    }
}
