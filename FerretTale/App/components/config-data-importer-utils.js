/*****
** 
*****/
class ConfigDataImporterUtils {
    static async import(inConfigData, inDataStruct) {
        try {
            let dataToUse = {
                "pc_reading_layout": "Writer decides",
                "music_volume": "1",
                "ambience_volume": "1",
                "sound_effects_volume": "1",
                "enable_help_page": true,
                "save_file_download_reminder": true
            };

            // console.log("Detected progress.json. Parsing for config: ")
            const importedData = JSON.parse(await inDataStruct.progress.text());

            if (Object.entries(importedData).length == 0) {
                // console.log("progress.json data empty. Using defaults for config.");
            }
            else {
                dataToUse = importedData.config;
                // console.log("config from progress.json used.");
            }

            inConfigData.setData(dataToUse);
            return true;
        }
        catch {
            alert("Error: progress.json contains a syntax error.");
            return false;
        }
    }
}