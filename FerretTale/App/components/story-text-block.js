/*****
** StoryTextBlock displays a single text block of the story.
** Used together with StoryPage.
*****/
class StoryTextBlock {
    static create(inScopeElement, inTextBlockId) {
		/* Setup */

        let nThis = new this();

        nThis.fadeTimeoutHandle = null;
        nThis.textBlockId = inTextBlockId;
        nThis.textBlockObj = app.readerData.getTextBlockById(nThis.textBlockId);

        nThis.element = nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

        let theLayout = app.configData.getConfigVal("pc_reading_layout");
        if (theLayout == "Writer decides") {
            theLayout = app.readerData.getAbout().readingLayout;
        }
        
        if (theLayout == "Column") {
            nThis.element.classList.add("appear-column");
        }
        else if (theLayout == "Column (compact)") {
            nThis.element.classList.add("appear-column-compact");
        }
        else if (theLayout == "Row") {
            nThis.element.classList.add("appear-row");
        }
        else if (theLayout == "Row (compact text)") {
            nThis.element.classList.add("appear-row-compact-text");
        }
        else if (theLayout == "Row (compact)") {
            nThis.element.classList.add("appear-row-compact");
        }
        else {
            console.error("Invalid layout type detected: " + theLayout);
        }

        // Some of the elements here are added in the layout by default, even though content is largely optional.
        // The current CSS setup is a bit complex (user selects column / row mode and variants).
        // Removing elements here (sometimes) adds complexity on that side, at other times makes it simpler.

        nThis.eInfoSectionH = nThis.element.querySelector(".info-section h6");
        if (nThis.textBlockObj.speaker != null) {
            nThis.eInfoSectionH.innerText = nThis.textBlockObj.speaker;
        }

        nThis.eContentSection = nThis.element.querySelector(".content-section");

        if (nThis.textBlockObj.text != null || app.readerData.getAbout().showEmptyTextColumn) {
            UIUtils.prependInnerHTML(nThis.eContentSection, `<div class="text-section"><p></p></div>`)

            nThis.eTextSectionP = nThis.eContentSection.querySelector(".text-section p");
            if (nThis.textBlockObj.text != null) {
                nThis.eTextSectionP.innerText = nThis.textBlockObj.text;
            }
        }

        nThis.estoryTextBlockImageWrap = nThis.element.querySelector(".image-wrap");
        if (nThis.textBlockObj.image != null) {
            UIUtils.setInnerHTML(nThis.estoryTextBlockImageWrap, `
<img src="${PathUtils.getStoryImagesPath(app.readerData.getActiveStoryTitle(), nThis.textBlockObj.image)}">
            `);
        }

        if (nThis.textBlockObj.text == null || nThis.textBlockObj.image == null) {
            // If we don't have text or don't have an image, there's still a css gap.
            // I'm just going to override CSS here. Dirty. Yes. Else CSS complexity goes up a lot.
            nThis.eContentSection.style.gap = "0px";
        }

        nThis.fadeIn();
        
        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        window.clearTimeout(this.fadeTimeoutHandle);

        this.element.remove();
		this.element = null;

        this.eInfoSectionH = null;
        this.eContentSection = null;
        this.eTextSectionP = null;
        this.estoryTextBlockImageWrap = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="story-text-block">
    <div class="info-section">
        <h6></h6>
    </div>

    <div class="content-section">

    
        <div class="image-section">
            <div class="image-wrap">
            
            </div>      
        </div>
    </div>
</div>

        `);
    }

    fadeIn() {
        window.clearTimeout(this.fadeTimeoutHandle);
        this.fadeTimeoutHandle = window.setTimeout(() => { 
            this.element.classList.add("story-text-block-fade-in");
		}, 10);
    }

    fadeOut() {
        window.clearTimeout(this.fadeTimeoutHandle);
        // In css the default values would appear as a fade out.
        this.element.classList.remove("story-text-block-fade-in");
    }
}
