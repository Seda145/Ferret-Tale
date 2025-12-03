/*****
** 
*****/
class StoryReaderInfoPanel {
    static create(inScopeElement, inPanelKey) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.element = nThis.element = UIUtils.appendInnerHTML(inScopeElement.querySelector('[data-component="story-reader-info-panel"]'), nThis.getHTMLTemplate());

        nThis.panelKey = null;

        nThis.infos = [];

        nThis.loadContent(inPanelKey);

        /* Events */

        app.readerData.element.addEventListener("pushed-story-text-block-id", nThis.actOnReaderDataPushedStoryTextBlockId.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.unloadContent();

        this.element.remove();
        this.element = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
		return (`<div class="story-reader-info-panel"></div>`);
    }

    unloadContent() {
        this.panelKey = null;

        for (let infoX of this.infos) {
            infoX.prepareRemoval();
        }
        this.infos = [];
    }

    loadContent(inPanelKey) {
        // Clean first

        this.unloadContent();

        // Add new 

        this.panelKey = inPanelKey;

        for (const [descKey, descVal] of Object.entries(app.readerData.getInfoDescriptions(this.panelKey))) {
            if (descVal.has_info != null) {
                let infoConditionMet = true;
                for (const infoX of descVal.has_info) {
                    if (!app.readerData.hasInfo(infoX)) {
                        infoConditionMet = false;
                        // Info conditions not met. No need to check further.
                        break;
                    }
                }
                if (!infoConditionMet) {
                    // Info conditions not met. Can't proceed to creation.
                    continue;
                }
            }
            if (descVal.not_info != null) {
                let infoConditionMet = true;
                for (const infoX of descVal.not_info) {
                    if (app.readerData.hasInfo(infoX)) {
                        infoConditionMet = false;
                        // Info conditions not met. No need to check further.
                        break;
                    }
                }
                if (!infoConditionMet) {
                    // Info conditions not met. Can't proceed to creation.
                    continue;
                }
            }

            // If info conditions are met, or if no info conditions exist, proceed to creation.

            this.infos.push(StoryReaderInfoPanelInfo.create(this.element, descVal));
        }
    }

    updateContent() {
        if (this.panelKey != null) {
            this.loadContent(this.panelKey);
        }
    }

    /* Events */

    actOnReaderDataPushedStoryTextBlockId() {
        this.updateContent();
    }
}