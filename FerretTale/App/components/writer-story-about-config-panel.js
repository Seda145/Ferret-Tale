/*****
** This class makes text block JSON fields editable through ConfigField classes.
** It's used together with WriterPage.
*****/
class WriterStoryAboutConfigPanel {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.configFields = [];

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="writer-story-about-config-panel"]'), nThis.getHTMLTemplate());

        nThis.eConfigPanel = nThis.element.querySelector(".config-panel-side");

        nThis.aboutFieldset = Fieldset.create(nThis.eConfigPanel, "About");

        nThis.configFields.push(ConfigFieldText.create(nThis.aboutFieldset.element, "author", "Author", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "The writer of this story."));
        nThis.configFields.push(ConfigFieldText.create(nThis.aboutFieldset.element, "genre", "Genre", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "The genre of your story. Horror? Fantasy? etc."));
        nThis.configFields.push(ConfigFieldText.create(nThis.aboutFieldset.element, "age", "Age", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "For which ages is this story written?"));
        nThis.configFields.push(ConfigFieldText.create(nThis.aboutFieldset.element, "version", "Version", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "Every time you release an update, you increment the version number in an understandable way."));
        nThis.configFields.push(ConfigFieldText.create(nThis.aboutFieldset.element, "copyright", "Copyright", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "Copyright notice."));
        nThis.configFields.push(ConfigFieldText.create(nThis.aboutFieldset.element, "language", "Language", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "Which language is your story written in?"));
        nThis.configFields.push(ConfigFieldTextarea.create(nThis.aboutFieldset.element, "description", "Description", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "The description of your story."));
        nThis.configFields.push(ConfigFieldText.create(nThis.aboutFieldset.element, "storyCoverImage", "Cover image", ConfigFieldUtils.fAsString, ConfigFieldUtils.vString, "The image on the front of your book."));
        // Sync title and options with how ConfigPage does it for consistency. The field differs! Option "Writer Decides" not here.
        nThis.configFields.push(ConfigFieldSelect.create(nThis.aboutFieldset.element, "readingLayout", "Large screen reading layout",
            [
                { value: "Column", title: "Show text + image on the same row. Uses page width."}, 
                { value: "Column (compact)", title: "Show text + image on the same row. Uses compact width."}, 
                { value: "Row", title: "Show text and image on separate rows. Uses page width."}, 
                { value: "Row (compact text)", title: "Show text and image on separate rows. Uses compact width for text. Uses page width for images."}, 
                { value: "Row (compact)", title: "Show text and image on separate rows. Uses compact width."}
            ],
            "This adjusts the reading layout if not overridden on the Settings page.")
        );
        nThis.configFields.push(ConfigFieldCheckbox.create(nThis.aboutFieldset.element, "showEmptyTextColumn", "Show empty text columns", "Set this to false if you wish to remove empty text columns, instead of making them invisible. This allows an image in column layout to take up all width as if in row layout. Example usage: To add a full width illustration above each new chapter regardless of layout mode."));
        nThis.configFields.push(ConfigFieldCheckbox.create(nThis.aboutFieldset.element, "hideTitleWhileReading", "Hide title while reading", "Set this to true if you want the header showing the title of your story to be hidden while you read the story. This is only recommended if your intention is to replace this text with an image of the title (using the story's first text block)."));

        nThis.loadActiveStory();

        /* Events */

        for (let [fieldKey, fieldVal] of Object.entries(nThis.configFields)) {
            fieldVal.element.addEventListener("user-change", nThis.actOnAnyConfigFieldChange.bind(nThis), { signal: nThis.acEventListener.signal });
        }

        app.writerData.element.addEventListener("set-active-story", nThis.actOnWriterDataSetActiveStory.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("reset-story", nThis.actOnWriterDataResetStory.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.aboutFieldset.prepareRemoval();
        this.aboutFieldset = null;

        for (let fieldX of this.configFields) {
            fieldX.prepareRemoval();
        }
        this.configFields = [];

        this.element.remove();
        this.element = null;
        
        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-story-about-config-panel config-panel">
    <div class="config-panel-side">

    </div>
</div>

        `);
    }

    loadActiveStory() {
        for (let fieldX of this.configFields) {
            fieldX.setValue(app.writerData.getAbout()[fieldX.fieldName], false);
        }
    }

    /* Events */

    actOnAnyConfigFieldChange(inEvent) {
        if (inEvent.isUserChange) {
            app.writerData.getAbout()[inEvent.configField.fieldName] = inEvent.configField.getValidatedValue();
        }
    }

    actOnWriterDataSetActiveStory() {
        this.loadActiveStory();
    }

    actOnWriterDataResetStory() {
        this.loadActiveStory();
    }
}
