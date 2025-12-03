/*****
** NavItemSaveProgress is technically not a NavItem as it does not instruct to navigate to a page class.
** This widget is set up just like a nav item by the header, to display a button with its own functionality (saving progress).
** Otherwise a copy of the NavItem class, the bits that process page navigation are dropped.
*****/
class NavItemSaveProgress {
    static create(inScopeElement, inMustPrepend, inNavTitle) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();
        
        nThis.element = inMustPrepend
            ? UIUtils.prependInnerHTML(inScopeElement, nThis.getHTMLTemplate())
            : UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());
        nThis.element.innerText = inNavTitle;

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

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<span class="nav-item" tabindex="0"></span>

        `);
    }

    /* Events */

    actOnClick() {
        app.userdataPorter.exportProgressJson();
    }

    actOnKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnClick();
        }
    }
}
