/*****
** AudioTrack plays audio and fades out / in volume when requested to play new audio.
** Used together with AudioController.
*****/
class AudioTrack {
    constructor() {
        this.audioName =  null;
        this.requestedStoryName = null;
        this.requestedAudioName = null;
        this.audio =  null;
        this.fadeIntervalHandle =  null;
        // fadeDuration: Integer >= 1.
        this.fadeDuration = 500;
        this.fadePosition =  0;
        // Integer >= 0 && <= 1.
        this.targetVolume = 1;
    }
	
	static create() {
        /* Setup */

        let nThis = new this();

        /* Return self */

        return nThis;
    }
	
	prepareRemoval() {
        window.clearInterval(this.fadeIntervalHandle);

        this.stopAudioDirectly();
        
        // console.log("Prepared removal of self");
    }

    stopAudioDirectly() {
		this.audioName = null;
		if (this.audio != null) {
			// console.log(`Audio: ${this.audioName}, Stopping.`);
			this.audio.pause();
			this.audio = null;
		}
    }

    getRequestedAudioName() {
        return this.requestedAudioName;
    }

    setAudio(inStoryName, inAudioName, inLoop, inAllowReRequest, inFadeDuration, inTargetVolume) {
        if (!inAllowReRequest
            && inStoryName == this.requestedStoryName 
            && inAudioName == this.requestedAudioName
            ) {
            // No change. Do nothing. Don't restart.
            // console.debug(`Audio: ${this.requestedAudioName}, already requested.`);
            return;
        }

        this.requestedStoryName = inStoryName;
        this.requestedAudioName = inAudioName;

        window.clearInterval(this.fadeIntervalHandle);

        this.fadeDuration = Math.max(1, inFadeDuration);
        this.fadePosition = this.audio != null ? this.fadeDuration * -1 : 0;
        this.targetVolume = Math.max(0, Math.min(1, inTargetVolume));

        this.fadeIntervalHandle = window.setInterval(() => { 
            if (this.audio != null) {
                // 1 to 0, then 0 to 1, assuming this.targetVolume == 1.
                let volInterp = Math.abs(this.fadePosition / this.fadeDuration) * this.targetVolume;
                // When fading out, avoid bumping up volume back to one for requrring requests.
                // The latest audio request will be fading in after the first fade out completes,
                // So rushing through the story won't make the audio sound crazy.
                const isFadingOut = this.fadePosition < 0;
                if (isFadingOut) {
                    if (volInterp > this.audio.volume) {
                        // console.log(`Audio: ${this.audioName}, clamping volume to resume fade out.`);
                        volInterp = this.audio.volume;
                    }
                }

                this.audio.volume = volInterp;
            }

            if (this.fadePosition == 0) {
                // Stop current audio.

				this.stopAudioDirectly();

                // Start new audio.

                this.audioName = inAudioName;

                if (this.audioName != null) {
                    this.audio = new Audio(PathUtils.getStoryAudioPath(this.requestedStoryName, this.audioName));
                    if (this.audio == null) {
                        console.error(`Audio: ${this.audioName}, error`);
                        window.clearInterval(this.fadeIntervalHandle);
                        return;
                    }
                    // console.log(`Audio: ${this.audioName}, Playing`);
                    this.audio.loop = inLoop;
                    this.audio.play();
                    // console.log(`Audio: ${this.audioName}, target volume: ${this.targetVolume}`);
                }
                else {
                    // Can stop here, because there is no new audio. We faded out to null.
                    // console.log(`Audio: ${this.audioName}, fade out completed.`);
                    window.clearInterval(this.fadeIntervalHandle);
                }
            } 
            else if (this.fadePosition >= this.fadeDuration - 1) {
                // console.log(`Audio: ${this.audioName}, fade out and in completed.`);
                window.clearInterval(this.fadeIntervalHandle);
            }

            // Increment with 1MS, just like the interval.
            this.fadePosition++;
        }, 1);
    }
}