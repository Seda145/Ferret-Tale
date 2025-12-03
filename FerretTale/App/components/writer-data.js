/*****
** 
*****/
class WriterData {
    constructor() {
        this.data = null;
    }
	
	static create() {
        /* Setup */

        let nThis = new this();

        nThis.isRemovingStoryTextBlock = false;

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

        // console.log("WriterData received new data:");
        // console.log(this.data);
    }

    getProgress() {
        return this.data.progress;
    }

    getStories() {
        return this.getProgress().stories;
    }
    
    hasStory(inStoryTitle) {
        return this.getStoryByTitle(inStoryTitle) != null;
    }

    addStory(inStoryTitle) {
        if (this.hasStory()) {
            console.log(`Not adding new story. It already exists: ${inStoryTitle}`)
            return;
        }

        let newStoryStruct = WriterDataImporterUtils.GetDefaultProgressStructure();
        // Always work with a copy. I'm currently importing stories from app.readerData.
        const storyData = structuredClone(app.readerData.getStoryByTitle(inStoryTitle));
        newStoryStruct.story = storyData.story;
        newStoryStruct.about = storyData.about;
        newStoryStruct.infoPanels = storyData.infoPanels;
        
        this.getStories()[inStoryTitle] = newStoryStruct != null ? newStoryStruct : {};
    }

    addMissingStories() {
        // I'm currently importing stories from app.readerData.
        for (const titleX of Object.keys(app.readerData.getStories())) {
            if (!this.hasStory(titleX)) {
                this.addStory(titleX);
            }
        }
    }

    removeStory(inStoryTitle) {
        delete this.getStories()[inStoryTitle];
    }

    resetStory(inStoryTitle) {
        this.removeStory(inStoryTitle);
        this.addStory(inStoryTitle)

        const resetStoryEvent = new Event('reset-story', { bubbles: false });
        this.element.dispatchEvent(resetStoryEvent);
    }

    getActiveStoryTitle() {
        return this.getProgress().active_story_title;
    }
    
    setActiveStoryTitle(inStoryTitle) {
        if (this.getStoryByTitle(inStoryTitle) == null) {
            // Just to debug. This point would be broken and should never be reached in release.
            console.error(`The requested story title does not exist: ${inStoryTitle}. Ignoring request.`);
            return;
        }

        this.getProgress().active_story_title = inStoryTitle;
        console.debug(`Activated story title: ${this.getActiveStoryTitle()}`);
        // console.log("Story Progress: ");
        // console.log(this.getStory());

        const setActiveStoryEvent = new Event('set-active-story', { bubbles: false });
        this.element.dispatchEvent(setActiveStoryEvent);
    }

    activateFirstStoryTitle() {
        this.setActiveStoryTitle(Object.keys(this.getStories()).toSorted((a,b) => a.localeCompare(b))[0]);
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

    addInfoPanel() {
        const newKey = Object.keys(this.getInfoPanels()).length.toString();

        let newPanelStruct = {};
        newPanelStruct.name = "New Panel";
        newPanelStruct.infoDescriptions = {};

        this.getInfoPanels()[newKey] = newPanelStruct;

        let addedInfoPanelEvent = new Event('added-info-panel', { bubbles: false });
        addedInfoPanelEvent.newPanelKey = newKey;
        this.element.dispatchEvent(addedInfoPanelEvent);
    }

    deleteInfoPanel(inPanelKey) {
        if (this.getInfoPanel(inPanelKey) == null) {
            console.error(`Can't delete info panel that does not exist, at key: ${inPanelKey}`);
            return;
        }

        const reqAnswerToDelete = "Delete";
        const OutAnswerToDelete = window.prompt(`This action deletes the info panel you are now editing, Name: "${this.getInfoPanel(inPanelKey).name}". If this is what you want, type '${reqAnswerToDelete}' and press OK.`);
        if (reqAnswerToDelete != OutAnswerToDelete) {
            // Don't delete info panel!
            return;
        }

        // Must re key to avoid index gaps. Start at 0 and count up.
        // The deleted panel leaves a gap in numbering,
        // so higher numbers must be pushed down towards the 0.

        const reKeyStart = parseInt(inPanelKey) + 1;
        // Anything currently post the removed key should shift one key towards 0.
        const reKeyEnd = Object.keys(this.getInfoPanels()).length - 1;

        delete this.getInfoPanels()[inPanelKey];

        for (let i = reKeyStart; i <= reKeyEnd; i++) {
            this.getInfoPanels()[i - 1] = this.getInfoPanel(i);
            delete this.getInfoPanels()[i];
        }

        // TODO remove debug test block.
        // for (let i = 0; i < Object.keys(this.getInfoPanels()).length; i++) {
        //     if (this.getInfoPanel(i) == null) {
        //         console.error("Invalid re key detected.");
        //     }
        // }
        // End of debug test block.

        let deletedInfoPanelEvent = new Event('deleted-info-panel', { bubbles: false });
        // By now oldPanelKey can have been re keyed into a new panel. A panel might not exist at all.
        deletedInfoPanelEvent.oldPanelKey = inPanelKey;
        this.element.dispatchEvent(deletedInfoPanelEvent);
    }

    renameInfoPanel(inPanelKey, inPanelName) {
        const oldName = this.getInfoPanel(inPanelKey).name;
        this.getInfoPanel(inPanelKey).name = inPanelName.toString();
        
        let renamedInfoPanelEvent = new Event('renamed-info-panel', { bubbles: false });
        renamedInfoPanelEvent.panelKey = inPanelKey;
        renamedInfoPanelEvent.oldName = oldName;
        renamedInfoPanelEvent.newName = this.getInfoPanel(inPanelKey).name;
        this.element.dispatchEvent(renamedInfoPanelEvent);
    }

    moveInfoPanel(inFromPanelKey, inToPanelKey) {
        // Not a swap operation, but a push.

        if (inFromPanelKey == inToPanelKey) {
            // Nothing to do
            return;
        }

        const fromData = this.getInfoPanel(inFromPanelKey);
        const toData = this.getInfoPanel(inToPanelKey);
        if (fromData == null || toData == null) {
            // console.log(`Can't move info panel from / to a non existent key. inFromPanelKey: "${inFromPanelKey}", inToPanelKey: "${inToPanelKey}"`);

            // This can be a user interaction providing a non existing key through the UI, not a system error. But it could be a system error.
            let moveInfoPanelCancelEvent = new Event('move-info-panel-cancel', { bubbles: false });
            moveInfoPanelCancelEvent.fromPanelKey = inFromPanelKey;
            moveInfoPanelCancelEvent.toPanelKey = inToPanelKey;
            this.element.dispatchEvent(moveInfoPanelCancelEvent);
            return;
        }

        // Verified that we only move existing data (from and to), so no need to validate keys.

        const reKeyStart = parseInt(inFromPanelKey);
        // Deciding direction.
        if (inFromPanelKey < inToPanelKey) {
            for (let i = reKeyStart; i < inToPanelKey; i++) {
                // Shift keys towards reKeyStart, except for keys after toKey.
                delete this.getInfoPanels()[i];
                this.getInfoPanels()[i] = this.getInfoPanel(i + 1);
            }
            // Now toKey gets the fromData.
            this.getInfoPanels()[inToPanelKey] = fromData;
        }
        else {
            for (let i = reKeyStart; i > inToPanelKey; i--) {
                // Shift keys towards reKeyStart, except for keys after toKey.
                delete this.getInfoPanels()[i];
                this.getInfoPanels()[i] = this.getInfoPanel(i - 1);
            }
            // Now toKey gets the fromData.
            this.getInfoPanels()[inToPanelKey] = fromData;
        }

        // TODO remove debug test block.
        // for (let i = 0; i < Object.keys(this.getInfoPanels()).length; i++) {
            // if (this.getInfoPanel(i) == null) {
                // console.error("Invalid re key detected.");
            // }
        // }
        // End of debug test block.

        console.log(`Changed info panel index. inFromPanelKey: "${inFromPanelKey}", inToPanelKey: "${inToPanelKey}"`);

        let movedInfoPanelEvent = new Event('move-info-panel', { bubbles: false });
        movedInfoPanelEvent.fromPanelKey = inFromPanelKey;
        movedInfoPanelEvent.toPanelKey = inToPanelKey;
        this.element.dispatchEvent(movedInfoPanelEvent);
    }

    alterInfoPanelInfoConditions(inPanelKey, inInfoConditionFieldName, inValue) {
        if (!Array.isArray(inValue)) {
            console.error(`Can't alter info panel info conditions with a non array inValue, panel key: ${inPanelKey}`);
            return;
        }

        let newValue = inValue;

        let infoPanel = this.getInfoPanel(inPanelKey);
        if (infoPanel == null) {
            // Just to debug. This point would be broken and should never be reached in release.
            console.error(`Can't alter an info panel that has not been added, panel key: ${inPanelKey}`);
            return;
        }

        if (newValue.length == 0) {
            // Empty / unused values must be deleted.
            // Handling this the same as I do in setStoryTextBlockFieldValue.
            delete infoPanel[inInfoConditionFieldName];
            // console.log(`Removed info panel info conditions field: "${inInfoConditionFieldName}", for panel key: "${inPanelKey}"`);
        }
        else {
            infoPanel[inInfoConditionFieldName] = newValue;
            // console.log(`Updated info panel info conditions field: "${inInfoConditionFieldName}", for panel key: "${inPanelKey}", to value: "${newValue}"`);
        }

        // console.log(this.getInfoPanel(inPanelKey));
    }

    getInfoDescriptions(inPanelKey) {
        return this.getInfoPanel(inPanelKey).infoDescriptions;
    }  
    
    getInfoDescriptionByKey(inPanelKey, inkey) {
        return this.getInfoDescriptions(inPanelKey)[inkey];
    }

    addInfoDescriptionAtKey(inPanelKey, inKey) {
        // Add at key treated as "index", pushing anything already at and post that index further (rekey).

        // value prop from HTML input type number is string, and index has to be a string as key in JSON.
        // It can be confusing when we want to treat index as a number for ordering, 
        // but it's passed around as string all the time.

        if (!MathUtils.isStringInt(inKey)) {
            // Just to debug. This point would be broken and should never be reached in release.
            console.error("inKey is not int.");
            return;
        }
        
        const reqDescriptions = this.getInfoDescriptions(inPanelKey);

        const maxkey = Object.keys(reqDescriptions).length.toString();
        const keyExists = this.getInfoDescriptionByKey(inPanelKey, inKey) != null;

        if (inKey != maxkey && !keyExists) {
            // Just to debug. This point would be broken and should never be reached in release.
            // I want to ensure bad keys are avoided (negatives / gaps).
            // This way we don't need to re key / validate keys later on.
            console.Error(`Prevented key "${inKey}" from being added to panel: "${inPanelKey}". Reason: not pushed to existing index or length index.`);
            return;
        }

        // First I add it to the end of the container, not to replace anything.
        // Currently no structure is added by default, just an empty set.
        this.getInfoDescriptions(inPanelKey)[maxkey] = {};

        // console.log(`Added new info description to temporary key. Panel: "${inPanelKey}", key: "${maxkey}"`);

        // With the above, I can just use the move function to set up the indexes.
        this.moveInfoDescriptionToKey(inPanelKey, maxkey, inKey);
    }

    deleteInfoDescriptionAtKey(inPanelKey, inKey) {
        {
            // First some checks, and optionally ask the user for a confirmation.

            const infoDescriptionToDelete = this.getInfoDescriptionByKey(inPanelKey, inKey);
            if (infoDescriptionToDelete == null) {
                // This should never happen, or there is a system fault.
                console.error(`Attempted to delete info description at key: "${inKey}", that does not exist.`);
                return;
            }

            let foundData = false;
            // Only ask for a deletion confirmation if any data has been added at all.
            // I'm not counting "header_size" and "image_mode" as "data" if nothing else has been added.
            // Reason: To have any reason to exist, they depend on other data ("header", "image").
            for (const keyX of Object.keys(infoDescriptionToDelete)) {
                if (keyX != "header_size" && keyX != "image_mode") {
                    foundData = true;
                    break;
                }
            }

            if (foundData) {
                if (Object.keys(infoDescriptionToDelete).length > 0) {
                    const reqAnswerToDelete = "Delete";
                    // Called "content block" here because "info description field" makes no sense to a writer just using the UI.
                    const OutAnswerToDelete = window.prompt(`This action deletes the content block with index: "${inKey}". If this is what you want, type '${reqAnswerToDelete}' and press OK.`);
                    if (reqAnswerToDelete != OutAnswerToDelete) {
                        // Don't delete content block!
                        return;
                    }
                }
            }
        } 

        // Add at key treated as "index", pushing anything already post that index back (rekey).

        const reKeyStart = parseInt(inKey) + 1;
        // Anything currently post the removed key should shift one key towards 0 to fix counting.
        const reKeyEnd = Object.keys(this.getInfoDescriptions(inPanelKey)).length - 1;

        delete this.getInfoDescriptions(inPanelKey)[inKey];

        for (let i = reKeyStart; i <= reKeyEnd; i++) {
            this.getInfoDescriptions(inPanelKey)[i - 1] = this.getInfoDescriptionByKey(inPanelKey, i);
            delete this.getInfoDescriptions(inPanelKey)[i];
        }

        // TODO remove debug test block.
        // for (let i = 0; i < Object.keys(this.getInfoDescriptions(inPanelKey)).length; i++) {
        //     if (this.getInfoDescriptions(inPanelKey)[i] == null) {
        //         console.error("Invalid re key detected.");
        //     }
        // }
        // End of debug test block.

        // console.log(`Deleted info description key. Panel: "${inPanelKey}", key: "${inKey}"`);

        let infoDescriptionKeysChangedEvent = new Event('info-description-keys-changed', { bubbles: false });
        infoDescriptionKeysChangedEvent.panelKey = inPanelKey;
        infoDescriptionKeysChangedEvent.deletedKey = inKey;
        this.element.dispatchEvent(infoDescriptionKeysChangedEvent);
    }

    moveInfoDescriptionToKey(inPanelKey, inFromkey, inTokey) {
        // Not a swap operation, but a push.

        // if (inFromkey == inTokey) {
        // Just continue with it. I'm currently calling this method on addInfoDescriptionAtKey,
        // Where 0 can be 0 when adding 1 new info description to an empty container.
        // }

        const fromData = this.getInfoDescriptionByKey(inPanelKey, inFromkey);
        const toData = this.getInfoDescriptionByKey(inPanelKey, inTokey);
        if (fromData == null || toData == null) {
            // console.log(`Can't move info description from / to a non existent key. inPanelKey: "${inPanelKey}", inFromkey: "${inFromkey}", inTokey: "${inTokey}"`);

            // This can be a user interaction providing a non existing key through the UI, not a system error. But it could be a system error.
            let infoDescriptionKeysChangeCancelEvent = new Event('info-description-keys-change-cancel', { bubbles: false });
            infoDescriptionKeysChangeCancelEvent.panelKey = inPanelKey;
            infoDescriptionKeysChangeCancelEvent.fromKey = inFromkey;
            infoDescriptionKeysChangeCancelEvent.toKey = inTokey;
            this.element.dispatchEvent(infoDescriptionKeysChangeCancelEvent);
            return;
        }

        // Verified that we only move existing data (from and to), so no need to validate keys.

        const reKeyStart = parseInt(inFromkey);
        // Deciding direction.
        if (inFromkey < inTokey) {
            for (let i = reKeyStart; i < inTokey; i++) {
                // Shift keys towards reKeyStart, except for keys after toKey.
                delete this.getInfoDescriptions(inPanelKey)[i];
                this.getInfoDescriptions(inPanelKey)[i] = this.getInfoDescriptionByKey(inPanelKey, i + 1);
            }
            // Now toKey gets the fromData.
            this.getInfoDescriptions(inPanelKey)[inTokey] = fromData;
        }
        else {
            for (let i = reKeyStart; i > inTokey; i--) {
                // Shift keys towards reKeyStart, except for keys after toKey.
                delete this.getInfoDescriptions(inPanelKey)[i];
                this.getInfoDescriptions(inPanelKey)[i] = this.getInfoDescriptionByKey(inPanelKey, i - 1);
            }
            // Now toKey gets the fromData.
            this.getInfoDescriptions(inPanelKey)[inTokey] = fromData;
        }

        // TODO remove debug test block.
        // for (let i = 0; i < Object.keys(this.getInfoDescriptions(inPanelKey)).length; i++) {
        //     if (this.getInfoDescriptions(inPanelKey)[i] == null) {
        //         console.error("Invalid re key detected.");
        //     }
        // }
        // End of debug test block.

        // console.log(`Moved info description key. Panel: "${inPanelKey}", from key: "${inFromkey}", to key: "${inTokey}"`);

        let infoDescriptionKeysChangedEvent = new Event('info-description-keys-changed', { bubbles: false });
        infoDescriptionKeysChangedEvent.panelKey = inPanelKey;
        infoDescriptionKeysChangedEvent.fromKey = inFromkey;
        infoDescriptionKeysChangedEvent.toKey = inTokey;
        this.element.dispatchEvent(infoDescriptionKeysChangedEvent);
    }

    alterInfoDescriptionByKey(inPanelKey, inkey, inField, inValue) {
        let newValue = inValue;

        let descrObject = this.getInfoDescriptionByKey(inPanelKey, inkey);
        if (descrObject == null) {
            // Just to debug. This point would be broken and should never be reached in release.
            console.error(`Can't alter an info description object that has not been added, key: ${inkey}`);
            return;
        }

        if (newValue == null || newValue == false || newValue == "" || (Array.isArray(newValue) && newValue.length == 0)) {
            // Empty / unused values must be deleted.
            // Handling this the same as I do in setStoryTextBlockFieldValue.
            delete descrObject[inField];
            // console.log(`Removed info description type: "${inField}", for key: "${inkey}"`);

            // Not currently automatically deleting the whole entry here if there is no field left,
            // Management is currently done through WriterStoryInfoPanelsConfigPanel UI.
        }
        else {
            descrObject[inField] = newValue;
            // console.log(`Updated info description type: "${inField}", for key: "${inkey}", to value: "${newValue}"`);
        }

        // console.log(this.getInfoDescriptionByKey(inPanelKey, inkey));
    }

    getTextBlockById(inId) {
        return this.getStory().story[inId];
    }

    getTextBlockFieldValue(inId, inFieldName) {
        const theBlock = this.getTextBlockById(inId);
        return theBlock != null ? theBlock[inFieldName] : null;
    }

    setStoryTextBlockFieldValue(inId, inFieldName, inValue) {
        let newValue = inValue;

        if (newValue == null || newValue == false || newValue == "" || (Array.isArray(newValue) && newValue.length == 0)) {
            // Nulling this for the event broadcast.
            newValue = null;
            // Empty / unused values must be deleted.
            // A line with an such value can be processed as if null (and deleted entirely from JSON).
            delete this.getTextBlockById(inId)[inFieldName];
        }
        else {
            // Else set the new value.
            this.getTextBlockById(inId)[inFieldName] = newValue;
        }

        // console.log(`Field: "${inFieldName}" set value: ${newValue}`);

        let textBlockFieldChangeEvent = new Event('text-block-field-change', { bubbles: false });
        textBlockFieldChangeEvent.textBlockId = inId;
        textBlockFieldChangeEvent.textBlockFieldName = inFieldName;
        textBlockFieldChangeEvent.textBlockFieldValue = newValue;
        this.element.dispatchEvent(textBlockFieldChangeEvent);
    }

    getLastVisitedNodeId() {
        return this.getStory().last_visited_node_id;
    }

    setLastVisitedNodeId(inId) {
        if (!Object.keys(this.getStory().story).includes(inId)) {
            // Just to debug. This point would be broken and should never be reached in release.
            console.error(`Aborting setLastVisitedNodeId as no text block exists with requested ID: ${inId}`)
            return;
        }

        const oldId = this.getLastVisitedNodeId();
        this.getStory().last_visited_node_id = inId;

        // We process this regardless if this.activatedNodeId == inId.
        // Reason: On deletion of a node, the tree is rekeyed and a new node can get the same ID.
        let lastVisitedNodeIdChange = new Event('last-visited-node-id-change', { bubbles: false });
        lastVisitedNodeIdChange.oldId = oldId;
        lastVisitedNodeIdChange.newId = inId;
        this.element.dispatchEvent(lastVisitedNodeIdChange);
    }

    getLastVisitedInfoPanelId() {
        return this.getStory().last_visited_info_panel_id;
    }

    setLastVisitedInfoPanelId(inId) {
        this.getStory().last_visited_info_panel_id = inId;
    }

    insertStoryTextBlock(inAtId) {
        // This method would not be used during a setup process, but during user interaction with the app.
        // This way, a user interaction with writerData could be reflected onto other components.

        // Below I assign a temporary ID, because the tree will be re keyed right after.
        let newId = null;
        let i = 1;
        while (true) {
            let tryId = "__temporary_id__" + i.toString();

            if (this.getTextBlockById(tryId) == null) {
                // Found a new id which isn't in use yet.
                newId = tryId;
                break;
            }
            else {
                // Try again.
                i++;
            }
        }

        // All fields are optional, so I add an empty object instead of a default structure.
        this.getStory().story[newId] = {};

        let atTextBlock = this.getTextBlockById(inAtId);
        if (atTextBlock.next == null) {
            atTextBlock.next = [];
        }
        atTextBlock.next.push(newId);

        const changeMap = this.reKeyStoryTextBlocks();
        const finalId = changeMap[newId];

        let insertedTextBlockEvent = new Event('inserted-text-block', { bubbles: false });
        insertedTextBlockEvent.newId = finalId;
        this.element.dispatchEvent(insertedTextBlockEvent);

        return finalId;
    }

    removeStoryTextBlock(inId) {
        // Refuse to delete the first text block.
        if (inId == "0") {
            console.debug("Can not delete the first text block of the story (ID '0')");
            return;
        }

        const reqAnswerToDelete = "Delete";
        const OutAnswerToDelete = window.prompt(`This action deletes the text block you are now editing, ID: "${inId}". If this is what you want, type '${reqAnswerToDelete}' and press OK.`);
        if (reqAnswerToDelete != OutAnswerToDelete) {
            // Don't delete text block!
            return;
        }

        this.isRemovingStoryTextBlock = true;

        // Delete the text block.
        delete this.getStory().story[inId];

        // Delete references to the text block.
        for (let [textBlockKey, textBlockVal] of Object.entries(this.getStory().story)) {
            if (textBlockVal.next != null) {
                // Remove the "next" ids referring to the ID we remove.
                // Note that listeners to "text-block-field-change" can read traces of the next ids until this loop is complete.
				this.setStoryTextBlockFieldValue(textBlockKey, "next", textBlockVal.next.filter(function (inVal) { return inVal != inId; }));
            }
        }

        // Re key all text blocks.
        this.reKeyStoryTextBlocks();

        this.isRemovingStoryTextBlock = false;

        let removedTextBlockEvent = new Event('removed-text-block', { bubbles: false });
        removedTextBlockEvent.removedId = inId;
        this.element.dispatchEvent(removedTextBlockEvent);
    }

    reKeyStoryTextBlocks() {
        // Design note: Originally I developed an ID scheme for text blocks, 
        // in which the ID is a string that indicates both progress depth and branch depth.
        // This made IDs easier to follow when looking at story.json in a text editor.
        // The format was as follows:
        // "70" continues to "71" and branches as "70.1". "70.1" would branch as "70.1.1".
        // 70.1.1 could merge back into 74, etc.
        // When you visualize this in your mind, the story looks like a tree:
        // 70  71      72      73
        //     70.1    70.2
        //             70.1.1
        // In game development I have seen similar formats work, when developers had to work with text editors.
        // 
        // I no longer use this scheme. IDs don't indicate anything now. 
        //
        // Reason: the in-app writer mode is the preferred mode for editing.
        // Writer mode automatically keys text blocks and visualizes the story as line connected nodes, making a text scheme pointless.
        // IDs are just available numbers in this version. Meaning ID 34 can progress to 38 or 45 in one step.
        // IDs are re keyed to avoid missing numbers, but there is no further formatting currently.
        //
        // TODO, Thought: It might be an idea to walk the tree branches one by one, sort branches by length, then increment the IDs for all their nodes?
        // Possibly that improves how step size displays on some paths: 1, 45, 3 > 1, 2, 3.

        let idChangeMap = {};
        let i = 0;
        for (const textBlockKey of Object.keys(this.getStory().story)) {
            idChangeMap[textBlockKey] = i.toString();
            i++;
        }

        let newStory = {};
        for (const [keyX, newKeyX] of Object.entries(idChangeMap)) {
            let theTextBlock = this.getStory().story[keyX];

            if (theTextBlock.next != null) {
                let newNextIds = [];
                for (const nextX of theTextBlock.next) {
                    newNextIds.push(idChangeMap[nextX]);
                }
                theTextBlock.next = newNextIds;
            }

            newStory[newKeyX] = theTextBlock;
        }

        // console.log("Pre rekey story:");
        // console.log(this.getStory().story);

        this.getStory().story = newStory;

        // console.log("Rekeyed story:");
        // console.log(this.getStory().story);

        return idChangeMap;
    }

    findTextBlockTreeStartIds() {
        // Normally this is only id "0", the actual start of the story.
        // There can be more ids if branches are separated from the tree.
        const treeStarts = ["0"];
        const found = [];
        const foundRefs = [];
        for (const [textBlockKey, textBlockVal] of Object.entries(this.getStory().story)) {
            // This key is unique.
            found.push(textBlockKey);
            if (textBlockVal.next == null) {
                continue;
            }
            for (const nextX of textBlockVal.next) {
                // Add unique.
                if (foundRefs.includes(nextX)) {
                    continue;
                }
                foundRefs.push(nextX);
            }
        }

        for (const nodeX of found) {
            if (nodeX == "0") {
                continue;
            }
            if (!foundRefs.includes(nodeX)) {
                treeStarts.push(nodeX);
            }
        }

        // console.log("Tree start ids:");
        // console.log(treeStarts);
        return treeStarts;
    }

    optimizeJSON() {
        // Most cleaning is already in place while JSON is edited (key deletion etc.),
        // But once the user is done editing, I want to check for other irrelevant data and delete it.
        //
        // I don't delete some right away while the user is editing, 
        // because I want to avoid hijacking user interactions and avoid adding code complexity for something this simple.
        //
        // In case of "header_size", someone might have left a value in there using the HTML select element,
        // without filling in the "header" field (there'd be a size for no header).
        // The benefit of deleting those values is that the JSON doesn't bloat with values that can't be deleted from the UI.
        // The user is not expected to ever miss those values, and the app is not expected to use them (with that null other field).
        //
        // Example: See comment where I set default value for field "header_size" in WriterStoryInfoPanelField.create().
        
        // console.log("Optimizing WriterData JSON.");

        for (let [panelKey, panelValue] of Object.entries(this.getInfoPanels())) {
            for (let [descKey, descVal] of Object.entries(panelValue.infoDescriptions)) {
                if (descVal.header == null) {
                    // header_size only makes sense to store if "header" is not null.
                    delete descVal.header_size;
                }
                if (descVal.image == null) {
                    // image_mode only makes sense to store if "image" is not null.
                    delete descVal.image_mode;
                }
            }
        }

        // I'm wondering when cleaning is too much. I could delete empty "info panels" (info panel edit mode) from JSON,
        // but then I'm deleting user made "content".
        // I could only "optimize this away" for reader mode, BUT, 
        // then the data would be lost if you re import the story through the Reset button on WriterPage.
        // Not implementing such things for those reasons. Can't always turn bad input into good output.
    }

    exportStoryJson() {
        // First finalize editing, if required.
        UIUtils.resetFocus();

        this.optimizeJSON();

        let newJSON = structuredClone(this.getStories()[this.getActiveStoryTitle()]);
        // Removing fields on clone that are not of use to reader mode:
        delete newJSON.last_visited_node_id;
        delete newJSON.last_visited_info_panel_id;

        DownloadUtils.downloadJson(newJSON, "story.json");

        if (app.configData.getConfigVal("save_file_download_reminder")) {
            alert("Look if story.json just arrived at your downloads folder!\r\nstory.json is your written story, exported.\r\n\r\nMove it into '/*your story*/text/' folder,\r\noverwriting the old story.json.\r\n\r\nIt will be loaded next time you load the userdata folder.");
            alert("Don't forget to click the save button to save your progress! Exporting story.json does not save your progress.");
        }
    }

    collectUniqueInfo() {
        let uniqueInfo = [];

        const addUnique = function (inArray, InDBGSource) {
            if (inArray != null) {
                for (const infoX of inArray) {
                    if (!uniqueInfo.includes(infoX)) {
                        // console.log(`Collected unique info: "${infoX}" in: "${InDBGSource}"`);
                        uniqueInfo.push(infoX);
                    }
                }
            }
        }

        for (const [textBlockKey, textBlockVal] of Object.entries(this.getStory().story)) {
            addUnique(textBlockVal.has_info, "Content");
            addUnique(textBlockVal.not_info, "Content");
            addUnique(textBlockVal.add_info, "Content");
            addUnique(textBlockVal.rem_info, "Content");
        }

        for (const [panelKey, panelVal] of Object.entries(this.getInfoPanels())) {
            addUnique(panelVal.has_info, "Info Panel");
            addUnique(panelVal.not_info, "Info Panel");

            for (const [descKey, descVal] of Object.entries(panelVal.infoDescriptions)) {
                addUnique(descVal.has_info, "Info Panel Info Description");
                addUnique(descVal.not_info, "Info Panel Info Description");
            }
        }

        return uniqueInfo;
    }

    bulkEditInfo(inOldInfo, inNewInfo) {
        // Bulk rename / merge / delete info on the story.
        // Note that listeners to "text-block-field-change" can read traces of old state info until this loop is complete.

        const cancelBulkEditInfoEvent = new Event('cancel-bulk-edit-info', { bubbles: false });

        const uniqueInfo = this.collectUniqueInfo();

        if (inOldInfo == null || inNewInfo == null) {
            // Just to debug. This point would be broken and should never be reached in release.
            console.error("Attempted user change to edit an info config field, but inOldInfo or inNewInfo == null");
            return;
        }

        if (uniqueInfo.length == 0) {
            // Just to debug. This point would be broken and should never be reached in release.
            console.error("Error: Attempted to edit an info config field, but no info has been collected.");
            return;
        }

        // Because we're expecting string. TODO isString check?
        const oldInfoStr = inOldInfo.toString();
        const newInfoStr = inNewInfo.toString();

        if (oldInfoStr == newInfoStr) {
            // At this point it's expected both oldInfo and newInfo are a string type.
            // Nothing changed, or the validator ended up with the same thing after a change.
            return;
        }

        if (!uniqueInfo.includes(oldInfoStr)) {
            // Just to debug. This point would be broken and should never be reached in release.
            console.error(`Attempted to edit info through config field, but the info was not found: ${oldInfoStr}`);
            return;
        }

        // If someone changed the info, this means we want to change the old info into the new info through the entire story.
        // This can also mean one info merges with another (deduplicate).
        // It can also mean info is removed (empty)
        const isDeletion = newInfoStr == "";
        const isMerge = uniqueInfo.includes(newInfoStr);

        if (isDeletion) {
            const reqAnswerToDelete = "Delete";
            const OutAnswerToDelete = window.prompt(`This action deletes the info "${oldInfoStr}". If this is what you want, type '${reqAnswerToDelete}' and press OK.`);
            if (reqAnswerToDelete != OutAnswerToDelete) {
                // Don't alter info!
                this.element.dispatchEvent(cancelBulkEditInfoEvent);
                return;
            }
        }
        else if (isMerge) {
            const reqAnswerToMerge = "Merge";
            const outAnswerToMerge = window.prompt(`This action merges the info "${oldInfoStr}" with info "${newInfoStr}". If this is what you want, type '${reqAnswerToMerge}' and press OK.`);
            if (reqAnswerToMerge != outAnswerToMerge) {
                // Don't alter info!
                this.element.dispatchEvent(cancelBulkEditInfoEvent);
                return;
            }
        }
        else {
            // Else it's just a rename. I'd still like to ask for confirmation.
            const reqAnswerToRename = "Rename";
            const outAnswerToRename = window.prompt(`This action renames the info "${oldInfoStr}" to "${newInfoStr}". If this is what you want, type '${reqAnswerToRename}' and press OK.`);
            if (reqAnswerToRename != outAnswerToRename) {
                // Don't alter info!
                this.element.dispatchEvent(cancelBulkEditInfoEvent);
                return;
            }
        }

        // If this point is reached the user has answered the alert to continue.

        if (isDeletion) {
            console.debug(`Removing info: "${oldInfoStr}"`);
        }
        else {
            // Else it's either a merge or just a modification.
            console.debug(`Replacing info: "${oldInfoStr}" with info: "${newInfoStr}"`);            
        }

        const alterContentInfo = function (inThis, inId, inFieldName) {
            let infoArray = inThis.getTextBlockFieldValue(inId, inFieldName);
            if (infoArray == null || !infoArray.includes(oldInfoStr)) {
                // No original data to modify.
                return;
            }

            // Remove both old and new value (clean, and deduplicate up front).
            infoArray = infoArray.filter(function (inValX) { return inValX != oldInfoStr && inValX != newInfoStr; });
            if (!isDeletion) {
                infoArray.push(newInfoStr);
            }

            inThis.setStoryTextBlockFieldValue(inId, inFieldName, infoArray);
        }

        for (let textBlockKey of Object.keys(this.getStory().story)) {
            alterContentInfo(this, textBlockKey, "has_info");
            alterContentInfo(this, textBlockKey, "not_info");
            alterContentInfo(this, textBlockKey, "add_info");
            alterContentInfo(this, textBlockKey, "rem_info");
        }

        const alterInfoPanelInfo = function (inObj, inFieldName) {
            let infoArray = inObj[inFieldName];
            if (infoArray == null || !infoArray.includes(oldInfoStr)) {
                // No original data to modify.
                return;
            }

            // Remove both old and new value (clean, and deduplicate up front).
            infoArray = infoArray.filter(function (inValX) { return inValX != oldInfoStr && inValX != newInfoStr; });
            if (!isDeletion) {
                infoArray.push(newInfoStr);
            }

            inObj[inFieldName] = infoArray;
        }

        for (const [panelKey, panelVal] of Object.entries(this.getInfoPanels())) {
			alterInfoPanelInfo(panelVal, "has_info");
			alterInfoPanelInfo(panelVal, "not_info");
			
            for (const [descKey, descVal] of Object.entries(panelVal.infoDescriptions)) {
                alterInfoPanelInfo(descVal, "has_info");
                alterInfoPanelInfo(descVal, "not_info");
            }
        }

        let bulkEditedInfoEvent = new Event('bulk-edited-info', { bubbles: false });
        bulkEditedInfoEvent.oldInfo = oldInfoStr;
        bulkEditedInfoEvent.newInfo = newInfoStr;
        this.element.dispatchEvent(bulkEditedInfoEvent);
    }
}