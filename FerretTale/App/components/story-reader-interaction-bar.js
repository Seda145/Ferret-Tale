/*****
** StoryReaderInteractionBar displays ways to interact with the story to the reader. 
**
** This component expects that Userdata has already activated a story, and will not swap stories while this component is in use.
** The app design favors component recreation over event response complexity.
*****/
class StoryReaderInteractionBar {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.interactionActions = [];

        // Modes: action / info
        nThis.interactionMode = null;

        nThis.infoPanelKey = null;

        nThis.element = nThis.element = UIUtils.replaceElement(inScopeElement.querySelector('[data-component="story-reader-interaction-bar"]'), nThis.getHTMLTemplate());

        nThis.eInnerWrap = nThis.element.querySelector(".story-reader-interaction-bar-inner-wrap");

        nThis.eInteractionModeButton = nThis.element.querySelector(".story-reader-interaction-bar-mode-button");

        let theLayout = app.configData.getConfigVal("pc_reading_layout");
        if (theLayout == "Writer decides") {
            theLayout = app.readerData.getAbout().readingLayout;
        }
        
        if (theLayout == "Column") {
            nThis.element.classList.add("appear-column");
        }
        else if (theLayout == "Column (compact)") {
            nThis.element.classList.add("appear-column-compact");
        }
        else if (theLayout == "Row") {
            nThis.element.classList.add("appear-row");
        }
        else if (theLayout == "Row (compact text)") {
            nThis.element.classList.add("appear-row-compact-text");
        }
        else if (theLayout == "Row (compact)") {
            nThis.element.classList.add("appear-row-compact");
        }
        else {
            console.error("Invalid layout type detected: " + theLayout);
        }

        nThis.interactionIcon = ContentSeparator.create(nThis.element);
        
        nThis.eInteractionContinue = nThis.element.querySelector(".story-reader-interaction-continue");
        
        nThis.eInteractionEnd = nThis.element.querySelector(".story-reader-interaction-end");
        
        nThis.eInteractionActionsWrap = nThis.element.querySelector(".story-reader-interaction-bar-actions-wrap");

        // Immediately process to update state on load.
        // nThis.actOnScrollOrResize();

        nThis.updateInteractionModeButton();

        nThis.updateInteractionMenu();

        // "action" is the default mode in which the reader can progress through the story. This mode is always available.
        nThis.enableInteractionModeAction();

        /* Events */

        // window.addEventListener("scroll", nThis.actOnScrollOrResize.bind(nThis), { signal: nThis.acEventListener.signal });
        // window.addEventListener("resize", nThis.actOnScrollOrResize.bind(nThis), { signal: nThis.acEventListener.signal });
     
        app.readerData.element.addEventListener("pushed-story-text-block-id", nThis.actOnReaderDataPushedStoryTextBlockId.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eInteractionContinue.addEventListener("click", nThis.actOnActionContinueClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eInteractionContinue.addEventListener("keyup", nThis.actOnActionContinueKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eInteractionEnd.addEventListener("click", nThis.actOnActionEndClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eInteractionEnd.addEventListener("keyup", nThis.actOnActionEndKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });
        
        if (nThis.eInteractionModeButton != null) {
            nThis.eInteractionModeButton.addEventListener("click", nThis.actOnInteractionModeButtonClick.bind(nThis), { signal: nThis.acEventListener.signal });
            nThis.eInteractionModeButton.addEventListener("keyup", nThis.actOnInteractionModeButtonKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });
        }

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.unloadInfoPanel();

        this.element.remove();
		this.element = null;

        this.eInnerWrap = null;
        this.eInteractionModeButton = null;
        this.eInteractionContinue = null;
        this.eInteractionEnd = null;
        this.eInteractionActionsWrap = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="story-reader-interaction-bar">
    <div class="story-reader-interaction-bar-top max-width-wrap">
        <div data-component="content-separator"></div>
     
        <div class="story-reader-interaction-single story-reader-interaction-continue" tabindex="0">
            <p>Continue</p>
        </div>       

        <div class="story-reader-interaction-single story-reader-interaction-end" tabindex="0">
            <p>End</p>
        </div>
    </div>

    <div class="story-reader-interaction-bar-inner-wrap max-width-wrap">
        <div class="story-reader-interaction-bar-actions-wrap">
            
        </div>

        <div data-component="story-reader-info-panel"></div>
    </div>

    <div class="story-reader-interaction-bar-mode-button-wrap max-width-wrap">
        <div class="story-reader-interaction-bar-mode-button" tabindex="0"></div>
    </div>
</div>

        `);
    }

    updateInteractionModeButton() {
        // If there aren't any navigatable info panels to show, then hide the button to toggle to info mode.
        // This can be done at any time info changes, because the info panels are not interactive (they don't modify info),
        // So we don't ever get stuck on an info panel while we disable the button.
        this.eInteractionModeButton.classList.toggle("disabled", !app.readerData.isAnyInfoPanelNavigatable());
    }

    clearInteractionMenu() {
        // Remove the multi choice actions from our menu, if any.
        for (let actionX of this.interactionActions) {
            actionX.prepareRemoval();
        }
        this.interactionActions = [];
    }

    updateInteractionMenu() {
        // First clean up if required.
        this.clearInteractionMenu();

        // Check if the user has to make a choice from the menu, or can simply continue.
        // If there are no nextIds, then the end of the story is reached. 
        const nextIds = app.readerData.getNextNavigatableTextBlockIds();
        // If we random continue, we don't want to display a choice menu, just "continue".
        const randomContinue = app.readerData.getTextBlock().rnd_next == true;

        this.element.classList.toggle("end-reached", nextIds.length == 0);
        this.element.classList.toggle("continue-choice", (randomContinue && nextIds.length != 0) || nextIds.length == 1);
        this.element.classList.toggle("multi-choice", !randomContinue && nextIds.length > 1);

        if (!randomContinue && nextIds.length > 1) {
            // Now add the multi choice options to our menu.
            for (let i = 0; i < nextIds.length; i++) {
                this.interactionActions.push(StoryReaderInteractionAction.create(this.eInteractionActionsWrap, i, nextIds[i]));
            }
        }
    }

    enableInteractionModeAction() {
        this.unloadInfoPanel();

        this.interactionMode = "action";
        this.infoPanelKey = null;

        this.element.classList.add("interaction-mode-action");
        this.element.classList.remove("interaction-mode-info");
        if (this.eInteractionModeButton != null) {
            // "r" for "reading". Trying to figure out what looks most understandable to a reader.
            this.eInteractionModeButton.style.backgroundImage = `url('${PathUtils.getAppMediaIconsPath()}icon_r.png')`;
        }

        // console.log(`Enabled interaction mode: "${this.interactionMode}"`);
    }

    enableInteractionModeInfo(inPanelKey) {
        this.unloadInfoPanel();

        this.interactionMode = "info";
        this.infoPanelKey = inPanelKey;

        this.storyReaderInfoPanel = StoryReaderInfoPanel.create(this.element, inPanelKey);
        // Scroll back to top instantly, or a scroll position from another panel will be used.
        this.eInnerWrap.scrollTo({ top: 0, behavior: 'instant' });

        this.element.classList.remove("interaction-mode-action");
        this.element.classList.add("interaction-mode-info");
        if (this.eInteractionModeButton != null) {
            // "i" for "info". Trying to figure out what looks most understandable to a reader.
            // TODO I don't yet have a selection menu or info panel index indicator icon. Should I?
            this.eInteractionModeButton.style.backgroundImage = `url('${PathUtils.getAppMediaIconsPath()}icon_i.png')`;
        }

        // console.log(`Enabled interaction mode: "${this.interactionMode}", panel key: "${this.infoPanelKey}"`);
    }

    unloadInfoPanel() {
        if (this.storyReaderInfoPanel != null) {
            this.storyReaderInfoPanel.prepareRemoval();
            this.storyReaderInfoPanel = null;
        }

        // console.log("Unloaded info panel.");

        // I don't null this.infoPanelKey here, because we need to remember it for when switching interaction mode.
    }

    /* Events */

    // actOnScrollOrResize() {
    //     const eMain = document.querySelector("main");

    //     const bottomOffset = (window.scrollY + window.innerHeight) - (eMain.offsetTop + eMain.offsetHeight);
    //     if (bottomOffset > 0) {
    //         // Store window scroll position + window height, so we get the actual Y px of the bottom of the screen we are looking at.
    //         // Subtract by the Y px of the bottom of eMain (eMain.offsetTop + eMain.offsetHeight) so we get a difference.
    //         // If that value is positive, the bottom of our screen just scrolled past eMain. 
    //         // That value is the bottom offset for our fixed reader interaction bar.
    //         this.element.style.bottom = (bottomOffset).toString() + "px";
    //     }
    //     else {
    //         this.element.style.bottom = "0px";
    //     }

        // Update: I ended up hiding the footer for now on the story page,
        // Because while the sticky behavior worked well, 
        // I got annoyed by it moving up onto the footer unexpectedly when I scrolled down.
        // So for now, just disabling the sticky behavior as well.
    // }

    actOnReaderDataPushedStoryTextBlockId() {
        this.updateInteractionModeButton();
        this.updateInteractionMenu();
    }

    actOnActionContinueClick() {
        const nextIds = app.readerData.getNextNavigatableTextBlockIds();
        const randomContinue = app.readerData.getTextBlock().rnd_next == true;
        if (nextIds.length == 0) {
            // Just ignore the click event. Element should be hidden though.
            return;
        }

        // "Continue" is not the multi choice mode, but we can have random next set true.
        // Random next automatically selects a next of one or more options, and is triggered like "continue".

        if (randomContinue) {
            app.readerData.pushRandomNavigatableNextId();
        }
        else {
            app.readerData.pushStoryTextBlockId(nextIds[0]);
        }
    }

    actOnActionContinueKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnActionContinueClick();
        }
    }

    actOnActionEndClick() {
        app.navigation.navigateTo(StoryListPage);
    }

    actOnActionEndKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnActionEndClick();
        }
    }

    actOnInteractionModeButtonClick() {
        const panelIndexInt = this.interactionMode == "action" ? -1 : parseInt(this.infoPanelKey);
        const maxPanelIndex = Object.keys(app.readerData.getInfoPanels()).length - 1;

        if (maxPanelIndex == -1) {
            // This point should not be reached.
            // I don't want to show the button at all if there is nothing to switch to.
            console.error("Can't switch interaction modes if there are no info panels.");
            return;
        }

        const tryNextIndex = panelIndexInt + 1;
        let nextNavigatableIndex = -1;
        for (let i = tryNextIndex; i <= maxPanelIndex; i++) {
            if (app.readerData.isInfoPanelNavigatable(i)) {
                nextNavigatableIndex = i;
                break;
            }
        }

        if (nextNavigatableIndex == -1) {
            // If there is no next info panel we can view, switch back to action mode.
            this.enableInteractionModeAction();
        }
        else {
            this.enableInteractionModeInfo(nextNavigatableIndex.toString())
        }
    }

    actOnInteractionModeButtonKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnInteractionModeButtonClick();
        }
    }
}