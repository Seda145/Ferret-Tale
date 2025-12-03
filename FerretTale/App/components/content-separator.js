/*****
** A visual that separates content in any direction, displayed more similar to an icon than a line.
** Used this for an anchor links and as menu transform indicator in the past.
*****/
class ContentSeparator {
    static create(inScopeElement, inHtmlClass) {
        /* Setup */

        let nThis = new this();

        nThis.element = UIUtils.replaceElement(inScopeElement.querySelector('[data-component="content-separator"]'), nThis.getHTMLTemplate());
        if (inHtmlClass != null) {
            nThis.element.classList.add(inHtmlClass);
        }

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.element.remove();
		this.element = null;
        
        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="content-separator-wrap">
    <div class="content-separator">
        <div class="separator-icon"></div>
    </div>
</div>

        `);
    }
}