# Sample Data

In this folder, there are some sample datasets for showing the schema and annotation data files.

* `MINIMAL_TASK`: a very simple annotation task for COVID-19 symptoms, which contains only one entity tag with two attributes to annotate.
* `ENTITY_RELATION_TASK`: a simple annotation task for COVID-19 vaccine adverse event and severity, which contains 2 entity tags and 1 relation tag.
* `DOCUMENT_LEVEL_TASK`: a document-level annotation task for COVID-19 vaccine adverse events, which contains 11 entity tags.
* `IAA_TASK`: a simple task for showing the IAA calculation result, which contains 8 entity tags and 1 relation tag.

Each dataset folder contains the following file and directories:

* `DTD_NAME.dtd`: the annotation schema for this annotation task. You can use any text editor (e.g., Sublime Text, TextMate, or VIM) to edit it.
* `raw_txt/`: the raw text files for annotation.
* `ann_xml/`: the annotation data files, which contain the text and annotated tags. Some file names have a prefix `A_` or `B_`, which represent different annotators.

You could download the whole repo and try these sample datasets. All of the text file used in these sample datasets are extracted from the [VAERS Data Sets](https://vaers.hhs.gov/data.html).