/*****
** A content page, that can be injected by PageInjector on demand.
*****/
class WriterPage {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="injected-page"]'), nThis.getHTMLTemplate());

        nThis.eWriterPageWrap = nThis.element.querySelector(".writer-page-wrap");

        // TODO scroll snap on toolbars?
		// Reviewed: I'm not currently adding scroll snap because there is enough space in full-screen mode (and just enough in normal mode), to not get annoyed by the top bar.
		// I think scroll snapping when there's enough space would feel sticky for no reason.
        nThis.eToolbarTop = nThis.element.querySelector(".writer-page-toolbar-top");

        nThis.eToolbarSelectStory = nThis.element.querySelector('[name="select-story"]');
        {
            for (const storyTitle of Object.keys(app.writerData.getStories()).toSorted((a,b) => a.localeCompare(b))) {
                UIUtils.appendInnerHTML(nThis.eToolbarSelectStory, `<option value="${storyTitle}">${storyTitle}</option>`);
            }
            nThis.eToolbarSelectStory.value = app.writerData.getActiveStoryTitle();
        }

        nThis.eToolbarSelectEditMode = nThis.element.querySelector('[name="select-edit-mode"]');

        nThis.eToolbarButtonResetStory = nThis.element.querySelector(".button-reset-story");

        nThis.eToolbarButtonExportStory = nThis.element.querySelector(".button-export-story");
        
        nThis.writerStoryAboutConfigPanel = null;
        
        nThis.writerStoryNodeOverview = null;

        nThis.writerStoryNodeConfigPanel = null;

        nThis.writerStoryInfoConfigPanel = null;

        nThis.writerStoryInfoPanelsConfigPanel = null;

        nThis.actOnToolbarSelectEditModeChange();

        /* Events */

        // If put on nThis.element then it only works when focusing input fields etc.
        // Putting it on window is fine because the writer page is removed by pageInjector when navigating away.
        // So, it's function "CTRL+E == export while writing" remains.
        window.addEventListener("keydown", nThis.actOnKeyDown.bind(nThis), { signal: nThis.acEventListener.signal });

        // nThis.eToolbarTop.addEventListener("click", nThis.actOnToolbarTopClick.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarSelectStory.addEventListener("change", nThis.actOnToolbarSelectStoryChange.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarSelectEditMode.addEventListener("change", nThis.actOnToolbarSelectEditModeChange.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonResetStory.addEventListener("click", nThis.actOnToolbarButtonResetStoryClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonResetStory.addEventListener("keyup", nThis.actOnToolbarButtonResetStoryKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonExportStory.addEventListener("click", nThis.actOnToolbarButtonExportStoryClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonExportStory.addEventListener("keyup", nThis.actOnToolbarButtonExportStoryKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();
		
        this.removeConfigPanels();
		
        this.element.remove();
		this.element = null;
        
        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-page">
    <div class="max-width-wrap">
        <div class="writer-page-wrap">
            <div class="writer-page-toolbar writer-page-toolbar-top">
                <div class="writer-page-toolbar-button-wrap">
                    <div tabindex="0" class="button-type-2 button-reset-story">
                        Reset Story
                    </div> 

                    <div class="writer-page-toolbar-select-wrap">
                        <select class="flex-fill button-type-1" name="select-story"></select>

                        <select value="content" class="button-type-1" name="select-edit-mode">
                            <option value="content">Content</option>
                            <option value="about">About</option>
                            <option value="info">Info</option>
                            <option value="info-panel">Info Panel</option>
                        </select>
                    </div> 

                    <div tabindex="0" class="button-type-2 button-export-story">
                        Export Story
                    </div> 
                </div> 
            </div>    

            <div data-component="writer-story-about-config-panel"></div>

            <div data-component="writer-story-node-overview"></div>
            
            <div data-component="writer-story-node-config-panel"></div>

            <div data-component="writer-story-info-config-panel"></div>

            <div data-component="writer-story-info-panels-config-panel"></div>
        </div>
    </div>
</div>

        `);
    }

    removeConfigPanels() {
        if (this.writerStoryAboutConfigPanel != null) {
            this.writerStoryAboutConfigPanel.prepareRemoval();
            this.writerStoryAboutConfigPanel = null;
        }
        if (this.writerStoryNodeOverview != null) {
            this.writerStoryNodeOverview.prepareRemoval();
            this.writerStoryNodeOverview = null;
        }
        if (this.writerStoryNodeConfigPanel != null) {
            this.writerStoryNodeConfigPanel.prepareRemoval();
            this.writerStoryNodeConfigPanel = null;
        }
        if (this.writerStoryInfoConfigPanel != null) {
            this.writerStoryInfoConfigPanel.prepareRemoval();
            this.writerStoryInfoConfigPanel = null;
        }
        if (this.writerStoryInfoPanelsConfigPanel != null) {
            this.writerStoryInfoPanelsConfigPanel.prepareRemoval();
            this.writerStoryInfoPanelsConfigPanel = null;
        }
    }

    /* Events */

    actOnKeyDown(inEvent) {
        // I want to implement ctrl+e, and avoid the browser's search in URL bar that we have no use for.
        // Of course this only works with this.element in focus.
        // It's just a utility to have keyboard users on the writer page export their active story quickly, without having to press the export button.
        if (inEvent.key == "e" && inEvent.ctrlKey === true) {
            inEvent.preventDefault();
            app.writerData.exportStoryJson();
        }
    }

    // actOnToolbarTopClick() {
        // Currently there is no reason to scroll up past the bar (although app design allows it (added space is not bad)),
        // So I want to scroll top here when interacting with it.
        // this.eToolbarTop.scrollIntoView({ behavior: 'instant' });

        // Update: Commented this whole block because I tried with and without, and can't figure out which I dislike more.
        // I think the scroll jump is annoying on editing modes other than Content (Content doesn't need to scroll currently on 1920x1080).
    // }

    actOnToolbarSelectStoryChange() {
        const storyTitle = this.eToolbarSelectStory.value;
        // Setting the title can help adding readability to short width select elements with a long length story title.
        this.eToolbarSelectStory.title = this.eToolbarSelectStory.value;

        // Instruct writerData.
        if (!app.writerData.hasStory(storyTitle)) {
            // Just calling reset story here for consistency in setup, 
            // even though we found there is no story.
            app.writerData.addStory(storyTitle);
        }
        app.writerData.setActiveStoryTitle(storyTitle);
    }

    actOnToolbarSelectEditModeChange() {
        // Clean up first.

        this.removeConfigPanels();

        // Create new config panels.
        // I finally decided to do this instead of navigating between preserved panels with CSS.
        // Reason is that when I implemented the info panel (after content + about were done and working), 
        // That the info panel could bulk edit info that the WriterStoryNodeConfigPanel had to update to.
        // Instead of adding listener complexity I decided to go for the following:

        const inMode = this.eToolbarSelectEditMode.value;
        if (inMode == "content") {
            this.writerStoryNodeOverview = WriterStoryNodeOverview.create(this.element);
            this.writerStoryNodeConfigPanel = WriterStoryNodeConfigPanel.create(this.element);
        }
        else if (inMode == "about") {
            this.writerStoryAboutConfigPanel = WriterStoryAboutConfigPanel.create(this.element);

        }
        else if (inMode == "info") {
            this.writerStoryInfoConfigPanel = WriterStoryInfoConfigPanel.create(this.element);
        }
        else if (inMode == "info-panel") {
            this.writerStoryInfoPanelsConfigPanel = WriterStoryInfoPanelsConfigPanel.create(this.element);
        }
        else {
            console.error("Invalid edit mode detected: " + inMode)
        }
    }

    actOnToolbarButtonResetStoryClick() {
        const answerToType = "Reset";
        const answer = window.prompt(`This resets all changes you have made to this story. New data will be imported from the userdata folder. If this is what you want, type '${answerToType}' and press OK.`);
        if (answer != answerToType) {
            // Do nothing!
            return;
        }

        app.writerData.resetStory(app.writerData.getActiveStoryTitle());
    }

    actOnToolbarButtonResetStoryKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnToolbarButtonResetStoryClick();
        }
    }

    actOnToolbarButtonExportStoryClick() {
        app.writerData.exportStoryJson();
    }

    actOnToolbarButtonExportStoryKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnToolbarButtonExportStoryClick();
        }
    }
}
