class App {
	constructor() {
        // Keep screenWidthMobile in sync with the less variable @screen-width-mobile in var.less!
        this.screenWidthMobile = 1024;
        // Increment for every git commit that changes the app itself. 
        // Naming for branches? ("BranchX 1.00")
        this.version = "1.00";
        this.publicationYear = 2026;
        this.writerModeEnabled = false;
        this.userdataSetupComplete = false;
    }

	create(inScopeElement) {
        console.log("Hi! I am Roy Wierer (Seda145).\r\n\r\nCurious how my app works?\r\n\r\nType app into the console to inspect its current state (app / app.audioController / app.readerData, etc.). Everything is custom made.\r\n\r\nWriters can find useful debugging info by showing 'Verbose' (debug) log levels on the console (top right button in Chrome).\r\n\r\nThe core of this app is inspired by my own older apps (Melonade, Ferrefy).\r\n\r\nThis app works 100% offline.\r\n\r\nEnjoy!\r\n\r\n\r\n\r\n");
        // console.log("App starting...");

        /* Setup */
        
        // Take a look at app.htm on how things might depend on another. 
        // Keeping the same load / set up order here.

        this.element = UIUtils.replaceElement(inScopeElement.querySelector('[data-component="app"]'), this.getHTMLTemplate());

        this.uiUtils = UIUtils.create();
        this.configData = ConfigData.create();
        this.readerData = ReaderData.create();
        this.writerData = WriterData.create();
        this.userdataPorter = UserdataPorter.create();
		this.navigation = Navigation.create();
        this.audioController = AudioController.create();
        this.pageInjector = PageInjector.create(this.element);
        this.header = Header.create(this.element);
        this.footer = Footer.create(this.element);

        // Display the app title instead of the htm file name.
        document.title = PathUtils.getAppDisplayName();

        // Inject favicon
        UIUtils.appendInnerHTML(document.head, `<link rel="icon" type="image/x-icon" href="${PathUtils.getAppMediaPath()}/favicon.ico" />`);

        // Adding this class allows CSS transitions on page load. 
        window.setTimeout(() => {
            document.body.classList.add("js-loaded-app");
        }, 1);

        this.navigation.navigateTo(LoadUserdataPage);

		/* Events */

        this.userdataPorter.element.addEventListener("loaded-data-from-file", this.actOnUserdataLoadedDataFromFile.bind(this), {once : true});
        window.addEventListener("beforeunload", this.actOnPossibleDataLossOnUnload.bind(this));
        window.addEventListener("onclose", this.actOnPossibleDataLossOnUnload.bind(this));
        window.addEventListener("keydown", this.actOnKeyDown.bind(this));
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        return (html`
 
<div id="app-wrap">
    <div data-component="header"></div>

    <main>
        <div data-component="page-injector"></div>
    </main>

    <div data-component="footer"></div>
</div>
        `);
    }

    /* Events */

    actOnUserdataLoadedDataFromFile() {
        // This event may only run once. LoadUserdataPage will not be used again.
        // LoadUserData will have set this.writerModeEnabled, which will now be processed.
        // We will navigate away from LoadUserData through PageInjector.
        //
        // Design note to self: Previously I had a checkbox on ConfigPage to dynamically enable reader / writer modes. 
        // I considered having writer mode work directly on userdata, and use the reader page for previewing.
        // However, this would require mixing in unwanted complexity. 
        // Examples of new support required on reader mode: reading backwards, reconstructing info, rebuilding story structure, skipping validations.
        // I consider it pointless, and see more value in upgrading the writer mode with some preview features (check / play audio, show images etc.) on WritePage.

        this.userdataSetupComplete = true;

        console.log(`app completed userdata setup, and proceeds in ${this.writerModeEnabled ? "writer" : "reader"} mode.\r\nTo change app mode, launch a new app instance. New users should visit the help page.\r\n\r\n`);
        if (this.writerModeEnabled) {
            // Here I'm setting up stories in writerData if importable from readerData.
            // I did not put this on writerData or its importer because that felt out of place.
            // For example, I would not like to fill up the progress.json with this data if the user only uses reader mode.
            //
            // Previously I even added a story into writerData only when asked for it. 
            // This led to overcomplexity because panels on the writer page were expecting at least an active story.
            // So i made the decision to set up the data in full here, if loading in writer mode, so that everything is prepared before navigating to WriterPage.
            this.writerData.addMissingStories();
            if (!this.writerData.hasStory(this.writerData.getActiveStoryTitle())) {
                // If there is no active story, activate the first one.
                // Expected that an empty collection would not have passed import.
                this.writerData.activateFirstStoryTitle();
            }

            this.navigation.navigateTo(WriterPage);
        }
        else {
            this.navigation.navigateTo(StoryListPage);
        }

        // User navigation through UI is now allowed.
        // Listeners to this event, components building UI navigation links in particular, could build in response to this event.
        const appUserdataSetupCompleteEvent = new Event('app-userdata-setup-complete', { bubbles: false });
        this.element.dispatchEvent(appUserdataSetupCompleteEvent);
    }

    actOnPossibleDataLossOnUnload(inEvent) {
        if (!this.userdataSetupComplete) {
            // No need to bother the user if there is no risk of data loss.
            return;
        }

        inEvent.preventDefault();
        // console.log("A default browser alert should pop up now to instruct users to save before unloading the app.");
    }

    actOnKeyDown(inEvent) {
        // I want to implement ctrl+s, and avoid the browser's "save this HTML page" that we have no use for.
        // Of course this only works with window in focus (not console etc.)
        // It's just a utility to have keyboard users save their progress quickly without having to click the save button.
        if (inEvent.key == "s" && inEvent.ctrlKey === true) {
            inEvent.preventDefault();

            if (!this.userdataSetupComplete) {
                // Nothing to save
                return;
            }

            // Export all data to progress.json
            this.userdataPorter.exportProgressJson();
        }
    }
}
