/*****
** AudioController is a manager for playing sound effects and background music, managing them in one place.
*****/
class AudioController {
    constructor() {
        this.audioTracks = {};
        // shortFadeDuration and longFadeDuration are just numbers to read in other classes (for fade consistency.).
        this.shortFadeDuration = 40;
        this.longFadeDuration = 500;
    }

    static create() {
        /* Setup */

        let nThis = new this();

        nThis.addAudioTrack(nThis.getMusicTrackId());
        nThis.addAudioTrack(nThis.getAmbienceTrackId());
        nThis.addAudioTrack(nThis.getSoundTrackId());

        /* Return self */
        
        return nThis;
    }
	
	prepareRemoval() {
        for (let [trackKey, trackVal] of Object.entries(this.audioTracks)) {
            trackVal.prepareRemoval();
        }
        this.audioTracks = {};

        // console.log("Prepared removal of self");
    }

    getAudioTrack(inId) {
        return this.audioTracks[inId];
    }

    addAudioTrack(inId) {
        if (this.audioTracks[inId] != null) {
            console.error(`Audio track with Id exists and can not be added: ${inId}`);
            return;
        }

        this.audioTracks[inId] = new AudioTrack();
    }

    getMusicTrackId() {
        return "music";
    }

    getAmbienceTrackId() {
        return "ambience";
    }

    getSoundTrackId() {
        return "sound";
    }
    
    setAudio(inAudioTrackId, inStoryName, inAudioName, inLoop, inAllowReRequest, inFadeDuration, inTargetVolume) {
        let theAudioTrack = this.getAudioTrack(inAudioTrackId);
        if (theAudioTrack == null) {
            console.error(`The audio track does not exist. Id: ${inAudioTrackId}`);
            return;
        }

        theAudioTrack.setAudio(inStoryName, inAudioName, inLoop, inAllowReRequest, inFadeDuration, inTargetVolume);
    }

    stopAudio(inAudioTrackId, inFadeDuration) {
        this.setAudio(inAudioTrackId, null, null, false, true, inFadeDuration, 1);
    }
}