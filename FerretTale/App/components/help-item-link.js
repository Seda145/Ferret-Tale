/*****
** Used with HelpPage. 
** Parent element must be <ul>.
** This class acts as anchor link to HelpItem on HelpPage, without modding URL.
*****/
class HelpItemLink {
    static create(inScopeElement, inTitle, inHelpItem) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.helpItem = inHelpItem;

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eHelpTitleA = nThis.element.querySelector("a");
        nThis.eHelpTitleA.innerText = inTitle;

        /* Events */

        nThis.eHelpTitleA.addEventListener("click", nThis.actOnClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eHelpTitleA.addEventListener("keyup", nThis.actOnKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

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
 
<li class="help-item-link"><p><a></a></p></li>

        `);
    }

    /* Events */

    actOnClick() {
        if (this.helpItem != null) {
            this.helpItem.eHelpTitle.scrollIntoView();
        }
    }

    actOnKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnClick();
        }
    }
}
