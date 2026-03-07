/*****
** 
*****/
class ReaderDataImporterUtils {
    static async import(inUserdata, inDataStruct) {
        let newData = {
            progress: {
                active_story_title: "",
                stories: {}
            },
            stories: {}
        };

        let result = {
            detectedError: false,
            isWriterCriticalError: false
        }

        for (const [key, value] of Object.entries(inDataStruct.stories)) {
            // If not set up yet, set up the default structure for this story.
            let newStory = newData.stories[key];
            if (newStory == null) {
                newStory = this.getBaseStoryStructure();
            }

            // Import story.
            // Contains the text blocks that make the story, and the About info.
            try {
                newStory = JSON.parse(await value.text.story.text());
            }
            catch {
                alert(`Error: story.json contains a syntax error. Story: ${key}`);
                result.detectedError = true;
                result.isWriterCriticalError = true;
            }

            // Do some checks

            const isNullOrEmpty = function(inVal) {
                // I used to do just a null check here back when "about" was still edited as a text file about.json,
                // To make sure that fields weren't missing.
                //
                // I'm not doing more than just a basic check. 
                // I want to avoid users of writer mode writing empty strings, 
                // just because there is no point of showing fields to a reader if the values are "".
                // The app's writer mode does field validation on strings, so strings like "     ", already become "". Makes the check simple. 
                // I'm not checking for everything that could go wrong for editing JSON directly with a text editor etc.
                return (inVal == null || inVal === "");
            }

            if (isNullOrEmpty(newStory.about.author)
                || isNullOrEmpty(newStory.about.genre)
                || isNullOrEmpty(newStory.about.age)
                || isNullOrEmpty(newStory.about.version)
                || isNullOrEmpty(newStory.about.copyright)
                || isNullOrEmpty(newStory.about.language)
                || isNullOrEmpty(newStory.about.description)
                || isNullOrEmpty(newStory.about.storyCoverImage)
                || isNullOrEmpty(newStory.about.readingLayout)
                || isNullOrEmpty(newStory.about.showEmptyTextColumn)
                || isNullOrEmpty(newStory.about.hideTitleWhileReading)
            ) {
                alert(`Error: Missing / empty "about" fields detected in story.json. Story: ${key}`);
                result.detectedError = true;
                // Not writer critical, because the about section can now be edited in writer mode.
            }
            
            // Do some checks

            if (newStory.about.readingLayout != "Column"
                && newStory.about.readingLayout != "Column (compact)"
                && newStory.about.readingLayout != "Row"
                && newStory.about.readingLayout != "Row (compact text)"
                && newStory.about.readingLayout != "Row (compact)"
            ) {
                alert(`Error: Field 'readingLayout' in About in story.json does not have a valid value. Story: ${key}`);
                result.detectedError = true;
                // Doesn't seem to break anything in writer mode,
                // So I'm not marking this as writer critical.
            }

            // Done

            newData.stories[key] = newStory;
        }

        // Now that the new story data is present, I want to loop over all text blocks per story to check for missing audio / image files.
        for (const [storyKey, storyVal] of Object.entries(newData.stories)) {
            for (const [blockKey, blockVal] of Object.entries(storyVal.story)) {
                if (blockVal.music != null) {
                    // "stop" Is allowed in the field to stop audio from playing.
                    if (blockVal.music != "stop") {
                        if (!inDataStruct.stories[storyKey].audio.includes(blockVal.music)) {
                            alert(`Error: Missing audio file: ${blockVal.music}, for story: ${storyKey}`);
                            result.detectedError = true;
                        }
                    }
                }
                if (blockVal.ambience != null) {
                    // "stop" Is allowed in the field to stop audio from playing.
                    if (blockVal.ambience != "stop") {
                        if (!inDataStruct.stories[storyKey].audio.includes(blockVal.ambience)) {
                            alert(`Error: Missing audio file: ${blockVal.ambience}, for story: ${storyKey}`);
                            result.detectedError = true;
                        }
                    }
                }
                if (blockVal.sound != null) {
                    if (!inDataStruct.stories[storyKey].audio.includes(blockVal.sound)) {
                        alert(`Error: Missing audio file: ${blockVal.sound}, for story: ${storyKey}`);
                        result.detectedError = true;
                    }
                }
                if (blockVal.image != null) {
                    if (!inDataStruct.stories[storyKey].images.includes(blockVal.image)) {
                        alert(`Error: Missing image file: ${blockVal.image}, for story: ${storyKey}`);
                        result.detectedError = true;
                    }
                }
            }
        }

        // The progress data still needs to be set up.
        try {
            // console.log("Detected progress.json. Parsing for reader progress: ")
            const importedData = JSON.parse(await inDataStruct.progress.text());

            if (Object.entries(importedData).length == 0) {
                // console.log("progress.json data empty. Using defaults for reader progress.");
            }
            else {
                // console.log("Reader progress from progress.json used.");
                newData.progress = importedData.reader.progress;
            }
        }
        catch {
            alert(`Error: progress.json contains a syntax error.`);
            result.detectedError = true;
            result.isWriterCriticalError = true;
        }
        // Add in default data structure in progress, for new stories.
        for (const [keyStory, valueStory] of Object.entries(newData.stories)) {
            if (newData.progress.stories[keyStory] != null) {
                // Already got data in there.
                continue;
            }

            newData.progress.stories[keyStory] = this.GetDefaultProgressStructure();
        }

        // All data is now present. I'm going to do additional validation on text block referencing:

        // TODO now all new data is built, I would really like to validate if all text block are reachable (by info condition).
        // A structedClone of Userdata could simulate the pathing, but,
        // Rn I can't think of a pathing solver that would work with the text block's info field system, 
        // besides walking at random like a reader does.
        // The info system can change the available path and end at each step, and loop back on itself.
		//
		// TODO now I've made the "info panel" and "info panel description" system those have info conditions as well (has_info, not_info),
		// that could use some sort of reachability checks.
        //
        // The above not being implemented, I will do some other checks to filter writer errors:
        for (const [keyStory, valueStory] of Object.entries(newData.stories)) {
            // First collect the mentioned information.

            const addUniqueStrArr = function (inContainer, inDataArr) {
                if (inDataArr != null) {
                    for (const dataX of inDataArr) {
                        if (!inContainer.includes(dataX)) {
                            inContainer.push(dataX);
                        }
                    }
                }
            }

            const addUniqueStr = function (inContainer, inData) {
                if (inData != null) {
                    if (!inContainer.includes(inData)) {
                        inContainer.push(inData);
                    }
                }
            }

            let textValidation = {};
            textValidation.foundStoryEnding = false;
            textValidation.text_ids = [];
            textValidation.next_ids = [];
            textValidation.add_infos = [];
            textValidation.rem_infos = [];
            textValidation.has_infos = [];
            textValidation.not_infos = [];

            // Collect unique strings from all text blocks in this story.
            for (const [keyB, valueB] of Object.entries(valueStory.story)) {
                if (valueB.next == null) {
                    textValidation.foundStoryEnding = true;
                }
                else if (valueB.next.length == 0) {
                    alert(`Error: Story: ${keyStory}, contains a \"next\" of 0 length.`);
                    result.detectedError = true;
                }
                addUniqueStr(textValidation.text_ids, keyB);
                addUniqueStrArr(textValidation.next_ids, valueB.next);
                addUniqueStrArr(textValidation.add_infos, valueB.add_info);
                addUniqueStrArr(textValidation.rem_infos, valueB.rem_info);
                addUniqueStrArr(textValidation.has_infos, valueB.has_info);
                addUniqueStrArr(textValidation.not_infos, valueB.not_info);
            }

            // Collect unique strings from info panels in this story.
            for (const [panelKey, panelVal] of Object.entries(valueStory.infoPanels)) {
                addUniqueStrArr(textValidation.has_infos, panelVal.has_info);
                addUniqueStrArr(textValidation.not_infos, panelVal.not_info);

                for (const [descKey, descVal] of Object.entries(panelVal.infoDescriptions)) {
                    addUniqueStrArr(textValidation.has_infos, descVal.has_info);
                    addUniqueStrArr(textValidation.not_infos, descVal.not_info);
                }
            }

            // console.log(`Story: ${keyStory}, text information collected for validation: `);
            // console.log(textValidation);

            // Now do the tests.

            // - See if at least one text block has no "next" id (story ending).
            if (textValidation.foundStoryEnding == false) {
                alert(`Error: Story: ${keyStory}, ending text block missing.`);
                result.detectedError = true;
            }
            // - See if text id "0" exists (the first text block).
            if (!textValidation.text_ids.includes("0")) {
                alert(`Error: Story: ${keyStory}, text block with id \"0\" is missing.`);
                result.detectedError = true;
            }
            // - See if all text ids exist as "next" id, skip check on "0".
            for (const valX of textValidation.text_ids) {
                if (valX == "0") {
                    // Skip first text block id.
                    continue;
                }
                if (!textValidation.next_ids.includes(valX)) {
                    alert(`Error: Story: ${keyStory}, text block id is not referenced by any \"next\". Id: ${valX}`);
                    result.detectedError = true;
                }
            }
            // - See if all "next" ids exist as text id.
            for (const valX of textValidation.next_ids) {
                if (!textValidation.text_ids.includes(valX)) {
                    alert(`Error: Story: ${keyStory}, \"next\" id does not exist as text block id: ${valX}`);
                    result.detectedError = true;
                }
            }
            // - See if all "rem_info" is present as "add_info".
            for (const valX of textValidation.rem_infos) {
                if (!textValidation.add_infos.includes(valX)) {
                    alert(`Error: Story: ${keyStory}, \"rem_info\" references info that is never added: ${valX}`);
                    result.detectedError = true;
                }
            }
            // - See if all "add_info" is used as "has_info" OR "not_info".
            for (const valX of textValidation.add_infos) {
                if (!textValidation.has_infos.includes(valX) && !textValidation.not_infos.includes(valX)) {
                    alert(`Error: Story: ${keyStory}, \"add_info\" references info that is never used by \"has_info\" or \"not_info\": ${valX}`);
                    result.detectedError = true;
                }
            }
            // - See if all "has_info" is present as "add_info"
            for (const valX of textValidation.has_infos) {
                if (!textValidation.add_infos.includes(valX)) {
                    alert(`Error: Story: ${keyStory}, \"has_info\" references info that is never added: ${valX}`);
                    result.detectedError = true;
                }
            }
            // - See if all "not_info" is present as "add_info"
            for (const valX of textValidation.not_infos) {
                if (!textValidation.add_infos.includes(valX)) {
                    alert(`Error: Story: ${keyStory}, \"not_info\" references info that is never added: ${valX}`);
                    result.detectedError = true;
                }
            }
        }

        // Done!

        if (!result.detectedError
            || (app.writerModeEnabled && !result.isWriterCriticalError)
            ) {
            inUserdata.setData(newData);
        }
        else {
            alert("Errors must be fixed before this data can be loaded in reader mode.");
        }

        return result;
    }

    static getBaseStoryStructure() {
        return {
            about: {
                author: null,
                genre: null,
                age: null,
                version: null,
                copyright: null,
                description: null,
                storyCoverImage: null
            },
            story: {},
            infoPanels: {},
        }
    }

    static GetDefaultProgressStructure() {
        return {
            // "text_block_path" will start at "0", and collect "next" id navigation as a path. Last entry is the latest text block id.
            text_block_path: [],
            // Contains the info that is currently given.
            info: [],
        };
    }
}