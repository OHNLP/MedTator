/**
 * This is an extension for app_hotpot text contents
 */

Object.assign(app_hotpot, {
texts: {
    "sentence_splitting_algorithm": {
        title: 'Sentence Splitting Algorithm',
        html: `MedTator can display text content in different ways, which include a sentence-mode display.
To display the split sentences correctly, the original content must be tokenized in sentence level.
There are several different methods / algorithms for sentence tokenization, and these methods are implemented in different packages / libraries.
MedTator provides some options for selecting different methods.

<ul>
    <li>The default method is a simple splitting algorithm based on symbol detection. This algorithm will check each character in the given text and compare it with pre-defined schema. The result of this algorithm works for most of cases, and has great performance. </li>
    <li>The <b>Compromise NLP</b> method is implemented based on <a target="_blank" href="https://github.com/spencermountain/compromise">Compromise NLP library</a>. It provides APIs for sentence spliting and formating. For more information, its <a target="_blank" href="https://observablehq.com/@spencermountain/compromise-sentences"></a> provides more technical details.</li>
    <li>The <b>Wink NLP</b> method is based on <a target="_blank" href="https://winkjs.org/">WinkJS NLP library</a>.</li>
</ul>
`
    },

    "new_ui_for_ck": {
        title: "Enable showing Cohen's Kappa result",
        html: `This is a new module and it's under development. You can enable this for test.`
    },

    "new_ui_for_ea": {
        title: "Enable new UI for Error Analysis",
        html: `This is a new UI module error analysis and it's under development. You can enable this new UI for test.`
    },

    "new_ui_for_tk": {
        title: "Enable new UI for Toolkit",
        html: `This is a new module and it's under development. You can enable this new UI for test.`
    },

    "auto_save_current_ann": {
        title: "Enable auto-save function",
        html: "By enabling this feature, the annotation will be automatically saved while annotating. Everytime when users add/update/delete any tags in the current annotation file, MedTator will try to save the changes to local disk.<br>If the user doesn't grant the file permission yet, a dialog will be shown and no more dialog after the first one."
    },

    "linking_marks_selection": {
        title: 'Linking marks selection',
        html: `The marks shown in the tag editor can be linked with the selection with the concept list.
`
    },

    "razer_help_err_def": {
        title: 'Error Definition',
        html: `<p>Error definition describes how the error types are classified into categories. For exampel, 'Lexicon' and 'Syntactic' can be categorized as 'Linguistic'. </p>
<p>MedTator's error analysis module comes with a default error definition. You can use it directly, or you can customize your own error definition. </p>
<p>MedTator uses a simple format to organize error category, which is defined as a YAML format in the annotation schema or a seperate YAML file. For more information about the error definition format, please check our <a target='_blank' href='https://github.com/OHNLP/MedTator/wiki'>Wiki Page</a>.</p>
`
    },

    "razer_help_err_labels": {
        title: 'Error Labels',
        html: `<p>Error labels are assigned to each error tag (i.e., FP or FN tag) and MedTator will use this label information to visualize the error distribution.</p>
        <p>You can upload the error tag list with error labels for visualization. Or you can download the error tag list with empty labels for further external labeling.</p>
        <p>For more information about the error label format, please check our <a target='_blank' href='https://github.com/OHNLP/MedTator/wiki'>Wiki Page</a>.</p>
`
    },

    "avbrat_help_how_to_use": {
        title: 'How to use?',
        html: `<p>The <b><i class="fas fa-igloo"></i> Visualize</b> is designed to show the annotated tags and the context text of the current document. It supports the following features:</p>
        <ul>
            <li><b>Document visualization</b>: You can click the "<i class="fas fa-igloo"></i> Visualize" button or the "Visualize Whole Document" button to show the entire document and all of the annotated tags in the document.</li>
            <li><b>Selection visualization</b>: You can highlight a sentence or a paragraph, and then click the "<i class="fas fa-igloo"></i> Visualize" button or the "Visualize Selection" button to visualize the tags within the highlighted text.</li>
        </ul>
        <p>The visualization is implemented based on <a target='_blank' href='https://brat.nlplab.org/'>brat</a> visualization module. For more information, please visit <a target='_blank' href="https://github.com/OHNLP/MedTator/wiki">MedTator Wiki</a></p>`
    },

    "auto_sl_current_cfg": {
        title: "Auto Save/Load Configs",
        html: `<p>By enable this feature, MedTator can save some settings in <a href="">localStorage</a> while the user makes changes to default settings. When the user open MedTator next time, the settings will be automatically loaded from localStorage.</p>
        <p>Attention. At present, we only add those configs in "Settings" panel to this auto save/load feature. Other settings in tabs may be added in future.</p>
        <p>Due to the technical reasons, when loading samples, the settings would be overwritten by the configs in sample dataset.</p>`
    },

    "tk_medtaggervis_help": {
        title: "How to use MedTaggerVis",
        html: `
        <p>MedTaggerVis can help you to show the MedTagger output files (.ann) with the context text to explore the output results. You can visualize your MedTagger output as follows:
        </p>
        <ol>
            <li><b>Load raw text files</b>: Drop the folder containing .txt files to the first box.</li>
            <li><b>Load MedTagger output files</b>: Drop the folder containing .ann files to the second box. Please ensure the file names in the output folder match the file name in the raw text file folder. For example, an output file name "doc1.txt.ann" should have a raw text file named "doc1.txt" in the raw text folder.</li>
            <li><b>Visualize the result</b>: Click the file name in the output file list to show the visualized results.</li>
        </ol>
        <p>Known issues:</p>
        <ul>
            <li>Web Browser: due to the limitation of FileSystemAccess API in web browser, MedTaggerVis can only run on Chromium-based modern browsers.</li>
            <li>The number of files: the implementation of reading local files is different on different operating systems (e.g., Linux, MacOS, Windows, etc.). You may load a folder with up to 10,000 files to browse. </li>
            <li>The loading time: loading files depends on many factors, such as the file size and disk I/O speed, so the loading time varies from a few seconds to a few minutes.</li>
        </ul>
        <p>
            The visualization is implemented based on <a target='_blank' href='https://brat.nlplab.org/'>brat</a> visualization module. If you have any issues when using this function, please feel free to leave an issue report in <a target="_blank" href="https://github.com/OHNLP/MedTator/issues">MedTator Github Repo Issues</a> or contact our developers.
        </p>
`
    },

    "reset_to_default_settings": {
        title: "Reset to Default Settings",
        html: `
        <p>By clicking the 'Reset' button, MedTator will reset all settings to the default options.</p>
        <p>After reset, please reload/refresh the page to enable the default settings. Otherwise the current annotation may be affected.</p>
        `
    },

    "save_workspace_as_json": {
        title: "Save Workspace in JSON File",
        html: `
        <p><b>ALL</b> the data and settings in MedTator can be saved in a single JSON file for debug and share purpose. However, due to the limitation of HTML File System Access API, the loaded files in any tab (e.g., annotation tab, adjudication tab, error analysis, etc.) are NOT linked to their original location.</p>
        <p>The saved workspace JSON file is named as <b>vpp_data_XXXX.json</b>, where the XXXX is user-specified or the schema name. It can be loaded through the file list in annotation tab. </p>
        <p>You can drop the saved workspace JSON file in to the file list. MedTator will automatically detect the content and load the workspace.</p>
        `
    }
}});