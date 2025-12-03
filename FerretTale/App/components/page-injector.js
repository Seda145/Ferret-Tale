/*****
** PageInjector is a widget wrapper / loader / unloader for the main content of the app.
** It responds to navigation events in Navigation, then replaces its inner content with the requested content.
**
**
**
** Note: Injection design is as follows:
**
** Contrary to what I usually do, I don't default to using the observer pattern to have components update themselves.
** In this app, components are often destroyed and replaced with new ones.
** Example: PageInjector recreates all its inner components, in just one response to Navigation.
**
** This app is compact and planned very specifically. Only the plan allows the code reduction.
** Benefit: a lot of code (observers, checks, UI, etc.) is not required.
**
** The plan: 
** 1. Allowed user navigation is conditional and ordered.
** 2. Before having valid userdata, a user navigates only to "help", or "load userdata".
** 3. After getting valid userdata, a user can no longer navigate to "load userdata", but more navigation is allowed.
** 4. Content type is very specific to a page (No component listens to settings, etc.).
** 5. PageInjector recreates a full Page in response to Navigation, so that a new page will load in the app's latest state. 
** 6. Handle content external to Page properly (audioController playing audio for a page should be stopped when navigating, etc.).
**
** The intended user's interaction with the app could look like:
** 1. User nav to settings page. 2. User changes settings. 3. User nav to story page. 4. story page is recreated using new settings.
*****/
class PageInjector {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.fadeTimeoutHandle = null;
		
        nThis.element = UIUtils.replaceElement(inScopeElement.querySelector('[data-component="page-injector"]'), nThis.getHTMLTemplate());
		
        nThis.injectedPage = null;

        /* Events */
        
        app.navigation.element.addEventListener("navigate-to", nThis.actonNavigationNavigateTo.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        this.removeInjectedPage();
        
        this.element.remove();
		this.element = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="page-injector">
    <div data-component="injected-page"></div>
</div>

        `);
    }

    removeInjectedPage() {
        if (this.injectedPage != null) {
            document.body.classList.remove("injected-page-" + this.injectedPage.constructor.name);
            this.injectedPage.prepareRemoval();
            this.injectedPage = null;
        }

        this.element.classList.remove("page-injector-fade-in");
        window.clearTimeout(this.fadeTimeoutHandle);
    }

    injectPage(InPageClass) {
        const hasPreviousNav = this.injectedPage != null;

        // Clean up if required.
        this.removeInjectedPage();
        // Pages are always recreated.
        this.injectedPage = InPageClass.create(this.element);; 

        document.body.classList.add("injected-page-" + this.injectedPage.constructor.name);

        // After navigating, we scroll up to main content.
        // Otherwise scroll position from the previous page is used on the new page.
        //
        // I had the idea to top scroll the front page to top on page load (the mobile menu isn't open then), 
        // But chrome seems to override it in an odd attempt to restore scroll.
        //
        // I don't want to scroll down to main initially (we'd be on the front page).
        //
        // StoryPage has its own scroll logic.
        //
        if (hasPreviousNav && InPageClass != StoryPage) {
            document.body.querySelector("main").scrollIntoView({ behavior: 'instant' });
        }

        this.fadeTimeoutHandle = window.setTimeout(() => { 
            this.element.classList.add("page-injector-fade-in");
		}, 100);
    }

    /* Events */

    actonNavigationNavigateTo(inEvent) {
        this.injectPage(inEvent.navPageClass);
    }
}
