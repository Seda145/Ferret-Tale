/*****
** StoryReaderInteractionAction displays a single option a user can choose from to progress from the current text block to the next.
** Made to be used with StoryReaderInteractionBar.
*****/
class StoryReaderInteractionAction {
    static create(inScopeElement, inActionIndex, inTextBlockId) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.textBlockId = inTextBlockId;

        nThis.element = nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eIndexP = nThis.element.querySelector(".story-reader-interaction-action-index");
        nThis.eIndexP.innerText = `${inActionIndex.toString() }: `;

        nThis.eTextP = nThis.element.querySelector(".story-reader-interaction-action-text");
        nThis.eTextP.innerText = app.readerData.getTextBlockById(nThis.textBlockId).text;

        /* Events */
      
        nThis.element.addEventListener("click", nThis.actOnClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.element.addEventListener("keyup", nThis.actOnKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.element.remove();
		this.element = null;

        this.eIndexP = null;
        this.eTextP = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="story-reader-interaction-action" tabindex="0">
    <div class="story-reader-interaction-action-index">
        <p></p>
    </div>

    <div class="story-reader-interaction-action-text">
        <p></p>
    </div>
</div>

        `);
    }

    /* Events */

    actOnClick() {
        app.readerData.pushStoryTextBlockId(this.textBlockId);
    }

    actOnKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnClick();
        }
    }
}