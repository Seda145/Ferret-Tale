/*****
** Independend global utility to retrieve filesystem paths.
** Used to build absolute paths when the app's root folder has to be figured out.
*****/
class PathUtils {
    static getAppName() {
        return "FerretTale";
    }

    static getAppDisplayName() {
        return "Ferret Tale";
    }

    static getUnsupportedUserdataChars() {
        // I ran into the issue earlier that if a user made story has a name with a "#" in it,
        // Any file requests on audio would fail. The get request would cut off the local url at the #.
        // TODO: What exact symbols are a problem and when (what browser, what OS, what about other languages? etc.)
        // Currently I just added a bunch "just in case".
        // If I run a UserdataPorter check on this, we can halt any path with a certain char.
        return ['`', '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '\\', '|', '[', ']', '{', '}', ':', ';', '\'', '"', ',', '<', '>', '?'];
		// TODO On my next app "Heartbeat" I didn't get the above symbol issue on audio paths, 
		// perhaps because I take the file references directly from the import data (instead of rebuilding).
		// System needs another look to see if Ferret Tale should do the same.
    }

    static findUnsupportedUserdataChars(inString) {
        let unsupportedChars = [];

        for (const charX of inString) {
            if (PathUtils.getUnsupportedUserdataChars().includes(charX)) {
                if (!unsupportedChars.includes(charX)) {
                    // console.log(`unsupported char detected: ${charX} in string: ${inString}`);
                    unsupportedChars.push(charX);
                }
            }
        }

        return unsupportedChars;
    }

    static getAppRootPath() {
        return document.location.pathname.split('/' + PathUtils.getAppName() + '/App/')[0] + '/' + PathUtils.getAppName() + '/App/';
    }

    static getAppMediaPath() {
        return PathUtils.getAppRootPath() + 'media/';
    }

    static getAppMediaHelpPath() {
        return PathUtils.getAppRootPath() + 'media/help/';
    }

    static getAppMediaIconsPath() {
        return PathUtils.getAppRootPath() + 'media/icons/';
    }

    static getUserdataPath() {
        return PathUtils.getAppRootPath() + "userdata/";
    }

    static getStoriesPath() {
        return PathUtils.getUserdataPath() + "stories/";
    }

    static getStoryPath(inStoryName) {
        return PathUtils.getStoriesPath() + inStoryName + "/";
    }

    static getStoryAudioPath(inStoryName, inFileName) {
        return PathUtils.getStoryPath(inStoryName) + "audio/" + inFileName;
    }
    
    static getStoryImagesPath(inStoryName, inFileName) {
        return PathUtils.getStoryPath(inStoryName) + "images/" + inFileName;
    }

    static getStoryTextPath(inStoryName, inFileName) {
        return PathUtils.getStoryPath(inStoryName) + "text/" + inFileName;
    }
}