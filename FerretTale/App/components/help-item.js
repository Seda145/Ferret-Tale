/*****
** HelpItem displays a single block of text information.
** Used together with HelpPage.
*****/
class HelpItem {
    static create(inScopeElement, inHelpTitle, inHelpDescription, inImage) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();
        
        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eHelpTitle = nThis.element.querySelector(".help-title");
        nThis.eHelpTitle.innerText = inHelpTitle;
        
        nThis.ehelpContentWrap = nThis.element.querySelector(".help-content-wrap");
        if (inImage != null) {
            UIUtils.appendInnerHTML(nThis.ehelpContentWrap, `<div class="help-image-wrap"><img src="${PathUtils.getAppMediaHelpPath()}${inImage}"></div>`);
        }

        nThis.eHelpDescription = nThis.element.querySelector(".help-description");
        nThis.eHelpDescription.innerText = inHelpDescription;

        /* Events */

        nThis.eHelpTitle.addEventListener("click", nThis.actOnClickHelpTitle.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();
        
        this.element.remove();
		this.element = null;

        this.eHelpTitle = null;
        this.ehelpContentWrap = null;
        this.eHelpDescription = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="help-item">
    <h4 class="help-title"></h4>

    <div class="help-content-wrap">
        <div class="help-description-wrap">
            <p class="help-description"></p>
        </div>

        
    </div>
</div>

        `);
    }

    /* Events */

    actOnClickHelpTitle() {
        this.eHelpTitle.scrollIntoView();
    }
}
