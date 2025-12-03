/*****
** 
*****/
class StoryListPageExtraInfoSet {
    static create(inScopeElement, inInfoKey, inInfoValue) {
        /* Setup */

        let nThis = new this();

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        nThis.eInfoSetKey = nThis.element.querySelector(".story-list-page-extra-info-set-key");
        nThis.eInfoSetKey.innerText = inInfoKey + ":";

        nThis.eInfoSetValue = nThis.element.querySelector(".story-list-page-extra-info-set-value");
        nThis.eInfoSetValue.innerText = inInfoValue;

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

<div class="story-list-page-extra-info-set">
    <div class="story-list-page-extra-info-set-side">
        <p class="story-list-page-extra-info-set-key"></p>
    </div>
    <div class="story-list-page-extra-info-set-side">
        <p class="story-list-page-extra-info-set-value"></p>
    </div>
</div>
            
        `);
    }
}
