/*****
** This class visualizes the story as a tree of connected nodes (representing text blocks).
** It's used together with WriterPage.
*****/
class WriterStoryNodeOverview {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        // I tested storing this as props on WriterData.getStory(),
        // to avoid having the panel reset to defaults on reconstruction,
        // But realized there are no benefits (since we'd also have to store a non constant scroll position and whatnot). 
        nThis.autoScroll = true;
        nThis.zoomLevel = 3;
        
        nThis.storyNodes = {};

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="writer-story-node-overview"]'), nThis.getHTMLTemplate());

        nThis.eCanvas = nThis.element.querySelector(".writer-page-canvas");
        nThis.canvas = nThis.eCanvas.getContext("2d");

        nThis.eWriterStoryTitle = nThis.element.querySelector(".writer-story-title");
        
        nThis.eWriterStoryNodeCanvasWrap = nThis.element.querySelector(".writer-story-node-canvas-wrap");

        nThis.eWriterStoryNodeWrap = nThis.element.querySelector(".writer-story-node-wrap");

        nThis.eToolbarGoToSpan = nThis.element.querySelector(".writer-page-toolbar-go-to-span");
        nThis.eToolbarGoToSpan.title = "You can enter a text block ID to quickly navigate to it."

        nThis.eToolbarButtonGoToInput = nThis.element.querySelector('[name="writer-page-toolbar-button-go-to-input"]');

        nThis.eToolbarButtonAutoScrollInput = nThis.element.querySelector('[name="writer-page-toolbar-button-autoscroll-input"]');

        nThis.eToolbarButtonZoomIn = nThis.element.querySelector(".writer-page-toolbar-button-zoom-in");

        nThis.eToolbarButtonZoomOut = nThis.element.querySelector(".writer-page-toolbar-button-zoom-out");

        nThis.eToolbarButtonAddBlock = nThis.element.querySelector(".writer-page-toolbar-button-add-block");

        nThis.eToolbarButtonRemoveBlock = nThis.element.querySelector(".writer-page-toolbar-button-remove-block");
     
        /* Events */

        window.addEventListener("resize", nThis.actOnResize.bind(nThis), { signal: nThis.acEventListener.signal });

        app.writerData.element.addEventListener("text-block-field-change", nThis.actOnWriterDataTextBlockFieldChange.bind(nThis), { signal: nThis.acEventListener.signal });

        app.writerData.element.addEventListener("inserted-text-block", nThis.actOnWriterDataInsertedTextBlock.bind(nThis), { signal: nThis.acEventListener.signal });

        app.writerData.element.addEventListener("removed-text-block", nThis.actOnWriterDataRemovedTextBlock.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonGoToInput.addEventListener("change", nThis.actOnToolbarButtonGoToChange.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonAutoScrollInput.addEventListener("change", nThis.actOnToolbarButtonAutoScrollChange.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonAutoScrollInput.addEventListener("keyup", nThis.actOnToolbarButtonAutoScrollKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonZoomIn.addEventListener("click", nThis.actOnToolbarButtonZoomInClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonZoomIn.addEventListener("keyup", nThis.actOnToolbarButtonZoomInKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonZoomOut.addEventListener("click", nThis.actOnToolbarButtonZoomOutClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonZoomOut.addEventListener("keyup", nThis.actOnToolbarButtonZoomOutKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonAddBlock.addEventListener("click", nThis.actOnToolbarButtonAddBlockClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonAddBlock.addEventListener("keyup", nThis.actOnToolbarButtonAddBlockKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eToolbarButtonRemoveBlock.addEventListener("click", nThis.actOnToolbarButtonRemoveBlockClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eToolbarButtonRemoveBlock.addEventListener("keyup", nThis.actOnToolbarButtonRemoveBlockKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        app.writerData.element.addEventListener("set-active-story", nThis.actOnWriterDataSetActiveStory.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("reset-story", nThis.actOnWriterDataResetStory.bind(nThis), { signal: nThis.acEventListener.signal });
        app.writerData.element.addEventListener("last-visited-node-id-change", nThis.actOnWriterDataLastVisitedNodeIdChange.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Late setup */

        // Decided to place the following after setting up listeners,
        // So that most is finished in one line, using actual events.
        //
        // Method activates a node id on WriterData, 
        // proceeding to actOnWriterDataLastVisitedNodeIdChange listener, 
        // which sets up more data on this panel.
        // Methods chain like that so other setup like setting zoom level, updating canvas, building nodes etc. etc. is done now.
        nThis.actOnWriterDataSetActiveStory();
        // Only this still has to be done. Requires an active node, so it's down here.
        // State is currently shared across stories (just like zoom level), so it's not on actOnWriterDataSetActiveStory.
        nThis.setAutoScroll(nThis.eToolbarButtonAutoScrollInput.checked);

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();
        
        this.removeNodes();

        this.element.remove();
		this.element = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="writer-story-node-overview">
    <div class="writer-page-toolbar writer-page-toolbar-alt-2">
        <div class="writer-page-toolbar-button-wrap">
            <span class="writer-page-toolbar-go-to-span">Go to:</span>
            <input type="text" class="writer-page-toolbar-button" name="writer-page-toolbar-button-go-to-input">

            <div class="flex-fill"></div>

            <label class="writer-page-toolbar-button writer-page-toolbar-button-autoscroll">
                <span>Scroll:</span>

                <input type="checkbox" checked name="writer-page-toolbar-button-autoscroll-input">
            </label>

            <div tabindex="0" class="writer-page-toolbar-button writer-page-toolbar-button-zoom-out">
                Zoom -
            </div> 

            <div tabindex="0" class="writer-page-toolbar-button writer-page-toolbar-button-zoom-in">
                Zoom +
            </div> 
        </div> 
    </div>    

    <div class="writer-story-node-canvas-wrap">
        <canvas class="writer-page-canvas"></canvas>

        <div class="writer-story-node-wrap">

        </div>    
    </div>

    <div class="writer-page-toolbar writer-page-toolbar-alt">
        <div class="writer-page-toolbar-button-wrap">
            <div tabindex="0" class="button-type-2 writer-page-toolbar-button-remove-block">
                Delete block
            </div> 

            <div class="flex-fill"></div>

            <div tabindex="0" class="button-type-2 writer-page-toolbar-button-add-block">
                Create block
            </div> 
        </div> 
    </div>
</div>

        `);
    }

    removeNodes() {
        for (const [keyX, valX] of Object.entries(this.storyNodes)) {
            // Note to self: Odd thing going on: using an abortcontroller apparently activates late on chrome, 
            // so when rebuilding nodes right after removeNodes, the new listeners get aborted.
            valX.element.removeEventListener("writer-story-node-activates", this.actOnWriterStoryNodeActivates);
            valX.prepareRemoval();
        }

        // Make sure to delete the node rows as well.
        this.eWriterStoryNodeWrap.innerHTML = ``;

        this.storyNodes = {};
    }

    buildNodeTree() {
        // First clean up if required.
        this.removeNodes();

        // First find the starting points.
        const treeStartIds = app.writerData.findTextBlockTreeStartIds();
 
        // Start at every tree start id, then walk through its referenced "next" id text blocks.
        // Skipping visited IDs cuts loops and merges of node branches.
        let visitedIds = [];
        for (const startIdX of treeStartIds) {
            let eNewTree = UIUtils.appendInnerHTML(this.eWriterStoryNodeWrap, `<div class="writer-story-node-tree"></div>`);

            let idsAtDepth = {};
            const collectDepth = function (inDepthContainer, inCurrentDepth, inId) {
                visitedIds.push(inId);
          
                if (inDepthContainer[inCurrentDepth] == null) {
                    inDepthContainer[inCurrentDepth] = [];
                }
                inDepthContainer[inCurrentDepth].push(inId);

                const textBlockX = app.writerData.getTextBlockById(inId);
                if (textBlockX.next != null) {
                    for (const nextId of textBlockX.next) {
                        if (!visitedIds.includes(nextId)) {
                            collectDepth(inDepthContainer, inCurrentDepth + 1, nextId);
                        }
                    }
                }
            };
            // We're assuming that the first id, which must be "0", is present and all.
            collectDepth(idsAtDepth, 0, startIdX);

            // console.log("Collected text block id depth tree:");
            // console.log(idsAtDepth);

            // Generate rows and nodes.
            for (const [depthX, idsX] of Object.entries(idsAtDepth)) {
                let newRow = UIUtils.appendInnerHTML(eNewTree, `<div class="writer-story-node-row"></div>`);
                for (const idX of idsX) {
                    let newWriterStoryNode = WriterStoryNode.create(newRow, idX);
                    newWriterStoryNode.element.addEventListener("writer-story-node-activates", this.actOnWriterStoryNodeActivates.bind(this));
                    this.storyNodes[idX] = newWriterStoryNode;
                }
            }
        }

        // The following always needs to be done when we change nodes, so I put it here:
        this.setZoomLevel(this.zoomLevel);
        // setZoomLevel already updates the canvas.
        // this.updateCanvas();
    }

    updateCanvas() {
        // TODO not a fan of redrawing on updateCanvas for every little layout change. Any other way?
        // Sets draw resolution and clears canvas on next setter.
        // Apparently clears all parameters as well, like fillStyle.
        // Set to 0 first, so that we get a desired size from the parent element. Apparently that works right away.
        this.eCanvas.width = 0;
        this.eCanvas.height = 0;
        this.eCanvas.width = this.eCanvas.parentElement.scrollWidth;
        this.eCanvas.height = this.eCanvas.parentElement.scrollHeight;
        // Setup the canvas now then.
        this.canvas.strokeStyle = "#ebe2e5ff";
        this.canvas.lineWidth = 2;
        this.canvas.lineCap = 'round';

        // Calculate connections and draw them.
        // Note: Currently connections are drawn two way (overlapping). 
        // Might be necessary if I draw the lines as arrows, otherwise remove the dupes.
        for (const [keyX, valX] of Object.entries(this.storyNodes)) {
            const textBlockX = app.writerData.getTextBlockById(keyX);
            if (textBlockX.next == null) {
                continue;
            }

            const nodeCenterA = UIUtils.getTopLeftCoordDiffTo(UIUtils.getElementCenterCoord(valX.element), this.eCanvas);

            for (const nextId of textBlockX.next) {
                const nodeCenterB = UIUtils.getTopLeftCoordDiffTo(UIUtils.getElementCenterCoord(this.storyNodes[nextId].element), this.eCanvas);

                // console.log(`line from: ${nodeCenterA.x} ${nodeCenterA.y}, to: ${nodeCenterB.x} ${nodeCenterB.y}`);
                this.canvas.moveTo(nodeCenterA.x, nodeCenterA.y);
                this.canvas.lineTo(nodeCenterB.x, nodeCenterB.y);
            }
        }

        // Can do this at the end at once if I'm not changing colors etc per line.
        this.canvas.stroke();
    }

    activateDefaultNodeId() {
        // Attempt to restore to a preferred node.
        // Note to self: It would be nice to restore to a "nearby" node if one node is deleted,
        // but because all nodes are re keyed (and because any ID could be next to any other),
        // This attempt is pointless. In such case, restore to 0. 
        // At worst the writer gets to scroll a little.
        // I'm putting a TODO here to review later. 
        if (this.storyNodes[app.writerData.getLastVisitedNodeId()] != null) {
            this.activateNodeId(app.writerData.getLastVisitedNodeId());
        }
        else {
            this.activateNodeId("0");
        }
    }

    activateNodeId(inId) {
        app.writerData.setLastVisitedNodeId(inId);
    }

    conditionalScrollToActiveNode(inUseSmooth) {
        if (this.autoScroll) {
            this.scrollToActiveNode(inUseSmooth);
        }
    }

    scrollToActiveNode(inUseSmooth) {
        const node = this.storyNodes[app.writerData.getLastVisitedNodeId()];
        if (node == null) {
            return;
        }
        const nodeElem = node.element;
        const nodeRect = nodeElem.getBoundingClientRect();

        // Calculate scroll and do it. I'm not using scrollIntoView here because that hijacks all nested scrollbars.
        const coord = UIUtils.getTopLeftCoordDiffTo({ x: nodeRect.left, y: nodeRect.top }, this.eWriterStoryNodeCanvasWrap);
        // target gets the position we can scroll to if we want the node to be on the top left.
        const target = { x: this.eWriterStoryNodeCanvasWrap.scrollLeft + coord.x, y: this.eWriterStoryNodeCanvasWrap.scrollTop + coord.y };
        // centeredTarget brings it to the center of the scrolling element.
        const centerOffset = { x: (-this.eWriterStoryNodeCanvasWrap.offsetWidth / 2) + (nodeElem.offsetWidth / 2), y: (-this.eWriterStoryNodeCanvasWrap.offsetHeight / 2) + (nodeElem.offsetHeight / 2) };
        const centeredTarget = { x: target.x + centerOffset.x, y: target.y + centerOffset.y };

        this.eWriterStoryNodeCanvasWrap.style.scrollBehavior = inUseSmooth ? 'smooth' : 'unset';
        this.eWriterStoryNodeCanvasWrap.scrollTo(centeredTarget.x, centeredTarget.y);
        // console.log(centeredTarget);
    }

    setZoomLevel(inZoomLevel) {
        const minZoomLevel = 0;
        const maxZoomLevel = 4;
        const defaultNodeSize = 10;
        const defaultMargin = 2;
        const defaultFontSize = 4;
        this.zoomLevel = MathUtils.clamp(inZoomLevel, minZoomLevel, maxZoomLevel);

        // Scale things up or down depending on zoom level.
        let newNodeSize = defaultNodeSize + (defaultNodeSize * this.zoomLevel);
        let newFontSize = defaultFontSize + (defaultFontSize * this.zoomLevel);
        let newMargin = defaultMargin + (defaultMargin * this.zoomLevel);

        // 180px for the canvas wrap currently ensures all other buttons and fields are in view on 1920x1080.
        // The code above makes everything mini when you zoom out but I have another idea.
        // When zooming out entirely (the writer wants a view of connections),
        // I can show the entire height of the canvas instead of the 180px.
        // This could be useful for a large project or to see separated nodes.
        let newHeight = "180px";
        const heightInsideIsLarge = this.eWriterStoryNodeWrap.offsetHeight > 180;
        const shouldFitWrap = heightInsideIsLarge && this.zoomLevel == minZoomLevel;

        if (shouldFitWrap) {
            // not too tiny.
            newNodeSize = Math.max(newNodeSize, defaultNodeSize * 3);
            newFontSize = Math.max(newFontSize, defaultFontSize * 3);
            newMargin = Math.max(newMargin, defaultMargin * 3);
        }

        // Finally we got to get a string of whatever we calculated.
        newNodeSize = newNodeSize.toString() + "px";
        newFontSize = newFontSize.toString() + "px";
        newMargin = newMargin.toString() + "px";

        for (let [keyX, valX] of Object.entries(this.storyNodes)) {
            // Then update the nodes with that.
            valX.element.style.minHeight = newNodeSize;
            valX.element.style.minWidth = newNodeSize;
            valX.element.style.fontSize = newFontSize;
            valX.element.style.margin = newMargin;
        }

        if (shouldFitWrap) {
            // Then re measure the canvas we need to fit the wrap to.
            newHeight = this.eWriterStoryNodeWrap.offsetHeight.toString() + "px";
        }

        this.eWriterStoryNodeCanvasWrap.style.height = newHeight;

        this.updateCanvas();
        this.conditionalScrollToActiveNode(false);
    }

    setAutoScroll(inEnable) {
        this.autoScroll = inEnable;

        this.eWriterStoryNodeCanvasWrap.style.overflow = this.autoScroll ? 'hidden' : 'scroll';
        // Need to redraw canvas because scrollbars shift layout.
        this.updateCanvas();

        if (this.autoScroll) {
            this.scrollToActiveNode(true);
        }
    }

    /* Events */

    actOnResize() {
        this.updateCanvas();
    }

    actOnWriterDataTextBlockFieldChange(inEvent) {
        if (inEvent.textBlockFieldName != "next") {
            // Not relevant to node overview.
            return;
        }
        if (app.writerData.isRemovingStoryTextBlock) {
            // This method will be called a lot if WriterData is currently bulk removing "next" references after it removes a text block.
            // Thing is, while it's doing such bulk operations we have no reliable data to work on (traces of Next IDs still there etc.).
            //
            // I added WriterData.isRemovingStoryTextBlock to test if this specific situation is going on, 
            // so we can get away with a simple solution. There is no generic bulletproof way to check if WriterData is in a "complete" state right now.
            // Luckily, currently no other class needs to care other than this.
            //
            // I could decide to just not broadcast any change on WriterData while bulk editing, 
            // but I'm sure that would lead to more problems coming from inconsistency.
            //
            // I had a manager or broadcast cue (delay) in mind but that is nothing but overcomplexity.
            // console.log("Skipping actOnWriterDataTextBlockFieldChange, for WriterData.isRemovingStoryTextBlock");
            return;
        }

        this.buildNodeTree();
        this.activateDefaultNodeId();
    }

    actOnWriterDataInsertedTextBlock(inEvent) {
        this.buildNodeTree();
        this.activateNodeId(inEvent.newId);
    }

    actOnWriterDataRemovedTextBlock() {
        this.buildNodeTree();
        this.activateDefaultNodeId();
    }

    actOnWriterStoryNodeActivates(inEvent) {
        this.activateNodeId(inEvent.writerStoryNode.textBlockId);
    }

    actOnToolbarButtonGoToChange() {
        const newValue = this.eToolbarButtonGoToInput.value;
        const newNode = this.storyNodes[newValue];
        if (newNode != null) {
            this.activateNodeId(newValue);
        }
        else {
            this.eToolbarButtonGoToInput.value = app.writerData.getLastVisitedNodeId();
        }
    }

    actOnToolbarButtonAutoScrollChange() {
        this.setAutoScroll(this.eToolbarButtonAutoScrollInput.checked);
    }

    actOnToolbarButtonAutoScrollKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            // In chrome apparently enter does not "click" on a checkbox, but spacebar does. Inconsistent with html elem "select".
            this.eToolbarButtonAutoScrollInput.click();
        }
    }

    actOnToolbarButtonZoomInClick() {
        this.setZoomLevel(this.zoomLevel + 1);
    }

    actOnToolbarButtonZoomInKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnToolbarButtonZoomInClick();
        }
    }

    actOnToolbarButtonZoomOutClick() {
        this.setZoomLevel(this.zoomLevel - 1);
    }

    actOnToolbarButtonZoomOutKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnToolbarButtonZoomOutClick();
        }
    }

    actOnToolbarButtonAddBlockClick() {
        app.writerData.insertStoryTextBlock(app.writerData.getLastVisitedNodeId());
    }

    actOnToolbarButtonAddBlockKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnToolbarButtonAddBlockClick();
        }
    }

    actOnToolbarButtonRemoveBlockClick() {
        app.writerData.removeStoryTextBlock(app.writerData.getLastVisitedNodeId());
    }

    actOnToolbarButtonRemoveBlockKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnToolbarButtonRemoveBlockClick();
        }
    }

    actOnWriterDataSetActiveStory() {
        this.buildNodeTree();
        this.activateDefaultNodeId();
    }

    actOnWriterDataResetStory() {
        this.buildNodeTree();
        this.activateNodeId("0");
    }

    actOnWriterDataLastVisitedNodeIdChange(inEvent) {
        if (inEvent.oldId != null) {
            let oldNode = this.storyNodes[inEvent.oldId];
            if (oldNode != null) {
                oldNode.appearActiveId(false);
            }
        }

        let newNode = this.storyNodes[inEvent.newId];
        if (newNode == null) {
            console.error("Attempt to activate node that does not exist.");
        }
        else {
            newNode.appearActiveId(true);
            this.conditionalScrollToActiveNode(true);
        }

        this.eToolbarButtonGoToInput.value = inEvent.newId;

        if (inEvent.newId == "0") {
            // We can't delete the first text block, so we disable the button.
            this.eToolbarButtonRemoveBlock.classList.add("disabled");
        }
        else {
            // Else we enable the button.
            this.eToolbarButtonRemoveBlock.classList.remove("disabled");
        }
    }
}
