/*****
** 
*****/
class DownloadUtils {
    static downloadJson(inJson, inFileName) {
        // I would prefer to implement automatic loading / saving of userdata from the working directory. not supported yet.
        // https://stackoverflow.com/questions/42743511/reading-writing-to-a-file-in-javascript
        // https://developer.chrome.com/articles/file-system-access/
        const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(inJson, null, 2)], { type: "application/json" }));
        let link = document.createElement("a");
        link.download = inFileName;
        link.href = blobUrl;
        link.click();
        link.remove();
    }
}