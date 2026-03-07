/*****
** A content page, that can be injected by PageInjector on demand.
** Used to let the user upload his user data folder, after which this page is no longer used.
*****/
class LoadUserdataPage {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

		nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="injected-page"]'), nThis.getHTMLTemplate());

        nThis.eBackground = nThis.element.querySelector(".load-userdata-page-background");
        nThis.eBackground.style.backgroundImage = `url('${PathUtils.getAppMediaPath()}ferret_tale_background.png')`;

        nThis.backgroundLighting = BackgroundLighting.create(nThis.element);

        nThis.eWelcomeToAppHeader = nThis.element.querySelector(".welcome-to-app-header");
        nThis.eWelcomeToAppHeader.innerText = `Welcome to ${PathUtils.getAppDisplayName()}!`;

        nThis.eLoadUserdataAppMode = nThis.element.querySelector('[name="load-userdata-app-mode"]');

		nThis.eInputUserdataFolder = nThis.element.querySelector('.input-userdata-folder');

        nThis.eCopyPath = nThis.element.querySelector(".load-userdata-two-steps-copy-path");

        nThis.eNavHelpPage = nThis.element.querySelector(".nav-help-page");

        nThis.setAppMode(nThis.eLoadUserdataAppMode.value);

        /* Events */

        app.userdataPorter.element.addEventListener("load-data-from-file-critical-error", nThis.actOnUserdataPorterLoadDataFromFileCriticalError.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eLoadUserdataAppMode.addEventListener("change", nThis.actOnLoadUserdataAppModeChange.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eInputUserdataFolder.addEventListener("change", nThis.actOnInputUserdataFolderChange.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eCopyPath.addEventListener("click", nThis.actOnCopyPathClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eCopyPath.addEventListener("keyup", nThis.actOnCopyPathKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });

        nThis.eNavHelpPage.addEventListener("click", nThis.actOnNavHelpPageClick.bind(nThis), { signal: nThis.acEventListener.signal });
        nThis.eNavHelpPage.addEventListener("keyup", nThis.actOnNavHelpPageKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });
                 
        /* Return self */
        
        return nThis;
	}

    prepareRemoval() {
        this.acEventListener.abort();

        this.backgroundLighting.prepareRemoval();
        this.backgroundLighting = null;

        this.element.remove();
		this.element = null;

        this.eBackground = null;
        this.eWelcomeToAppHeader = null;
        this.eLoadUserdataAppMode = null;
        this.eInputUserdataFolder = null;
        this.eCopyPath = null;
        this.eNavHelpPage = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        // return (html`
        return (`
 
<div class="load-userdata-page">

    <div data-component="background-lighting"></div>

    <div class="load-userdata-page-background"></div>

    <div class="max-width-wrap">
        <div class="load-userdata-section">
            <h2 class="welcome-to-app-header"></h2>

            <p>New here? <a class="nav-help-page" tabindex="0">Read the Help page</a></p>

            <p>Ready? Let's load your data:</p>

            <div class="load-userdata-two-steps-wrap">

                <p>1. Select app mode:</p>
                <select class="button-type-1" name="load-userdata-app-mode">
                    <option value="reader">Reader</option>
                    <option value="writer">Writer</option>
                </select>

                <a class="load-userdata-two-steps-copy-path" tabindex="0">2. Click here to copy this app's userdata folder path.</a>

                <p>3. Load that folder:</p>

                <input class="input-userdata-folder button-type-1" type="file" webkitdirectory="true"/>
            </div>
        </div>
    </div>
</div>

        `);
    }

    setAppMode(inMode) {
        if (!app.userdataPorter.hasImportedSuccess) {
            app.writerModeEnabled = inMode == "writer";
        }
        else {
            console.error("The app mode can no longer be changed after userdata has been imported.");
        }
    }

    /* Events */

    actOnUserdataPorterLoadDataFromFileCriticalError() {
        // If I don't reset the value to "",
        // The input element will display that X amount of files have been loaded,
        // And reloading the same path will have no effect.
        //
        // That is a problem if an error is detected in reader mode, the user switches to writer mode (which allows the error), 
        // and the path is still refused by the input element (as if nothing changed).
        // 
        // It is also a problem if we edited a file in a text editor to fix something, then try to reload it, which doesn't work.
        //
        this.eInputUserdataFolder.value = "";
        console.warn("A critical error (alert displayed) was detected during import. Fix the mentioned error and try again.");
    }

    actOnLoadUserdataAppModeChange() {
        this.setAppMode(this.eLoadUserdataAppMode.value);
    }

    async actOnInputUserdataFolderChange(inEvent) {
        inEvent.preventDefault();

        app.userdataPorter.importUserdataFolder(inEvent.currentTarget.files);
    }

    actOnCopyPathClick() {
        // Remove the first / in /C:/, and remove URI symbols (%20 to whitespace etc.).
        const decodePath = decodeURI(PathUtils.getUserdataPath().substring(1));
        // The Readme explains that paths should explain no symbols (although whitespace is allowed),
        // So there "shouldn't" be strings like %20 on the actual app directory path.
        // The URL however displays otherwise, so what I'm decoding here may not be accurate.
        // TODO, can I get rid of that behavior, and add in symbol support after all?
        // The decode is required because you can't paste the original path into Windows File Explorer.

        // console.log("Writing userdata folder path to the clipboard: ");
        // console.log(decodePath);
        navigator.clipboard.writeText(decodePath);
    }

    actOnNavHelpPageClick() {
        // Quick dirty way to include a help page link.
        // The help page is available at all times through the app.
        // Right now I don't do any post building injection of navigation links into content, 
		// and I just declared the help page before all other pages.
        // Then we can do:
        app.navigation.navigateTo(HelpPage);
        // I honestly don't expect navigation injection into content to happen anywhere but here. 
        // It's just useful to point new users to the help page on launch page right away instead of letting them search for it.
		// A more common solution could be made if I'm ever going to add in navigation links.
    }

    actOnCopyPathKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnCopyPathClick();
        }
    }

    actOnNavHelpPageKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnNavHelpPageClick();
        }
    }
}