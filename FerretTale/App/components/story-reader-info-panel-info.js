/*****
** 
*****/
class StoryReaderInfoPanelInfo {
	static create(inScopeElement, inInfoDescription) {
        /* Setup */

        let nThis = new this();

        nThis.element = nThis.element = UIUtils.appendInnerHTML(inScopeElement, nThis.getHTMLTemplate());

		nThis.eHeader = null;
		if (inInfoDescription.header != null) {
			nThis.eHeader = UIUtils.appendInnerHTML(nThis.element, `<p class="story-reader-info-panel-info-header"></p>`);
			nThis.eHeader.innerText = inInfoDescription.header;		
			
			// I'm not expecting a null or bad value but I default to a value anyway.
			let headerSizeSuffix = "n";
			if (inInfoDescription.header_size == "Large") {
				headerSizeSuffix = "l";
			}
			else if (inInfoDescription.header_size == "Extra Large") {
				headerSizeSuffix = "xl";
			} 

			const headerTypeClass = "appear-header-size-" + headerSizeSuffix;

			nThis.eHeader.classList.add(headerTypeClass);
		}

		nThis.eDescriptionAndImageWrap = null;
		// If eDescription or eImage are going to be created, create a wrapper for them.
		// This is required to let css flex set row or column mode.
		if (inInfoDescription.description != null || inInfoDescription.image != null) {
			nThis.eDescriptionAndImageWrap = UIUtils.appendInnerHTML(nThis.element, `<div class="story-reader-info-panel-info-description-and-image-wrap"></div>`);
		}
		
		nThis.eImage = null;
		if (inInfoDescription.image != null) {
			nThis.eImage = UIUtils.appendInnerHTML(nThis.eDescriptionAndImageWrap, `<img class="story-reader-info-panel-info-image">`);
			nThis.eImage.src = PathUtils.getStoryImagesPath(app.readerData.getActiveStoryTitle(), inInfoDescription.image);

			// I'm not expecting a null or bad value but I default to a value anyway.
			let imageModeSuffix = "col";
			if (inInfoDescription.image_mode == "Row") {
				imageModeSuffix = "row";
			}

			const imageModeTypeClass = "appear-image-mode-" + imageModeSuffix;

			nThis.eDescriptionAndImageWrap.classList.add(imageModeTypeClass);
		}

		nThis.eDescription = null;
		if (inInfoDescription.description != null) {
			nThis.eDescription = UIUtils.appendInnerHTML(nThis.eDescriptionAndImageWrap, `<p class="story-reader-info-panel-info-description"></p>`);
			nThis.eDescription.innerText = inInfoDescription.description;			
		}
		
        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.element.remove();
        this.element = null;

		this.eHeader = null;
		this.eDescriptionAndImageWrap = null;
		this.eImage = null;
		this.eDescription = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`<div class="story-reader-info-panel-info"></div>`);
    }
}