/*****
** A content page, that can be injected by PageInjector on demand.
**
** This component expects that Userdata has already activated a story, and will not swap stories while this component is in use.
** The design favors component recreation over event response complexity.
*****/
class StoryPage {
    static create(inScopeElement) {
        /* Setup */

        let nThis = new this();

        nThis.acEventListener = new AbortController();

        nThis.storyTextBlocks = [];
        nThis.musicTitle = null;
        nThis.music = null;

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="injected-page"]'), nThis.getHTMLTemplate());

        nThis.eStoryPageTitle = nThis.element.querySelector(".story-page-title");
        nThis.eStoryPageTitle.innerText = app.readerData.getActiveStoryTitle();

        if (app.readerData.getAbout().hideTitleWhileReading === true) {
            nThis.eStoryPageTitle.classList.add("disabled");
        }

        nThis.eStoryTextBlockWrap = nThis.element.querySelector(".story-text-block-wrap");

        nThis.storyReaderInteractionBar = StoryReaderInteractionBar.create(nThis.element);

        nThis.fillInTextBlocksToPath();

        /* Events */

        app.readerData.element.addEventListener("pushed-story-text-block-id", nThis.actOnReaderDataPushedStoryTextBlockId.bind(nThis), { signal: nThis.acEventListener.signal });

        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        this.acEventListener.abort();

        // console.log(`StoryPage is preparing removal. It stops audioTracks: ${app.audioController.getMusicTrackId()}, ${app.audioController.getAmbienceTrackId()}, ${app.audioController.getSoundTrackId()}.`);
        console.debug("Closing story page.\r\n\r\n");

        app.audioController.stopAudio(app.audioController.getMusicTrackId(), app.audioController.longFadeDuration);
        app.audioController.stopAudio(app.audioController.getAmbienceTrackId(), app.audioController.longFadeDuration);
        app.audioController.stopAudio(app.audioController.getSoundTrackId(), app.audioController.longFadeDuration);

        this.removeTextBlocks();

        this.storyReaderInteractionBar.prepareRemoval();
        this.storyReaderInteractionBar = null;

        this.element.remove();
		this.element = null;

        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`
 
<div class="story-page">
    <div class="max-width-wrap">
        <h1 class="story-page-title"></h1>

        <div class="story-text-block-wrap">

        </div>
    </div>

    <div data-component="story-reader-interaction-bar"></div>
</div>

        `);
    }

    removeTextBlocks() {
        for (let storyTextBlockX of this.storyTextBlocks) {
            storyTextBlockX.prepareRemoval();
        }
        this.storyTextBlocks = [];
    }

    fillInTextBlocksToPath() {
        // This method compares this.storyTextBlocks.length to app.readerData.getTextBlockPath().length.
        // On a mismatch, we read the missing id(s) from readerData, and add those to this.storyTextBlocks to match the path length again.
        // This method does not do any validation, historic alteration or other extras.

        // console.log(`Reconstructing story from text block path: ${app.readerData.getTextBlockPath()}`);
        console.debug(`Id: ${app.readerData.getTextBlockId()}: Showing text block.`);

        const MyPathLength = this.storyTextBlocks.length;
        const userdataPathLength = app.readerData.getTextBlockPath().length;

        if (MyPathLength > userdataPathLength) {
            console.error("StoryPage text block amount > userdata text block path length. This should never happen.");
            return;
        }
        if (MyPathLength == userdataPathLength) {
            // Nothing to do.
            return;
        }

        const lengthDiff = userdataPathLength - MyPathLength;

        for (let i = app.readerData.getTextBlockPath().length - lengthDiff; i < app.readerData.getTextBlockPath().length; i++) {
            const tId = app.readerData.getTextBlockPath()[i];
            this.storyTextBlocks.push(StoryTextBlock.create(this.eStoryTextBlockWrap, tId));
        }

        // Immediately move scroll to the latest text block.
        if (lengthDiff > 1) {
            // If there are more than one new text blocks, scroll behavior should be instant.
            // This avoids a looooong scroll down the story when a story is opened.
            this.storyTextBlocks[this.storyTextBlocks.length - 1].element.scrollIntoView({ behavior: 'instant' });
        }
        else {
            this.storyTextBlocks[this.storyTextBlocks.length - 1].element.scrollIntoView();
        }

        // Need to walk back over the path to see if we can recover music to play. 
        // Currently required because not every text block has to trigger a change (or stop) in music.
        // Same mechanism for ambience audio.
        let musicRequest = null;
        let musicOnce = null;
        let musicRequestId = null;
        let ambienceRequest = null;
        let ambienceRequestId = null;
        for (let i = app.readerData.getTextBlockPath().length - 1; i >= 0; i--) {
            const tId = app.readerData.getTextBlockPath()[i];
            const textBlockData = app.readerData.getTextBlockById(tId);
            if (musicRequest == null) {
                if (textBlockData.music != null) {
                    musicRequest = textBlockData.music;
                    musicOnce = textBlockData.music_once;
                    musicRequestId = tId;
                }
            }
            if (ambienceRequest == null) {
                if (textBlockData.ambience != null) {
                    ambienceRequest = textBlockData.ambience;
                    ambienceRequestId = tId;
                }
            }
            if (musicRequest != null && ambienceRequest != null) {
                // Found them both already.
                break;
            }
        }
        if (musicRequest != null) {
            // "stop" stops the audio, otherwise it keeps playing. So if a field is null (or missing), it keeps playing as well. Reduces writer work.
            const audioName = musicRequest == "stop" ? null : musicRequest;
            const canLoop = musicOnce != null ? musicOnce != true : true;
            const currentRequest = app.audioController.getAudioTrack(app.audioController.getMusicTrackId()).getRequestedAudioName();

            if (currentRequest != audioName) {
                // AudioController.setAudio already handles requesting the same title, 
                // but I perform this check here to reduce the console.debug call to changing requests only. 
                // Here I can log the text block Id as well.
                console.debug(`Id: ${musicRequestId}: requests music: ${musicRequest}`);
                app.audioController.setAudio(app.audioController.getMusicTrackId(), app.readerData.getActiveStoryTitle(), audioName, canLoop, false, app.audioController.longFadeDuration, app.configData.getConfigVal("music_volume"));
            }
        }
        if (ambienceRequest != null) {
            // "stop" stops the audio, otherwise it keeps playing. So if a field is null (or missing), it keeps playing as well. Reduces writer work.
            const audioName = ambienceRequest == "stop" ? null : ambienceRequest;
            const currentRequest = app.audioController.getAudioTrack(app.audioController.getAmbienceTrackId()).getRequestedAudioName();

            if (currentRequest != audioName) {
                // AudioController.setAudio already handles requesting the same title, 
                // but I perform this check here to reduce the console.debug call to changing requests only. 
                // Here I can log the text block Id as well.
                console.debug(`Id: ${ambienceRequestId}: requests ambience: ${ambienceRequest}`);
                app.audioController.setAudio(app.audioController.getAmbienceTrackId(), app.readerData.getActiveStoryTitle(), audioName, true, false, app.audioController.longFadeDuration, app.configData.getConfigVal("ambience_volume"));
            }
        }

        // Play the audio effect for the latest text block, if any.
        const tId = app.readerData.getTextBlockId();
        const soundRequest = app.readerData.getTextBlockById(tId).sound;
        if (soundRequest != null) {
            console.debug(`Id: ${tId}: requests sound effect: ${soundRequest}`);
            app.audioController.setAudio(app.audioController.getSoundTrackId(), app.readerData.getActiveStoryTitle(), soundRequest, false, true, app.audioController.shortFadeDuration, app.configData.getConfigVal("sound_effects_volume"));
        }
    }

    /* Events */

    actOnReaderDataPushedStoryTextBlockId() {
        this.fillInTextBlocksToPath();
    }
}