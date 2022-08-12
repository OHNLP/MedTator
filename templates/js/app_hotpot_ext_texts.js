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

    "linking_marks_selection": {
        title: 'Linking marks selection',
        html: `The marks shown in the tag editor can be linked with the selection with the concept list.
`
    },

    "razer_help_err_def": {
        title: 'Error Definition',
        html: `<p>Error definition describes how the error types are classified into categories. For exampel, 'Lexicon' and 'Syntactic' can be categorized as ' Linguistic'. </p>
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
    }
}});