/*****
** This class imports and exports userdata, in their folder or merged json forms.
** Imported "Userdata" itself is stored as json on app, split into "reader data", "writer data", "config data".
**
** This class detects problem / blacklisted paths, regardless of app mode (reader / writer), during import.
** After passing global checks, the collected importable data is sent to sub importers, which fill in the actual userdata.
**
** This class can also export the userdata by recombining mentioned json and exporting it as a single progress.json file.
*****/
class UserdataPorter {
    constructor() {
        this.hasImportedSuccess = false;
    }
	
	static create() {
        /* Setup */

        let nThis = new this();

        nThis.element = document.createElement("div");

        /* Return self */

        return nThis;
    }

    prepareRemoval() {
        this.element.remove();
        this.element = null;

        // console.log("Prepared removal of self");
    }

    async importUserdataFolder(inFileList) {
        const loadDataFromFileCriticalError = new Event('load-data-from-file-critical-error', { bubbles: false });

        if (this.hasImportedSuccess) {
            console.error("Importing the userdata folder after first success is not allowed.");
            this.element.dispatchEvent(loadDataFromFileCriticalError);
            return;
        }

        // console.log("Starting import of userdata folder.");
       
        const collected = UserdataPorter.collectImportableData(inFileList);
        if (!collected.success) {
            this.element.dispatchEvent(loadDataFromFileCriticalError);
            return;
        }

        // outData contains the file information that we require for the importers.
        // Global cases have been handled by the prior import utils.
        // Validation and importing specific to the following importers is done there.
        //
        // If the app runs in writer mode, I want to show errors detected on reader data, but not abort the import as failure.
        // Reason: Writers don't end up on the reader pages of the app, and might fix writing (import) errors on the writing pages.
        // If in reader mode, importing errors should abort the import as failure.
        //
        // What might look odd is that I import both reader data and writer data.
        // Currently browsers require users to manually upload and download the "userdata" as a file. 
        // A single file. (multiple auto downloads results in an auto block, for similar browser security reasons.) 
        // That single file (progress.json) contains the config, reader and writer data combined.
        // So when importing and exporting, I need to split and merge that file into the data mentioned before.
        // So, I just build the complete thing here right away for now.
        
        if (!(await ConfigDataImporterUtils.import(app.configData, collected.data))) {
            this.element.dispatchEvent(loadDataFromFileCriticalError);
            return;
        }
        const readerImportResult = await ReaderDataImporterUtils.import(app.readerData, collected.data);
        if (readerImportResult.detectedError) {
            if (app.writerModeEnabled) {
                // Fully imported reader data is required to build data in writer mode.
                // This is where writer mode loads its story from initially (or when clicking the reset story button).
                // If errors are correctable from within writer mode, we don't refuse the import.
                if (readerImportResult.isWriterCriticalError) {
                    this.element.dispatchEvent(loadDataFromFileCriticalError);
                    return;
                }
                else {
                    console.warn("An error was detected during import of reader data. The import will not be aborted, because we are in writer mode. Attempt to fix the error through writer mode is allowed.");
                }
            }
            else {
                this.element.dispatchEvent(loadDataFromFileCriticalError);
                return;
            }
        }
        if (!(await WriterDataImporterUtils.import(app.writerData, collected.data))) {
            this.element.dispatchEvent(loadDataFromFileCriticalError);
            return;
        }

        this.hasImportedSuccess = true;
        // console.log("Rebuilt userdata. Success!");

        const loadedDataFromFileEvent = new Event('loaded-data-from-file', { bubbles: false });
        this.element.dispatchEvent(loadedDataFromFileEvent);
    }

    static collectImportableData(inFileList) {
        let result = {
            // Don't confuse this with the format we see in progress.json!
            // I'm just collecting files info here.
            data: {
                // Per story files:
                stories: {},
                // The json file:
                progress: null,
            },
            success: false
        }

        if (!inFileList || inFileList.length < 1) {
            alert("Error: Received an empty file list.");
            return result;
        }
		
        for (let i = 0; i < inFileList.length; i++) {
            const fileX = inFileList[i];
            const path = fileX.webkitRelativePath;
            const pathStructure = path.split("/");
            // console.debug(pathStructure);

            if (pathStructure.length == 0 || pathStructure[0] != 'userdata') {
                alert("Error: An invalid path was detected on the uploaded folder. The first folder should be named 'userdata'.");
                return result;
            }

            const testedUnsupportedChars = PathUtils.findUnsupportedUserdataChars(path);
            if (testedUnsupportedChars.length > 0) {
                alert(`Error: Unsupported character(s) detected:\r\n\r\n${testedUnsupportedChars.join().replaceAll(",", "")}\r\n\r\nPlease remove the character(s) from your path: ${path}`);
                return result;
            }

            if (pathStructure[1] === "stories") {
                if (pathStructure.length >= 3 && (
                    pathStructure[3] == ".git"
                    || pathStructure[3] == "README.md"
                    || pathStructure[3] == "LICENSE.md"
                )) {
                    // Allow the git related paths, but don't do anything with them.
                    // It's valid for writers to include their Git right here.
                    // console.debug(`Skipping Git path in userdata: ${path}`);
                    // Nothing else to do but ignore.
                    continue;
                }

                if (pathStructure.length >= 2 && pathStructure[2] == "Writer Template") {
                    // The Writer Template story is not an in-app demo like the Ferret Tale story.
                    // Instead, it's a folder there for writers, who can duplicate the folder to create their own story more quickly.
                    // Nothing else to do but ignore.
                    continue;
                }

                if (pathStructure.length != 5) {
                    if (pathStructure.length >= 3 && pathStructure[2] != fileX.name) {
                        alert(`Error: Invalid file path detected within story. Path: ${path}`);
                        return result;
                    }
                    else {
                        alert(`Error: Invalid path (not 5 in length): ${path}`);
                        return result;
                    }
                }

                // Add story structure that importers will be reading.
                if (result.data.stories[pathStructure[2]] == null) {
                    result.data.stories[pathStructure[2]] = {
                        audio: [],
                        images: [],
                        text: {
                            story: null,
                        }
                    }
                }

                if (pathStructure[3] == "audio") {
                    result.data.stories[pathStructure[2]].audio.push(fileX.name);
                }
                else if (pathStructure[3] == "images") {
                    result.data.stories[pathStructure[2]].images.push(fileX.name);
                }
                else if (pathStructure[3] == "text") {
                    if (fileX.name == "story.json") {
                        result.data.stories[pathStructure[2]].text.story = fileX;
                    }
                    else {
                        alert(`Error: Unused file present in text folder. Path:\r\n${path}`);
                        return result;
                    }
                }
                else {
                    alert(`Error: Invalid path. Expecting folders audio, images, text. Path:\r\n${path}`);
                    return result;
                }
            }
            else if (pathStructure[1] == "progress") {
                if (pathStructure.length == 3 && pathStructure[2] == "progress.json") {
                    result.data.progress = fileX;
                }
                else {
                    alert(`Error: The path to progress.json should be /userdata/progress/progress.json. Path:\r\n${path}`);
                    return result;
                }
            }
            else {
                alert(`Error: An invalid path was detected on the uploaded folder:\r\n${path}`);
                return result;
            }
        }

        if (Object.entries(result.data.stories).length == 0) {
            alert("Error: No stories detected in userdata.");
            return result;
        }

        if (result.data.progress == null) {
            alert(`Error: Missing progress.json`);
            return result;
        }
        for (const [key, value] of Object.entries(result.data.stories)) {
            if (value.text.story == null) {
                alert(`Error: Missing story.json for story: ${key}`);
                return result;
            }
        }

        result.success = true;

        // console.debug("Collected importable data:");
        // console.debug(result);
        // console.debug("From file list:");
        // console.debug(inFileList);

        return result;
    }

    exportProgressJson() {
        // This exports the user's current progress from the app into progress.json, then downloads the file.
        // The file must be moved manually to /userdata/progress/ by the reader.

        // First finalize editing, if required.
        UIUtils.resetFocus();

        app.writerData.optimizeJSON();

        // Using structuredClone to actually make a copy before cleaning up the data.
        let outJson = structuredClone({
            reader: app.readerData.data,
            writer: app.writerData.data,
            config: app.configData.data
        });

        // Of course the stories in the reader data that are not progress should be removed,
        // because they are reconstructed on each import.
        outJson.reader.stories = {};

        DownloadUtils.downloadJson(outJson, "progress.json");

        const exportedDataToFileEvent = new Event('exported-data-to-file', { bubbles: false });
        this.element.dispatchEvent(exportedDataToFileEvent);

        if (app.configData.getConfigVal("save_file_download_reminder")) {
            alert("Look if progress.json just arrived at your downloads folder.\r\nThis contains your current progress.\r\n\r\nMove it into this app's '/userdata/progress/' folder,\r\noverwriting the old progress.json.\r\n\r\nIt will be loaded next time you load the userdata folder.");
        }

        // const exampleFormat = {
        //     reader: {
        //         progress: {
        //             active_story_title: "",
        //             stories: {
        //                 "story title X": {
        //                     text_block_path: [],
        //                     info: [],
        //                 }
        //             }
        //         },
        //         stories: {
        //             // Must null data in export clone, because it's reconstructable data.
        //         }
        //     },
        //     writer: {
        //         progress: {
        //             active_story_title: "",
        //             stories: {
        //                 "story x": {
        //                     last_visited_node_id: "17",
        //                     about: {
        //                         author: "",
        //                         genre: "",
        //                         age: "All",
        //                         version: "1.00",
        //                         copyright: "",
        //                         language: "English",
        //                         description: "This is an example.",
        //                         storyCoverImage: "story_cover_image.jpg",
        //                         readingLayout: "Row (compact)",
        //                         showEmptyTextColumn: true,
        //                         hideTitleWhileReading: false
        //                     },
        //                     story: {
        //                         "0": {
        //                             next: ["1"],
        //                             text: "The example story starts here."
        //                         },
        //                         "1": {
        //                             text: "The end."
        //                         }
        //                     },
        //                     infoPanels: {
        //                         "0": {
        //                             header: "Test Panel",
        //                             description: "A description",
        //                             image: "TestImage.jpg",
        //                             has_info: ["some_info"],
        //                             not_info: ["other_info"],
        //                             header_size: "Normal",
        //                             image_mode: "Column"
        //                         }
        //                     },
        //                     last_visited_info_panel_id: null
        //                 }
        //             }
        //         }
        //     },
        //     config: {
        //         pc_reading_layout: "Writer decides",
        //         music_volume: "1",
        //         ambience_volume: "1",
        //         sound_effects_volume: "1",
        //         enable_help_page: true,
        //         save_file_download_reminder: true
        //     }
        // };
    }
}