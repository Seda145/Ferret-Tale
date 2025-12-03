/*****
** NavItem instructs Navigation to navigate to a page class.
** This widget is used by the header, to display buttons that navigate through the app.
*****/
class NavItem {
    static create(inScopeElement, inMustPrepend, inNavTitle, InNavPageClass) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();
        
        nThis.NavPageClass = InNavPageClass;
        nThis.element = inMustPrepend
            ? UIUtils.prependInnerHTML(inScopeElement, nThis.getHTMLTemplate())
            : UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());
        nThis.element.innerText = inNavTitle;

        // Need to simulate the response of actOnNavigationNavigateTo right away,
        // because navigation links are built late (after UI navigation becomes allowed).
        nThis.updateActiveStateByPageClass(app.navigation.activeNavPageClass);

        /* Events */

        nThis.element.addEventListener("click", nThis.actOnClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.element.addEventListener("keyup", nThis.actOnKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        app.navigation.element.addEventListener("navigate-to", nThis.actOnNavigationNavigateTo.bind(nThis), { signal: nThis.acEventListener.signal });

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

    updateActiveStateByPageClass(InPageClass) {
        this.element.classList.toggle("active", InPageClass == this.NavPageClass);
    }

    /* Events */

    actOnClick() {
        app.navigation.navigateTo(this.NavPageClass);
    }

    actOnKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnClick();
        }
    }
    
    actOnNavigationNavigateTo(inEvent) {
        this.updateActiveStateByPageClass(inEvent.navPageClass);
    }
}
