/*****
** 
*****/
class ReaderData {
    constructor() {
        this.data = null;
    }
	
	static create() {
        /* Setup */

        let nThis = new this();

        nThis.element = document.createElement("div");

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.element.remove();
        this.element = null;
        
        // console.log("Prepared removal of self");
    }

    setData(inData) {
        // Look at UserdataPorter.exportProgressJson for a struct overview.
        this.data = inData;

        // console.log("ReaderData received new data:");
        // console.log(this.data);
    }

    // Story data

    getStories() {
        return this.data.stories;
    }

    getStoryByTitle(inTitle) {
        return this.getStories()[inTitle];
    }

    getStory() {
        return this.getStoryByTitle(this.getActiveStoryTitle());
    }

    getAbout() {
        return this.getStory().about;
    }
	
	getInfoPanels() {
        return this.getStory().infoPanels;
    }  

    getInfoPanel(inPanelKey) {
        return this.getInfoPanels()[inPanelKey];
    }  

    isInfoPanelNavigatable(inPanelKey) {
        const infoPanel = this.getInfoPanel(inPanelKey);

        if (infoPanel.has_info != null) {
            for (const infoX of infoPanel.has_info) {
                if (!this.hasInfo(infoX)) {
                    // Info conditions not met. No need to check further.
                    return false;
                }
            }
        }
        if (infoPanel.not_info != null) {
            for (const infoX of infoPanel.not_info) {
                if (this.hasInfo(infoX)) {
                    // Info conditions not met. No need to check further.
                    return false;
                }
            }
        }

        return true;
    }  

    isAnyInfoPanelNavigatable() {
        for (const panelKey of Object.keys(this.getInfoPanels())) {
            if (this.isInfoPanelNavigatable(panelKey)) {
                return true;
            }
        }
        
        return false;
    }  

    getInfoDescriptions() {
        return this.getStory().infoDescriptions;
    }  

    getInfoDescriptions(inPanelKey) {
        return this.getInfoPanel(inPanelKey).infoDescriptions;
    }  
    
    getInfoDescriptionByIndex(inPanelKey, inIndexString) {
        return this.getInfoDescriptions(inPanelKey)[inIndexString];
    }
	
	// getPresentableInfoDescriptions () {}

    getTextBlockById(inId) {
        return this.getStory().story[inId];
    }

    getTextBlock() {
        return this.getTextBlockById(this.getTextBlockId());
    }

    // Progress data

    resetStoryProgress(inStoryTitle) {
        // Added in this method to make story progress restartable from StoryListPage.
        this.data.progress.stories[inStoryTitle] = ReaderDataImporterUtils.GetDefaultProgressStructure();
    }
    
    getActiveStoryTitle() {
        return this.getProgress().active_story_title;
    }

    setActiveStoryTitle(inStoryTitle) {
        if (this.getStoryByTitle(inStoryTitle) == null) {
            console.debug(`The requested story title does not exist: ${inStoryTitle}. Ignoring request.`);
            return;
        }

        this.getProgress().active_story_title = inStoryTitle;
        console.debug(`Activated story title: ${this.getActiveStoryTitle()}`);
        // console.log("Story: ");
        // console.log(this.getStory());
        // console.log("Story Progress: ");
        // console.log(this.getStoryProgress());

        if (!this.hasStoryStarted()) {
            // Process the first index of the story. This makes our text block path related getters valid.
            this.startStory();
        }
    }

    getProgress() {
        return this.data.progress;
    }

    getStoryProgress() {
        return this.getProgress().stories[this.getActiveStoryTitle()];
    }

    getTextBlockPath() {
        // Get the full text block id reference path that we walked from start of the story to the current text block (including).
        return this.getStoryProgress().text_block_path;
    }

    hasStoryStarted() {
        return this.getTextBlockPath().length > 0;
    }

    hasStoryStartedByStoryTitle(inStoryTitle) {
        // Added in this method for StoryListPage, so it can decide to show the restart button or not.
        return this.getProgress().stories[inStoryTitle].text_block_path.length > 0;
    }

    startStory() {
        if (this.hasStoryStarted()) {
            console.error("attempted to start a story that has already started.");
            return;
        }

        this.pushStoryTextBlockId("0");
    }

    getTextBlockId() {
        // Get the id of the text block we are currently at. This is the last entry within this.getTextBlockPath.
        if (this.getTextBlockPath().length == 0) {
            console.error("attempted to getTextBlockId on a story that has not started.");
            return null;
        }
        return this.getTextBlockPath()[this.getTextBlockPath().length - 1];
    }

    pushStoryTextBlockId(inId) {
        if (!this.hasStoryStarted()) {
            if (inId != 0) {
                console.error(`Attempted to navigate to the first index, but it's not '0': ${inId}`);
                return;
            }
        }
        else {
            if (!this.getNextNavigatableTextBlockIds().includes(inId)) {
                // If this point is hit, either userdata or my code isn't right.
                // console.error(`Navigating from text id: ${this.getTextBlockId()}, to: ${inId}, is not valid.`);
                alert(`Error: Navigating from text id: ${this.getTextBlockId()}, to: ${inId}, is not valid.`);
                return;
            }
        }

        this.getTextBlockPath().push(inId);

        // Update infos.
        const infoToAdd = this.getTextBlockById(inId).add_info;
        const infoToRemove = this.getTextBlockById(inId).rem_info;
        if (infoToAdd != null) {
            for (const infoX of infoToAdd) {
                this.addInfo(infoX);
            }
        }
        if (infoToRemove != null) {
            for (const infoX of infoToRemove) {
                this.removeInfo(infoX);
            }
        }

        // Finally broadcast that we finalized pushing the id.
        const pushedStoryTextBlockIdEvent = new Event('pushed-story-text-block-id', { bubbles: false });
        this.element.dispatchEvent(pushedStoryTextBlockIdEvent);
    }

    pushRandomNavigatableNextId() {
        const navigatableIds = this.getNextNavigatableTextBlockIds();
        if (navigatableIds.length == 0) {
            // This point should not be reached, or there is a system error.
            console.error("There is no navigatable ID to push");
            return;
        }
        this.pushStoryTextBlockId(navigatableIds[Math.floor(Math.random() * navigatableIds.length)]);
    }

    getInfo() {
        return this.getStoryProgress().info;
    }

    hasInfo(inInfo) {
        return this.getInfo().includes(inInfo);
    }

    addInfo(inInfo) {
        if (this.getInfo().includes(inInfo)) {
            console.debug(`Skipped adding info, because it's present: ${inInfo}`);
            return;
        }

        this.getInfo().push(inInfo);
        console.debug(`Id: ${this.getTextBlockId()}: Added info: ${inInfo}`);
    }

    removeInfo(inInfo) {
        // Note to self: "delete" does not work as intended on array entries, as it does on objects.
        this.getStoryProgress().info = this.getStoryProgress().info.filter(function (inVal) { return inVal != inInfo; })
        console.debug(`Id: ${this.getTextBlockId()}: Removed info: ${inInfo}`);
    }

    // Get what text blocks are referenced in "next" of the current text block.
    getNextTextBlockIds() {
        const textBlockX = this.getTextBlockById(this.getTextBlockId());
        if (textBlockX == null) {
            console.error(`No story text block found for Id: ${this.getTextBlockId()}`);
            return;
        }

        return textBlockX.next != null ? textBlockX.next : [];
    }

    // Get what text blocks are referenced in "next" of the current text block, that we can actually navigate to based on "info" conditions.
    getNextNavigatableTextBlockIds() {
        const unfilteredIds = this.getNextTextBlockIds();
        let filteredIds = [];

        for (const idX of unfilteredIds) {
            const textBlockX = this.getTextBlockById(idX);
            if (textBlockX == null) {
                console.error(`textblock with id does not exist: ${idX}`);
                continue;
            }
            let metInfoRequirements = true;

            if (textBlockX.has_info != null) {
                for (const infoX of textBlockX.has_info) {
                    if (!this.hasInfo(infoX)) {
                        metInfoRequirements = false;
                        break;
                    }
                }
            }
            if (metInfoRequirements && textBlockX.not_info != null) {
                for (const infoX of textBlockX.not_info) {
                    if (this.hasInfo(infoX)) {
                        metInfoRequirements = false;
                        break;
                    }
                }
            }

            if (metInfoRequirements) {
                filteredIds.push(idX);
            }
        }

        return filteredIds;
    }
}