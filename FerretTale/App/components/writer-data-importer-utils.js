/*****
** 
*****/
class WriterDataImporterUtils {
    static async import(inUserdata, inDataStruct) {
        let newData = {
            progress: {
                // active_story_title: null,
                stories: {

                }
            },
        };
        
        try {
            // console.log("Detected progress.json. Parsing for reader progress: ")
            const importedData = JSON.parse(await inDataStruct.progress.text());

            if (Object.entries(importedData).length == 0) {
                // console.log("progress.json data empty. Using defaults for reader progress.");
            }
            else {
                // console.log("Reader progress from progress.json used.");
                newData = importedData.writer;
            }
        }
        catch {
            alert(`Error: progress.json contains a syntax error.`);
            return false;
        }

        // Done!

        inUserdata.setData(newData);
        return true;
    }

    static GetDefaultProgressStructure() {
        return {
            about: {},
            story: {},
            last_visited_node_id: "0",
            infoPanels: {},
            last_visited_info_panel_id: null
        };
    }
}