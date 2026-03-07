/*****
** Footer for the app. Only one should be made.
*****/
class Footer {
    static create(inScopeElement) {
		/* Setup */

        let nThis = new this();

        nThis.element = UIUtils.replaceElement(inScopeElement.querySelector('[data-component="footer"]'), nThis.getHTMLTemplate());

        nThis.eFooterNoticeCopyright = nThis.element.querySelector(".footer-notice-copyright");
        nThis.eFooterNoticeCopyright.innerText = `© ${app.publicationYear}: Roy Wierer. All rights reserved.`;

        nThis.eFooterNoticeVersion = nThis.element.querySelector(".footer-notice-version");
        nThis.eFooterNoticeVersion.innerText = `Version: ${app.version}`;

        /* Return self */

        return nThis;
    }

	prepareRemoval() {
        this.element.remove();
		this.element = null;

        this.eFooterNoticeCopyright = null;
        this.eFooterNoticeVersion = null;
        
        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<footer>
    <div class="footer-wrap max-width-wrap">
        <p class="footer-notice footer-notice-copyright"></p>
        <p class="footer-notice footer-notice-version"></p>
    </div>
</footer>

        `);
    }
}
