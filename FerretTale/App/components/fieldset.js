/*****
** Just a fieldset. Does nothing but exist as HTML wrapper.
*****/
class Fieldset {
    static create(inScopeElement, inLegendTitle) {
        /* Setup */

        let nThis = new this();

        nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());
        
        nThis.eLegend = nThis.element.querySelector("legend");
        nThis.eLegend.innerText = inLegendTitle;

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.element.remove();
		this.element = null;
        
        this.eLegend = null;
        
        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<fieldset>
    <legend></legend>
</fieldset>

        `);
    }

}