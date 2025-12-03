/*****
** A content page, that can be injected by PageInjector on demand.
*****/
class StoryListPage {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.restartStoryBtnPressTimestamp = 0;
        nThis.restartStoryBtnWasJustPressed = false;

        nThis.currentStoryListEntry = null;
        nThis.indexedStoryKeys = {};
        {
            let i = Object.entries(app.readerData.data.stories).length - 1;
            for (const [storyNameX, storyDataX] of Object.entries(app.readerData.data.stories)) {
                nThis.indexedStoryKeys[i] = storyNameX;
                i--;
            }
        }

        nThis.canNavigate = Object.entries(app.readerData.data.stories).length > 1;

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="injected-page"]'), nThis.getHTMLTemplate());
        nThis.eStoryEntryWrap = nThis.element.querySelector(".story-entry-wrap");

        nThis.eStoryListEntry = nThis.element.querySelector(".story-list-entry");

        nThis.eStoryName = nThis.element.querySelector(".story-name");

        nThis.eStoryDescription = nThis.element.querySelector(".story-description");

        nThis.eStoryExtraInfo = nThis.element.querySelector(".story-extra-info");
        nThis.storyExtraInfoSets = [];

        nThis.eCoverStoryEntryImage = nThis.element.querySelector(".cover-story-entry-image");

        nThis.eBtnNavStoryEntryPrev = nThis.eStoryListEntry.querySelector(".btn-nav-story-entry-prev");
        nThis.contentSeparatorPrev = ContentSeparator.create(nThis.eBtnNavStoryEntryPrev);

        nThis.eBtnNavStoryEntryNext = nThis.eStoryListEntry.querySelector(".btn-nav-story-entry-next");
        nThis.contentSeparatorNext = ContentSeparator.create(nThis.eBtnNavStoryEntryNext);

        nThis.eBtnReadStoryEntry = nThis.eStoryListEntry.querySelector(".btn-read-story-entry");
        nThis.eBtnRestartStoryEntry = nThis.eStoryListEntry.querySelector(".btn-restart-story-entry");
        
        nThis.loadPreferredDefaultEntry();

        /* Events */

        nThis.eBtnReadStoryEntry.addEventListener("click", nThis.actOnBtnReadStoryEntryClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eBtnReadStoryEntry.addEventListener("keyup", nThis.actOnBtnReadStoryEntryKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        // Thoughts: Was wondering about refactoring the bloated event implementation on buttons in general, and eBtnRestartStoryEntry.
        // Currently seems overkill to build button classes or utility and assume default behaviors (press / release / hold etc. bloats again).
        nThis.eBtnRestartStoryEntry.addEventListener("mousedown", nThis.actOnBtnRestartStoryEntryMouseDown.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eBtnRestartStoryEntry.addEventListener("keydown", nThis.actOnBtnRestartStoryEntryKeyDown.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eBtnRestartStoryEntry.addEventListener("mouseup", nThis.actOnBtnRestartStoryEntryMouseUp.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eBtnRestartStoryEntry.addEventListener("keyup", nThis.actOnBtnRestartStoryEntryKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eBtnRestartStoryEntry.addEventListener("mouseleave", nThis.actOnBtnRestartStoryEntryMouseLeave.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eBtnNavStoryEntryPrev.addEventListener("click", nThis.actOnBtnNavStoryEntryPrevClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eBtnNavStoryEntryPrev.addEventListener("keyup", nThis.actOnBtnNavStoryEntryPrevKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eBtnNavStoryEntryNext.addEventListener("click", nThis.actOnBtnNavStoryEntryNextClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eBtnNavStoryEntryNext.addEventListener("keyup", nThis.actOnBtnNavStoryEntryNextKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });
        
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
 
<div class="story-list-page">
    <div class="max-width-wrap">
        <div class="story-entry-wrap">

            <div class="story-list-entry">
                <h1 class="story-name"></h1>

                <div class="story-side-wrap">
                    <div class="story-description-side">
                        <p class="story-description"></p>
                        <div class="story-extra-info">


                        
                        </div>
                    </div>

                    <div class="story-cover-side">
                        <div class="btn-nav-story-entry btn-nav-story-entry-prev" tabindex="0">
                            <div data-component="content-separator"></div>
                        </div>

                        <div class="cover-story-entry-wrap">
                            <div class="cover-story-entry">
                                <img class="cover-story-entry-image" src="">
                            </div>

                            <div class="story-list-entry-button-wrap">
                                <div class="btn-default-story-entry btn-read-story-entry" tabindex="0">
                                    <p></p>
                                </div>
                                <div class="btn-default-story-entry btn-restart-story-entry" tabindex="0">
                                    <p>Restart</p>
                                </div>
                            </div>        
                        </div>
                        
                        <div class="btn-nav-story-entry btn-nav-story-entry-next" tabindex="0">
                            <div data-component="content-separator"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

        `);
    }

    findIndexForStoryName(inStoryName) {
        for (let i = 0; i < Object.entries(this.indexedStoryKeys).length; i++) {
            if (this.indexedStoryKeys[i] == inStoryName) {
                return i;
            }
        }
        return -1;
    }

    loadPreferredDefaultEntry() {
        // Attempt to display the entry for the active story title right away. A "continue" feature.
        let preferredIndex = this.findIndexForStoryName(app.readerData.getActiveStoryTitle());
        if (preferredIndex == -1) {
            // If not possible, load the first entry.
            preferredIndex = 0;
        }
        this.loadEntryForIndex(preferredIndex);
    }

    loadEntryForIndex(inIndex) {
        // Wrap around index to remain within bounds.
        const storyCount = Object.entries(this.indexedStoryKeys).length;
        if (inIndex < 0) {
            inIndex = storyCount - 1;
        }
        else {
            if (inIndex > storyCount - 1) {
                inIndex = 0;
            }
        }

        // Clean up where required.
        for (let infoSetX of this.storyExtraInfoSets) {
            infoSetX.prepareRemoval();
        }
        this.storyExtraInfoSets = [];

        // Update current values to new values.
        this.currentStoryIndex = inIndex;
        this.storyName = this.indexedStoryKeys[this.currentStoryIndex];
        this.storyData = app.readerData.data.stories[this.storyName];

        // Update html template to story data.
        this.eStoryListEntry.classList.toggle("story-list-entry-can-navigate", this.canNavigate);
        this.eStoryName.innerText = this.storyName;
        this.eStoryDescription.innerText = this.storyData.about.description;

        this.storyExtraInfoSets.push(StoryListPageExtraInfoSet.create(this.eStoryExtraInfo, "Author", this.storyData.about.author));
        this.storyExtraInfoSets.push(StoryListPageExtraInfoSet.create(this.eStoryExtraInfo, "Copyright", this.storyData.about.copyright));
        this.storyExtraInfoSets.push(StoryListPageExtraInfoSet.create(this.eStoryExtraInfo, "Language", this.storyData.about.language));
        this.storyExtraInfoSets.push(StoryListPageExtraInfoSet.create(this.eStoryExtraInfo, "Genre", this.storyData.about.genre));
        this.storyExtraInfoSets.push(StoryListPageExtraInfoSet.create(this.eStoryExtraInfo, "Age", this.storyData.about.age));
        this.storyExtraInfoSets.push(StoryListPageExtraInfoSet.create(this.eStoryExtraInfo, "Version", this.storyData.about.version));
        this.storyExtraInfoSets.push(StoryListPageExtraInfoSet.create(this.eStoryExtraInfo, "Layout", this.storyData.about.readingLayout));

        let wordCount = 0;
        for (const [textBlockKey, textBlockVal] of Object.entries(this.storyData.story)) {
            if (textBlockVal.text == null) {
                continue;
            }
            wordCount += textBlockVal.text.split(' ').length;
        }
        this.storyExtraInfoSets.push(StoryListPageExtraInfoSet.create(this.eStoryExtraInfo, "Words", wordCount.toString()));

        this.eCoverStoryEntryImage.src = PathUtils.getStoryImagesPath(this.storyName, this.storyData.about.storyCoverImage);
        const hasThisStoryStarted = app.readerData.hasStoryStartedByStoryTitle(this.storyName);
        this.eBtnReadStoryEntry.innerText = hasThisStoryStarted ? `Continue` : `Read`;
        this.eBtnRestartStoryEntry.classList.toggle("enabled", hasThisStoryStarted);
    }
    
    loadPrevEntry() {
        this.loadEntryForIndex(this.currentStoryIndex - 1);
    }

    loadNextEntry() {
        this.loadEntryForIndex(this.currentStoryIndex + 1);
    }

    /* Events */

    actOnBtnNavStoryEntryPrevClick() {
        this.loadPrevEntry();
    }

    actOnBtnNavStoryEntryPrevKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnBtnNavStoryEntryPrevClick();
        }
    }

    actOnBtnNavStoryEntryNextClick() {
        this.loadNextEntry();
    }

    actOnBtnNavStoryEntryNextKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnBtnNavStoryEntryNextClick();
        }
    }

    actOnBtnReadStoryEntryClick() {
        // I'm setting the active story on userdata here in preparation for the StoryPage and its components, which require a set up story.
        // PageInjector then builds a new instance of StoryPage, which will load in that data.
        // StoryPage or its components will not dynamically respond to swapping stories or such events, this simplifies implementation.
        // We'll always navigate to a new story from StoryListEntry like this.
        app.readerData.setActiveStoryTitle(this.storyName);
        app.navigation.navigateTo(StoryPage);
    }

    actOnBtnReadStoryEntryKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnBtnReadStoryEntryClick();
        }
    }

    actOnBtnRestartStoryEntryMouseDown(inEvent) {
        // TODO, no way to read which mouse button did it? 
        // Read the full issue on the event listener comment.
        this.eBtnRestartStoryEntry.classList.add("pressing");
        this.restartStoryBtnPressTimestamp = inEvent.timeStamp;
        this.restartStoryBtnWasJustPressed = true;
    }
    
    actOnBtnRestartStoryEntryKeyDown(inEvent) {
        if (this.restartStoryBtnWasJustPressed) {
            // Ignore repeated requests. (holding a key will do that).
            return;
        }
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnBtnRestartStoryEntryMouseDown(inEvent);
        }
    }

    actOnBtnRestartStoryEntryMouseUp(inEvent) {
		// TODO (press / hold / release) doesn't work on Chrome mobile screen simulation. But the app isn't made for phones. Does this mean no touchscreen support?
        // TODO, no way to read which mouse button did it?
        // TODO, Found that MouseUp triggers even without prior MouseDown on the same target, so I need ugly this.restartStoryBtnWasJustPressed.
        // Read the full issue on the event listener comment.
        //
        // What I want to do here is trigger a restart if the user held down the button for X time (preventing accidental use).
        // What I could do is just compare time of mouse down to mouse up, then if difference > X time we restart the story.
        // Found that MouseUp triggers even without prior MouseDown on the same target, which needs to be avoided.
        if (!this.restartStoryBtnWasJustPressed) {
            return;
        }

        this.eBtnRestartStoryEntry.classList.remove("pressing");
        this.restartStoryBtnWasJustPressed = false;

        // Keep the value of time required to press down in sync with css transition time of the button.
        if (inEvent.timeStamp - this.restartStoryBtnPressTimestamp > 1000) {
            console.debug("Processing story restart request.");
            // This just injects the default structure as the story's progress.
            app.readerData.resetStoryProgress(this.storyName);
            // And we pretend we start the story for the first time.
            this.actOnBtnReadStoryEntryClick();
        }
        else {
            // console.log("Ignored short story restart request, to avoid accidental click.");
        }
    }

    actOnBtnRestartStoryEntryKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnBtnRestartStoryEntryMouseUp(inEvent);
        }
        else {
            this.actOnBtnRestartStoryEntryMouseLeave();
        }
    }

    actOnBtnRestartStoryEntryMouseLeave() {
        this.eBtnRestartStoryEntry.classList.remove("pressing");
        this.restartStoryBtnWasJustPressed = false;
    }
}
