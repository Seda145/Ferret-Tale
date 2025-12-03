/*****
** Navigation broadcasts page class navigation requests, and keeps track of what is navigated to.
*****/
class Navigation {
    constructor() {
        this.activeNavPageClass = null;
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

    navigateTo(InNavPageClass) {
        if (InNavPageClass == null) {
            console.error("Navigation to a null InNavPageClass is not valid.");
            return;
        }
        if (InNavPageClass == this.activeNavPageClass) {
            // Nothing changes. Ignore the request.
            return;
        }

        this.activeNavPageClass = InNavPageClass;
        // console.log(`Starting navigation to: ${this.activeNavPageClass.name}`);

        let navigationEvent = new Event('navigate-to', { bubbles: false });
        navigationEvent.navPageClass = this.activeNavPageClass;
        this.element.dispatchEvent(navigationEvent);
    }
}
