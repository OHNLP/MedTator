/**
 * This is an extension for app_hotpot text contents
 */

Object.assign(app_hotpot.vpp_data, {
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
    }
}});