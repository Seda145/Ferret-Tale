/*****
** A content page, that can be injected by PageInjector on demand.
*****/
class HelpPage {
    static create(inScopeElement) {
        /* Setup */
        
        let nThis = new this();
        
        nThis.helpItems = [];
        nThis.helpItemLinks = [];

        nThis.element = UIUtils.setInnerHTML(inScopeElement.querySelector('[data-component="injected-page"]'), nThis.getHTMLTemplate());

        nThis.eHelpLinksWrap = nThis.element.querySelector(".help-links-wrap");

        nThis.eHelpItemWrap = nThis.element.querySelector(".help-item-wrap");

        nThis.addHelpItems();
        
        /* Return self */
        
        return nThis;
    }

    prepareRemoval() {
        for (let helpItemX of this.helpItems) {
                helpItemX.prepareRemoval();
        }
        this.helpItems = [];

        for (let helpItemLinkX of this.helpItemLinks) {
                helpItemLinkX.prepareRemoval();
        }
        this.helpItemLinks = [];

        this.element.remove();
        this.element = null;
        
        // console.log("Prepared removal of self");
    }

    getHTMLTemplate() {
        const html = (inString) => { return inString };
        //return (html`
        return (`

<div class="help-page">
	<div class="max-width-wrap">
        <h1>Help</h1>
        
        <ul class="help-links-wrap">
                        
        </ul>

        <div class="help-item-wrap">

        </div>
	</div>
</div>

        `);
    }

    addHelpItems() {
		const addHelpItem = function (inThis, inHelpTitle, inImage, inHelpDescription) {
			let newHelpItem = HelpItem.create(inThis.eHelpItemWrap, inHelpTitle, inHelpDescription, inImage);
			inThis.helpItems.push(newHelpItem);
			
			// I chose not to make this a simple anchor link because it turns the URL into hashtag garbage globally.
			// Just as elsewhere in the app I prefer a controllable click event without URL modding.
			inThis.helpItemLinks.push(HelpItemLink.create(inThis.eHelpLinksWrap, inHelpTitle, newHelpItem));
        }
        
        addHelpItem(this, "Introduction", null, `  
This app is used to read and write stories.

It comes with a short demo story called "Ferret Tale".

Readers can enjoy their favorite stories in the calm environment of this app. It comes with a dark red theme, and no distracting elements.

A story can be experienced like a paper book, comic book, audio book, or a full game. This style depends on the writer.

A writer can configure every part of a story with logic, such as decision making, audio to play, or media to show.

The app comes with a writer mode, which visualizes your work and makes projects of any complexity simple to work with.

The features of this writer mode make it great not only for writing stories, but also for writing dialogs and decision making logic in jobs like game development.

Writers can easily share their creations with other app users.

Read the following chapters from top to bottom.
`);    

        addHelpItem(this, "Copyright", null, ` 
The app and all its content (code, graphics, the logo, texts, sound effects, music, music score, etc.) are made by me, Roy Wierer. They are protected. You do not have permission to share anything.

© ${app.publicationYear}: Roy Wierer. All rights reserved.
`);

        addHelpItem(this, "Starting the app", "help_start_app.jpg", `  
The app is made for modern desktop web browsers, and tested on Chrome browser using Windows OS. English was used during testing. The minimum required screen size is 500x500 pixels. Optimal is 1920x1080 pixels. Mouse and keyboard navigation are implemented. Full keyboard navigation is supported. Text is not automatically read in voice. Writers can use media (audio / image) per "text block" of their story. The browser must allow the app to show notification windows (alerts). Use full screen mode (F11) for the best experience.

Download the app to a location on your desktop. The path to this / paths inside this app must not include symbols: ${PathUtils.getUnsupportedUserdataChars().join().replaceAll(",", "")}. The app can not process file paths otherwise. Do not rename or otherwise alter the downloaded folder structure.

To start the app, open "/App/app.htm" in your web browser. The app and stories do not use an internet connection. It works just like a website, but offline.

The app then asks if you want it to run in reader mode or writer mode.

In reader mode, you can sit back and relax reading stories.

In writer mode, you get a complete story creator program, which is very easy to work with. Your story is visualized, all media is previewed, and a lot is automated. 

After selecting the mode, browser (security) asks for this app's "/App/userdata/" folder path. This contains your stories and progress file (saved data). The folder can not be moved.

That's all. The app will automatically navigate to the next page, and new buttons will appear on the navigation panel.

You can run multiple instances (open browser tabs) of the app at once, in any mode. This can be useful to writers.
        `);  

        addHelpItem(this, "Saving and loading my data?", "help_save_export_progress.jpg", `  
The app reconstructs its own data from the userdata folder you load. It does not read changes to this folder after it has been loaded. The app never modifies files on your PC. 

Progress (reader, writer, settings) is not saved automatically. Don't forget to save your progress before closing or refreshing the app.

Browser security does not (yet) allow automated loading / saving. Save your progress often.

You can do so by clicking "Save" on the top menu bar, or by pressing CTRL+S. Saving should download your progress as a file ("progress.json"). Do check your downloads folder to see if your browser did download it.

You must move the downloaded progress.json file into this app's "/userdata/progress/" folder, overwriting the progress.json file that is already there.

This way you can load the updated userdata folder the next time you start the app.

In addition to saving progress, writers can also export a story from writer mode. Clicking the export button (or CTRL+E while writing) downloads story.json for the active story. You can overwrite story.json in your story folder with it. This makes it readable in reader mode. When you click the "reset story" button, you do the opposite. This replaces your writing progress with your imported data.

If you make changes in writer mode, saved progress in reader mode may not be compatible with those changes (indexes change, info changes etc.). You should then restart your story in reader mode. Progress incompatibility is not detected automatically.

In reader mode, invalid userdata is refused. In writer mode, userdata validation is less strict. This allows writers to fix things that can be fixed from within the app. The validation process tests for known problems (such as missing / junk files, broken stories or syntax errors.) This process might be more strict in future app updates (adding new story bug detections).

Important, and general advice: plan + make + test backups of anything you value. Cloud backups are not expensive. I'm not responsible for data / quality loss or inaccessable data. You manage your own versioning + backup plans. I can change any part of my software at any time, and writers will too.
`);

        addHelpItem(this, "How do I update the app, or add / update a story?", null, `  
1. First make a complete backup of everything. 
2. App update? Read its README.md. Replace the downloaded /userdata/ folder with your own existing userdata folder. This transfers your saved data and stories to the new app version.
3. Story update / new story? Put a story folder inside /userdata/stories/ after reading its README.md.
4. Run the app and test if all works as expected. Keep the backups in case you must (or want to) revert the update. A story update might not be compatible with saved reader progress.

Writers can read update instructions down this page at "Publishing stories and updates". 

Git is the recommended way to download updates, because you can track and version updates with it. It is versioning software, not a backup method. Git requires some technical knowledge, and is not required. Users without Git are likely to transfer stories as Zip files.
`);

        addHelpItem(this, "What can I write with this app?", "help_what_can_I_write.jpg", `  
In its simplest form, a "paper book". You can also add images, audio, and logic to turn a story into a complete game.

Even in its most advanced form, writing such a story does not require any technical knowledge. The app's writer mode visualizes everything for you.

You can inspect the demo story "Ferret Tale" in reader and writer mode while reading instructions.
`);        

        addHelpItem(this, "What is the structure of a story folder?", "help_story_folder.jpg", `  
"/userdata/stories/" contains stories. A story is wrapped in its own folder (its title), like "/userdata/stories/Ferret Tale/". 

A different structure is invalid. Any path containing symbols mentioned in chapter "Starting the app" is invalid.

Reader instructions (change log, instructions, credits, FAQ, etc.) are found in:

\t"/\*Story Name\*/README.md"

Story contents and information are found in:

\t"/\*Story Name\*/text/story.json"

Image files are found in:

\t"/\*Story Name\*/images/"

Audio files are found in:

\t"/\*Story Name\*/audio/"

/.git/, license, readme are found in:

\t"/\*Story Name\*/.git/"

\t"/\*Story Name\*/LICENSE.md"

\t"/\*Story Name\*/README.md"

Writers running into trouble during import of a story folder can find more information in chapter "Publishing stories and updates".
`);

        addHelpItem(this, "How do I create my own story?", "help_edit_aboutjson.jpg", `  
You have read the previous chapter "What is the structure of a story folder?". Now you can follow these steps:

1. Duplicate the "Writer Template" story folder.
2. Rename it to the title of your story. Don't use symbol characters.
3. Inside the text folder, alter README.md. 

README.md contains your instructions to users. Users usually open it as a text file (with notepad). 

4. Getting started with my app's writer mode.

You have read chapter "Starting the app". You can now start the app in writer mode, and load the userdata folder as usual. Your story can now be selected in writer mode on the writer toolbar on top of the page.

The button to the right lets you edit in "Content" mode and "About" mode. In "About" mode you edit the details about the story (genre, copyright, language etc.). 

in "Content" mode, you are writing the story itself. How to do that will be continued in a few moments.

In both modes, you can hover configurable fields for an explanation.

5. Add the "/audio/" folder if you will be using it.
6. Edit "/images/story_cover_image.jpg" if you want the image for your story to look nice.

The cover image resolution must be: width: 400px, height: 600px.

7. You can now continue to chapter "How do I write my story?". 

`);      

        addHelpItem(this, "How do I write my story?", "help_reader_story_multichoice.jpg", `  
This chapter continues the previous chapter "How do I create my own story?", instructing using my app's writer mode.

You can inspect my demo story Ferret Tale in both reader and writer mode. A quick look at it can be sufficient to understand the system. It demonstrates all features.

When you're ready, let's edit your own story in my app's writer mode. Select your story and set the editing mode to "Content".


-- In short -- 

The story is built from connected text blocks. A reader navigates through these text blocks from start to end of the story, reading one after another.

A text block contains text for the reader, and optionally extras such as media and logic. In its simplest form, it's a short text referring to the next short text, until the story ends (Connections are one straight line from start to end, 0-1-2-3-4-5). 

Your entire story is visualized as a node tree. Every node is a text block.


-- How can text blocks be connected? -- 

Text block connections are visible on this chapter's image.

A text block's "next" field makes a connection to another text block ID (0 to 1, 1 to 2, etc.).

IDs are automated, but you can make connections yourself by editing the "next" field.

A text block can connect more than once. The story can then progress into one of multiple paths. This situation can be presented to a reader as a multi choice question, or a choice can be randomized without reader interaction.

All the paths combined are your story. This is why the story is visualized like a tree. 

The reader's path starts at "0" (the bottom of the tree), and reader "progress" moves up the tree or into branches, until an end of the reader's path is reached (a "leaf" / top of the tree).


-- Navigating the tree --

In the app's writer mode, you can click buttons to add / delete / navigate through text blocks. Story branches may not be separated from the tree in reader mode.

In this app it's possible for paths to merge or loop (branch tips grow back into the tree). This gives a writer incredible freedom in writing style.


-- Let's start writing -- 

You know now how a story is structured. Theory aside, you just want to start writing. The actual writing process is very fast and simple:


-- How do I set up a single text block? --

Field "Next" refers to which text blocks come next (comma separated id(s)).

Field "Speaker" displays what / who is speaking in your text block (if any).

Field "Text" is text displayed to a reader. If no text is provided, the "text block" will still appear. Media will then show in row layout instead of column.


Click "Add" to directly add a next text block and start editing that. Repeat until the story ends.

That's all there is to know for writing in the basic format (paper book style).


-- How do I export my story to reader mode? --

Changes made in writer mode will appear in reader mode after you export from writer mode (read chapter "Saving and loading my data?").

Continue reading "How do I add media or logic to my story?" to read about more advanced configurations.
`);

        addHelpItem(this, "How do I add media or logic to my story?", "help_writer_text_block_syntax.jpg", `  
This chapter continues chapter "How do I write my story?", and explains advanced configuration of story "text blocks".

If you want something more advanced than a text based "paper book", you can include anything from media to game logic.

Within my app you can hover every field name for a short explanation. Every field is optional. It's just a checkbox or a field you can write in. 

Look at the example image in this chapter, or try my demo story Ferret Tale in my app's reader + writer mode, to see a working example.


-- Media formats --

Image files are added to "/\*Story Name\*/images/". resolution is up to preference. Width will not exceed 1620px on screen. Depending on reading layout setting (and screen size), the image may be displayed much smaller. It will be centered horizontally, and positioned to the right or below your written text (position controlled by reader settings).

Audio files are added to "/\*Story Name\*/audio/". Avoid loud / inconsistent audio volume (unintentional reader scares). Use the Ferret Tale demo as a volume reference.

If your browser supports your media file extension, my app will. Common working extensions are "jpg" for image, "png" for a partially transparent image, "gif" for an animated image, "mp3" for audio.


-- Logic fields --

"Random next": If checked, automatically makes a random choice between "Next" IDs for the reader. Otherwise, the reader can make a choice.

"Has info": This text block can be displayed if the reader has this info.

"Not info": This text block can be displayed if the reader does not have this info.

"Add info": Adds (unique) info. Present info can be detected on any next text block.

"Remove info": Removes info. Avoid (altering history) unless info is clearly temporary.

On all info fields you can write multiple comma separated values. The info system is all you require to set up logic, and further explained in chapter "The 'Info' system in detail".


-- Media fields --

"Music": This is music that you want to play on loop. Enter file name + extension. Stops when any next text block writes "music": "stop".

"Music Once": if checked, disables looping of "music" specified on the same textblock.

"Ambience": This is audio (street, nature, office etc.) that you want to play on loop. Enter file name + extension. Stops when any next text block writes "ambience": "stop".

"Sound": This is an audio effect that you want to play once when the text block is shown. Enter file name + extension.

"Image": This is the image that you want to display next to the text. Enter file name + extension.

If you enter a file name into a field that does not exist, the browser console shows a "ERR_FILE_NOT_FOUND" error. This is not an issue and can be ignored.
`);

		addHelpItem(this, "How do I add media or logic to my story? (JSON version)", "help_writer_text_block_syntax.jpg", `
This chapter is an addition to chapter "How do I add media or logic to my story?" for JSON editors.

Users of my app's writer mode should skip this chapter entirely.

Instructions from here on are in the JSON format. This is the technical explanation for programmers and text editors.


All JSON fields are optional. Unused fields (null / empty / false / etc.) must be removed entirely. Look carefully which input format is used for which field when working in JSON.


For this example, I configured every field possible.

"70": {
\t"next":\t\t["71","72"],
\t"rnd_next":\ttrue,
\t"has_info":\t["misty_park_gate_obstacle_gone"],
\t"not_info":\t["misty_park_gate_locked"],
\t"add_info":\t["arrived_at_misty_park"],
\t"rem_info":\t["can_do_sidestory_lake"],
\t"music":\t\t"music_misty_park.mp3",
\t"music_once":\ttrue,
\t"ambience":\t"ambience_misty_park.mp3",
\t"sound":\t\t"sound_metal_gate.mp3",
\t"image":\t\t"misty_park_gate.jpg",
\t"speaker":\t"James",
\t"text":\t\t"Through the the mist I walk, until the gate appears out of nowhere. It's unlocked. All I have is her letter..."
},


-- Logic fields --

"rnd_next": Bool. If true, automatically makes a random choice between "next" IDs for the reader. Otherwise, the reader can make a choice.

"has_info": String array. This text block can be displayed if the reader has this info.

"not_info": String array. This text block can be displayed if the reader does not have this info.

"add_info": String array. Adds (unique) info. Present info can be detected on any next text block.

"rem_info": String array. Removes info. Avoid (altering history) unless info is clearly temporary.


-- Media fields --

"music": String. This is music that you want to play on loop. Enter file name + extension. Stops when any next text block writes "music": "stop".

"music_once": Bool. if true, disables looping of "music" specified on the same textblock.

"ambience": String. This is audio (street, nature, office etc.) that you want to play on loop. Enter file name + extension. Stops when any next text block writes "ambience": "stop".

"sound": String. This is an audio effect that you want to play once when the text block is shown. Enter file name + extension.

"image": String. This is the image that you want to display next to the text. Enter file name + extension.
`); 

        addHelpItem(this, "The 'Info' system in detail", "help_writer_editing_mode_info.jpg", `
This chapter explains the info (logic) system in detail. Examples given (info field names etc.) are as shown in my app's writer mode.


-- Definition: Info --

"info" is information that the reader has or doesn't have, and can be given or removed by the story's text blocks. Example: "collected_key_to_home". 

You can't have multiple of the same "info" at once. It's either there or not, and usually describes a past event. Info is used to decide how the story will progress, or to conditionally display extra content. 


-- Adding or removing info --

Only a Text Block (interactive story content) can add or remove info, and does so when it's shown to the reader.


-- Definition: Info field --

A Text Block / Info Panel / Info Panel Content can be configured with "info" fields.

Those fields are "Has info" / "Not info" / "Add info" / "Remove info". 


-- Definition: Info conditions --

Info conditions (Has info / Not info fields) control the visibility of content, and with that, info implements logic in your story as well.


-- Example usage --

Info allows your story to change based on reader interactions. For example, you can display the text block "drive home" to the reader, only if the reader has the info "found_key_car".

Info allows your Info Panel to display content only while the reader has info (or not). For example: To display a car key image on a panel "Inventory", while the reader has the info "found_key_car".


-- About correct usage --

Gamers might think:
"So info describes state. It sounds similar to adding health points / magic spells / items to my hero?". 

It does. You can use info like that and in so many other ways. 

Programmers might think: 
"Then, can I assign "10" to info "health_points" or event X if == 0?" 

No. Info is just a text string. The alternative of adding a lot of info ("hero_health_points_11_of_20" or "has_17_gold") is incorrect use of the system, because that is not efficient and not of real value to a story. 

Correct use examples: "found_key_car", "boss_cave_hits_2", "found_map_forest", "anna_talked_about_her_town".


-- About efficient design --

Add info only when of value to story progression, and few of it. This greatly reduces complexity of designing the logic for your story.

There can be exceptions where you add info not for story progression, but just to display content on an info panel (chapter "How should I use the editing mode 'Info Panel'?"). Note that this method can quickly increase the amount of info you are using, and is recommended to do after finishing story content (editing mode "Content").

Naming info properly is important, so you can instantly see what it is used for. Read chapter "How should I name my files and info?" for information about this.


-- About efficient management --

The app's writer mode comes with an editing mode called "info", which automates info management. 

If you have written info in any info field (in any editing mode), then the info will show up here.

A copy button is created next to the info. Clicking this copies the info string to your clipboard, so you can quickly enter it elsewhere, reducing the risk for typing mistakes.

If you have made such a mistake before, you are likely to see two or more similar info appearing on this panel, which you would need to correct.

Of the following example fields: "found_compas" and "found_compass", you can simply type the correct value into the incorrect field. You will then be asked if you want to continue merging the info. All info will be corrected for you.

Just like that, you can type into a field to rename info. Removing all text from a field will delete the info. Deleting info is not common, since this alters the logic of your story.

Because editing a field makes large scale changes, I suggest saving your project (backup) before you do so. This way you can easily revert to previous state if you regret editing something.

Since everything is automated, this panel should be all you need to manage info efficiently. 

`);    


addHelpItem(this, "How should I name my files and info?", null, `
Up to preference. I write names in a style that is short, unique, clear, and a bit categorized. That has always worked well for me in game development (complex environments). 

Don't overthink / overcategorize things. You could copy my style. Be consistent. Projects without a style are generally full of names no one understands ("39 render carrots Test Blender.jpg").

My style looks like "1. main category 2. short specifics, 3. variant" (ambience_forest_storm / sound_water_splash_5).

Info examples: person_*_said_*, event_happened_*, sidestory_started_*, sidestory_*_detail_*, location_*_detail_*, collected_*, time_night, weather_sunny.

Audio examples: ambience_city_day, ambience_forest_storm, music_radio_3, sound_footstep_concrete_4step, sound_voice_hero_hello, sound_door_scifi_4.

As you can also see in this style, I replace " " with "_" , and write lowercase. I don't use symbols (the * in the examples are your input).

On info I avoid using numbers. This improves sorting on the UI (editing mode "Info") and is easier to understand.

If info is added specifically to display content on an info panel (editing mode "Info Panel") and not for story progression, I prefix the info with "ui_" (User Interface), like "ui_found_compass". This helps me avoid mixing up info that is irrelevant to the story itself with (sometimes larger amount of) info used for UI purposes. When possible, it is more efficient to re use info used for story progression.
`);  


        addHelpItem(this, "How should I use the editing mode 'Info Panel'?", "help_writer_editing_mode_info_panel.jpg", `
You can build extra content panels / menus, that readers can view while reading.

This is a powerful feature which readers use to look at the progress they have made in your story.

If the story you are writing is a bit complex, or works like a game, then this feature will be of great value to your readers.

The amount of panels you create and their content is entirely up to the writer.

Content is displayed based on info (logic) conditions (just like the story's text block logic), and is not interactive. The info fields work just like those do in the "Content" editing mode (on story text blocks).

Below are examples of how this feature is used:

1. Fantasy story. Panel: "Magic". Content: "Magic spells are displayed when collected."
2. Adventure story. Panel: "Map". Content: "Image of map X is shown when collected."
3. Thriller story. Panel: "Journal". Content: "Displays events that happened and choices I made."
4. Puzzle story. Panel: "Inventory". Content: "Displays keys I have + images + descriptions."
5. Adventure story. Panel: "Achievements". Content: "Displays all the tasks I have completed so far."
6. Adventure story. Panel: "Tasks". Content: "Displays unfinished tasks people have given my hero."
7. Adventure story. Panel: "Friends". Content: "Displays information about friends of my hero."

As you can see, you can do a lot with this.

You can control the order of panels and content yourself, using the index fields.

All fields are explained when you hover them with your cursor. 

If you set the image mode to 'column', the image resolution must be 100x100 pixels. In 'Row' mode, its resolution is up to preference. Try to be consistent. Maximum width does not exceed 1620px on screen, but will scale down (in ratio) to fit screen size.

The amount of panels / content per panel is up to you. 

For both content and panels writers can configure info fields. Panels that are not currently viewable by a reader (by info conditions) are hidden from a reader's navigation as well. This allows a writer to introduce or remove panels during the story. If at least one panel can be viewed by a reader, the reader will see a small "R" (for reading) button to the bottom left of the screen. When clicked, this changes to an "I" (for info panel) and will show the first panel. With every button click, the next available panel is shown until the last panel closes and the reader arrives back at "reading" mode.
`);    

        addHelpItem(this, "Can I access / edit my story without using the app?", "help_writer_editing_story_methods.jpg", `  
Absolutely, but you should use my app's writer mode to edit your story. I will list the benefits and uses of all editing methods below:

1. My app's writer mode: User friendly. You never edit in JSON format. Media is previewed, IDs are automated. This is a visual (node) system. Compact, clean, and automated. No known bugs or editing risks. Input is validated. No technical knowledge required.

2. Text editor (I recommend VSCode): You desire the Notepad "find / replace" method on the story. No guards. Get direct access to all data as text. Large scale changes to anything are instant, but incorrect editing (regex mistake etc.) directly causes corruption. You will be testing changes properly (WinMerge etc.), and none of this is new to you. You know that editing keys / indexes / data must be done extremely carefully.

3. Programming: Nothing so far is new to you, or you will break it. Everything is possible. For data generation / alteration, lots of it and fast. Or, as an alternative for method 2 if you need just a little more. You are not using the app's UI. At this point, you are writing an app and require no instructions. Programming is also the best way to convert any story to another app / paper book / website / etc.

4. AI. If it takes and generates JSON, understands the context of editing my story.json, everything will be automated. More than you can read in a lifetime. Low cost / low effort approach using rapidly evolving, usually experimental, technology that can produce otherwise unreachable quality. For example: Creating accurate text translations, free and near instantly. It can generate content while you interact with it, instead of building everything up front.

At least 99.9% you will be editing within the app's writer mode, for its huge benefits. But, you do have all the freedom you might need.
`);

        addHelpItem(this, "I want advanced debugging, how do I?", "help_debugging_with_console.jpg", `  
If you wrote a story in writer mode, test it in reader mode, and things don't go as intended, then you need an inspection method (debugging).

For example, you might wonder why a text block does not show up, or what causes music to be playing.

Usually you can figure that out simply by backtracking the path you read in writer mode, until you find a cause.

Advanced debugging can be done inside the browser console (Press F12 and click the console button). This chapter's image demonstrates what I explain next.

Set the verbosity level (log level) to verbose (top right button in Chrome). This displays realtime log messages (intended for writers) while you are reading, such as when info or audio is modified and why.

If you require more in-depth inspection, you can display a full overview of all data in JSON, through javascript, also using the browser console.

This does not require additional knowledge, since you can copy and paste scripts I provide below. you should understand the data displayed, since names shown are also shown in writer mode.

From the console you can access my complete app through script. If you enter just any of the scripts I provide below (one by one), nothing will break.

You can click on arrow icons left of displayed data to expand parts of the data structure.

// Use this script to inspect the reading path you took and the current info collection you have:
structuredClone(app.readerData.getStoryProgress());

// Use this script to inspect the full story data as made by writer mode.
structuredClone(app.readerData.getStory());

// Use this script to inspect just all the text blocks in your story, displayed by ID. 
structuredClone(app.readerData.getStory().story);

// Use this script to inspect the text block that is currently showing:
structuredClone(app.readerData.getTextBlock());

// Use this script to inspect the ID for the text block that is currently showing:
app.readerData.getTextBlockId();

// Use this script to inspect the IDs in the "next" field for the text block that is currently showing:
structuredClone(app.readerData.getNextTextBlockIds());

// Use this script to inspect the IDs in the "next" field for the text block that is currently showing, that can currently be navigated to decided by "info" conditions:
structuredClone(app.readerData.getNextNavigatableTextBlockIds());

// Use this script to display what all audio tracks are currently playing (music, ambience, sound effect):
for (const [x,y] of Object.entries(app.audioController.audioTracks)) { console.log("Audio track: " + x + ": " + y.audioName) };
`);

        addHelpItem(this, "Useful keyboard shortcuts", null, `  
-- Browser --

Full screen:
	F11

Zoom in:
	Ctrl +
	Mouse wheel up

Zoom out:
	Ctrl -
	Mouse wheel down

Focus next:
	Tab

Focus previous:
	Shift Tab

Activate:
	Enter

-- Reader + Writer Mode --

Save progress:
	Ctrl S

-- Writer Mode -- 

Export story (while editing story):
	Ctrl E
`);

        addHelpItem(this, "Publishing stories and updates", null, `  
When releasing any update to their story, writers should increment the version number of their story (About field). This field must be easy to compare (1.01, 1.02).

Most importantly, readers must be made aware if your update will conflict with their older saved progress. A conflict can result in rejected userdata, or broken progress. Writers can only track conflicts if they track their changes very carefully (use Git!). I expect them to think of their readers. But, mistakes can be made. I expect readers to keep backups of their own data before updating.

If possible, writers could keep older versions available as well. 

Using a Git repository works very well for tracking all changes, and making multiple versions available. Through a Git repo's README.md file you can instruct your fans, and introduce new readers in style.

Ensure that there are no console errors / error alerts when loading userdata with your story into the app. Writers currently need to test manually if all story endings are reachable, but many other automated tests are implemented. 

Read chapter "What is the structure of a story folder?" to see file / folder paths that you are allowed to use. My import validator also treats paths "not of value to reader mode" as invalid paths. This includes some files you as a writer might be using (media source files, .gitignore etc.). This is intended strict behavior, to prevent readers from downloading files they don't need / intend to be using.


-- Ok, but where do I publish my story? --

That is up to you. I can recommend GitHub! This will make your work available as Zip and as Git repo for free, and you can see download statistics. There are many other options, such as Google Drive, hosting your own website, or publishing your story on a marketplace.

Once you have published your work, you want to let people know about it.

Show your work on forums, media, reader / writer communities, and communicate with your readers.
`);

    }
}
