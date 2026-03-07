/*****
** Header for the app. Only one should be made. Displays navigation menus.
*****/
class Header {
    /* Functions */

    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.navItems = {};
		
        nThis.mobileNavItems = {};

        nThis.element = UIUtils.replaceElement(inScopeElement.querySelector('[data-component="header"]'), nThis.getHTMLTemplate());

        nThis.eMobileMenuIcon = nThis.element.querySelector(".mobile-menu-icon");
        
        nThis.eMobileNavMenu = nThis.element.querySelector(".mobile-nav-menu");

        nThis.eMobileNavMenuInner = nThis.eMobileNavMenu.querySelector(".mobile-nav-menu-inner");

        nThis.eNavMenu = nThis.element.querySelector(".header-nav-menu");

        nThis.eNavMenuInner = nThis.eNavMenu.querySelector(".header-nav-menu-inner");

        nThis.eNavOverlay = nThis.element.querySelector(".navigation-overlay");

        nThis.eHeaderTop = nThis.element.querySelector(".header-top");

        nThis.contentSeparator = ContentSeparator.create(nThis.element, "navigation-overlay-icon");
        
        nThis.rebuildNavigation();

		/* Events */

        app.configData.element.addEventListener("set-config-val", nThis.actOnConfigDataSetConfigVal.bind(nThis), { signal: nThis.acEventListener.signal });

        if (nThis.eMobileMenuIcon) {
            nThis.eMobileMenuIcon.addEventListener("click", nThis.actOnMobileMenuIconClick.bind(nThis), { signal: nThis.acEventListener.signal });
            nThis.eMobileMenuIcon.addEventListener("keyup", nThis.actOnMobileMenuIconKeyUp.bind(nThis), { signal: nThis.acEventListener.signal });
        }

        if (nThis.eNavOverlay) {
            nThis.eNavOverlay.addEventListener("click", nThis.actOnNavOverlayClick.bind(nThis), { signal: nThis.acEventListener.signal });
        }

        window.addEventListener("resize", nThis.actOnWindowResize.bind(nThis), { signal: nThis.acEventListener.signal });

        app.element.addEventListener("app-userdata-setup-complete", nThis.actOnAppUserdataSetupComplete.bind(nThis), {once : true});

        app.navigation.element.addEventListener("navigate-to", nThis.actOnNavigationNavigateTo.bind(nThis), { signal: nThis.acEventListener.signal });

        app.userdataPorter.element.addEventListener("exported-data-to-file", nThis.actOnUserdataExportedDataToFile.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();
        
		this.removeAllNavItems();

        this.element.remove();
		this.element = null;

        this.eMobileMenuIcon = null;
        this.eMobileNavMenu = null;
        this.eMobileNavMenuInner = null;
        this.eNavMenu = null;
        this.eNavMenuInner = null;
        this.eNavOverlay = null;
        this.eHeaderTop = null;
        
        this.contentSeparator.prepareRemoval();
        this.contentSeparator = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<header>
    <div class="header-top">
        <div class="header-top-wrap max-width-wrap">
            <div class="banner-logo" style="background-image: url('${PathUtils.getAppMediaPath() + 'ferret_tale_text_480x100.png'}')"></div>
        </div>
    </div>

    <div class="header-bottom">
        <div class="header-bottom-wrap max-width-wrap">
            <div class="header-bottom-logo" style="opacity: 0; background-image: url('${PathUtils.getAppMediaPath() + 'ferret_tale_text_480x100.png'}')"></div>

            <nav class="header-nav-menu">
                <div class="header-nav-menu-inner">
                    <div class="fake-mobile-menu-icon" tabindex="0">
                        <div class="mobile-menu-icon-line"></div>
                        <div class="mobile-menu-icon-line"></div>
                        <div class="mobile-menu-icon-line"></div>
                    </div>
                </div>
            </nav>

            <div class="mobile-menu-icon" tabindex="0">
                <div class="mobile-menu-icon-line"></div>
                <div class="mobile-menu-icon-line"></div>
                <div class="mobile-menu-icon-line"></div>
            </div>
        </div>
    </div>

    <div class="navigation-overlay">
        <div data-component="content-separator"></div>
    </div>

    <nav class="mobile-nav-menu">
        <div class="mobile-nav-menu-inner">
 
        </div>
    </nav>
</header>

        `);
    }

    isNavigationStyleMobile() {
        return this.element.classList.contains("mobile-nav");
    }

    setNavigationStyleMobile() {
        this.element.classList.add("mobile-nav");
        // Nothing else is currently affecting the body scroll.
        document.body.classList.add("disable-scroll");

        // If we are showing a banner above the header bar, we should scroll down to content to ensure the menu and mobile icon fill the screen and align top right.
        // Then disable scroll on the page.

        if (!UIUtils.isScrollPastElement(this.eHeaderTop)) {
            const eMain = document.getElementsByTagName("main")[0];
            if (eMain != null) {
                eMain.scrollIntoView();
            }
        }
    }

    removeNavigationStyleMobile() {
        this.element.classList.remove("mobile-nav");
        // Nothing else is currently affecting the body scroll.
        document.body.classList.remove("disable-scroll");
    }

    addNavItems(inNavTitle, InNavItemClass, InNavPageClass) {
        const addNavItem = function(inThis, inIsMobile, inMustPrepend, inNavTitle, InNavItemClass, InNavPageClass) {
            let newNavItem = InNavItemClass.create(inIsMobile ? inThis.eMobileNavMenuInner : inThis.eNavMenuInner, inMustPrepend, inNavTitle, InNavPageClass);

            if (inIsMobile) {
                inThis.mobileNavItems[inNavTitle] = newNavItem;
            }
            else {
                inThis.navItems[inNavTitle] = newNavItem;
            }
        }

        addNavItem(this, false, true, inNavTitle, InNavItemClass, InNavPageClass);
        addNavItem(this, true, false, inNavTitle, InNavItemClass, InNavPageClass);
    }
	
	removeAllNavItems() {
		for (let [itemXKey, itemXVal] of Object.entries(this.navItems)) {
			itemXVal.prepareRemoval();
		}
		this.navItems = {};
		
		for (let [itemYKey, itemYVal] of Object.entries(this.mobileNavItems)) {
			itemYVal.prepareRemoval();
		}
		this.mobileNavItems = {};
	}

    removeNavItems(inNavTitle) {
        const removeNavItem = function(inThis, bInIsMobile, inNavTitle) {
            let theNavItem = bInIsMobile ? inThis.mobileNavItems[inNavTitle] : inThis.navItems[inNavTitle];
            if (theNavItem != null) {
                theNavItem.prepareRemoval();

                if (bInIsMobile) {
                    inThis.mobileNavItems[inNavTitle] = null;
                }
                else {
                    inThis.navItems[inNavTitle] = null;
                }
            }
        }
    
        removeNavItem(this, true, inNavTitle);
        removeNavItem(this, false, inNavTitle);
    }

    rebuildNavigation() {
        // I made this method to control the navigation items in one place.
        // Currently items are ordered manually, so I remove everything first.
        this.removeAllNavItems();

        // Now add new navigation conditionally.
        if (app.userdataPorter.hasImportedSuccess) {
            this.addNavItems("Save", NavItemSaveProgress);
            if (app.writerModeEnabled) {
                this.addNavItems("Write", NavItem, WriterPage);
            }
            else {
                this.addNavItems("Read", NavItem, StoryListPage);
            }
            if (app.configData.getConfigVal("enable_help_page")) {
                this.addNavItems("Help", NavItem, HelpPage);
            }
            this.addNavItems("Settings", NavItem, ConfigPage);
        }
        else {
            this.addNavItems("Load", NavItem, LoadUserdataPage);
            this.addNavItems("Help", NavItem, HelpPage);
        }
    }

    /* Events */

    actOnConfigDataSetConfigVal(inEvent) {
        if (inEvent.configField == "enable_help_page") {
            this.rebuildNavigation();
        }
    }

    actOnMobileMenuIconClick() {
        if (this.eNavMenu) {
            if (this.isNavigationStyleMobile()) {
                this.removeNavigationStyleMobile();
            }
            else {
                this.setNavigationStyleMobile();
            }
        }
    }

    actOnMobileMenuIconKeyUp(inEvent) {
        if (inEvent.keyCode == 13) {
            // If this widget receives the enter key as input (key up) then simulate a click event.
            this.actOnMobileMenuIconClick();
        } 
    }

    actOnNavOverlayClick() {
        this.removeNavigationStyleMobile();
    }

    actOnWindowResize() {
        if (!this.isNavigationStyleMobile()) {
            return;
        }

        if (window.innerWidth > app.screenWidthMobile) {
            this.removeNavigationStyleMobile();
        }
    }

    actOnAppUserdataSetupComplete() {
        this.rebuildNavigation();
    }

    actOnNavigationNavigateTo() {
        if (this.isNavigationStyleMobile()) {
            this.removeNavigationStyleMobile();
        }
    }

    actOnUserdataExportedDataToFile() {
        // I have one "fake" Nav Item (NavItemSaveProgress) next to real ones (this one doesn't actually instruct Navigation).
        // Instead it requests exporting progress data.
        // Below is to be consistent with other nav item behavior (this.actOnNavigationNavigateTo).
        if (this.isNavigationStyleMobile()) {
            this.removeNavigationStyleMobile();
        }
    }
}