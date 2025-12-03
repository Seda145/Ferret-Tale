/*****
** This class represents an activatable text block, as a node on a story "tree".
*****/
class WriterStoryNode {
    static create(inScopeElement, inTextBlockId) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();
        
        nThis.textBlockId = inTextBlockId;

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());
        
        nThis.eId = nThis.element.querySelector(".writer-story-node-id");
        nThis.eId.innerText = nThis.textBlockId;

        /* Events */

        nThis.element.addEventListener("click", nThis.actOnClick.bind(nThis), { signal: nThis.acEventListener.signal });

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
 
<div class="writer-story-node">
    <span class="writer-story-node-id"></span>
</div>

        `);
    }

    appearActiveId(inCondition) {
        this.element.classList.toggle("appear-active-id", inCondition);
        if (this.textBlockId == "0") {
            this.element.title = inCondition ? "This is the text block you are editing. Edit it with the panel on the bottom of this page. This text block is the start of the story." : "";
        }
        else {
            this.element.title = inCondition ? "This is the text block you are editing. Edit it with the panel on the bottom of this page." : "";
        }
    }

    /* Events */

    actOnClick() {
        let writerStoryNodeActivates = new Event('writer-story-node-activates', { bubbles: false });
        writerStoryNodeActivates.writerStoryNode = this;
        this.element.dispatchEvent(writerStoryNodeActivates);
    }
}
