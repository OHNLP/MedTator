# <img alt="MedTator" src="https://raw.githubusercontent.com/wiki/OHNLP/MedTator/img/logo.png">

MedTator is a serverless text annotation tool for corpus development. It is built on HTML5 techniques and many open-source packages, and was designed to be easy-to-use for your annotation task.

No Java, no Python, no PHP, no Docker, no MySQL, and no need to install any server or client runtime for corpus annotation!
[Check Here to Start Annotation Now!](https://ohnlp.github.io/MedTator/?st=yes)

![MedTator Demo](https://raw.githubusercontent.com/wiki/OHNLP/MedTator/img/MedTator-demo-211221.gif)

If you're having trouble using MedTator, you can use [Issues](https://github.com/OHNLP/MedTator/issues) to tell us about the issue you're experiencing.

## Documentation

* New to MedTator? Let's have a [Quick Start](https://github.com/OHNLP/MedTator/wiki/Quick-Start).
* More samples? Check our [Sample Datasets](https://github.com/OHNLP/MedTator/tree/main/sample).
* No internet access? Check this [Standalone version](https://github.com/OHNLP/MedTator/wiki#download-standalone-version)
* Effective strategies for annotating? Check this [Annotation best practices](https://github.com/OHNLP/MedTator/wiki/Annotation-Best-Practices)
* Design annotation schema? Check this [Annotation Schema Design](https://github.com/OHNLP/MedTator/wiki/Annotation-Schema).
* Parse annotation data? Here is the [Annotation File Format](https://github.com/OHNLP/MedTator/wiki/Annotation-Data).
* Having issues? Check the [Issues](https://github.com/OHNLP/MedTator/issues).
* More details about MedTator? We have a [Manual](https://github.com/OHNLP/MedTator/wiki/Manual).
* And more contents in the [Wiki](https://github.com/OHNLP/MedTator/wiki/)


## MedTator Development

MedTator itself doesn't require Python runtime environment, so you don't need to install any runtime environment to run MedTator for corpus annotation.
If you are interested in the MedTator development or just want to try the development version, a Python 3+ runtime environment is needed to run a debugging server.

You can install a [Python 3+](https://www.python.org/downloads/) or [Miniconda](https://docs.conda.io/en/latest/miniconda.html) / [Anaconda](https://www.anaconda.com/products/individual), then download the source code of MedTator and install the requirements (just Python [Flask](https://github.com/pallets/flask/), that's all):

```bash
pip install -r requirements.txt
```

Then, run the following command to start a local server which is binding port 8086:

```bash
python web.py
```

Now you can open web browser and check the http://localhost:8086/. 

For more details of the parameters for `web.py`, run `python web.py -h` and it will show the details as follows.

```
usage: web.py [-h] [--mode {build,run,release}] [--lib {local,cdn}]
              [--path PATH] [--fn FN]

MedTator Development Server and Toolkit

optional arguments:
  -h, --help            show this help message and exit
  --mode {build,run,release}
                        What do you want to do? `run` for starting the
                        development server. `build` for generating a static
                        HTML page for public release or local release.
  --lib {local,cdn}     Where to get third party libs in the HTML page? If
                        choose local, please make sure to copy the `static`
                        folder after generated the HTML file.
  --path PATH           Which folder to be used for the output page? The
                        default folder is the docs/ folder for public release.
  --fn FN               What file name to be used for the output page? The
                        default file name is the `index.html` which could be
                        accessed directly by browser.
```


## Build the static version

To update the static version for publication (e.g., GitHub Pages), run the following command. It will generate a static HTML file in the docs/ folder and copy other files.

```bash
python web.py --mode build
```

Or you can build a standalone version for local use, run the following command:

```bash
python web.py --mode build --lib local --fn standalone.html
```

Then, you can create a release zip file:

```bash
python web.py --mode release
```

## License

Apache-2.0 License


## Citation

If you use MedTator in scientific work or want to learn more about it, please have a look at

> He H, Fu S, Wang L, Liu S, Wen A, Liu H. MedTator: a serverless annotation tool for corpus development. Bioinformatics, Volume 38, Issue 6, 15 March 2022, Pages 1776–1778, DOI: [10.1093/bioinformatics/btab880](https://doi.org/10.1093/bioinformatics/btab880), PMID: [34983060](https://pubmed.ncbi.nlm.nih.gov/34983060/)


## Change log

### 1.2.xx (2022-07-07)

- Added function for customizing sample text
- Added changelog information on UI
- Added sorting for corpus token list in statistics
- Added tag details for corpus summary in statistics
- Added filter options for token statistics
- Added filtered count in token summaryies
- Updated the visual design for corpus summary in statistics
- Updated the color encoding for annotated tags in statistics
- Updated scripts for experimental tasks
- Fixed ribbon menu resize bug

### 1.2.41 (2022-06-23)

- Added meta-data structure for annotation file
- Added color label to annotation file
- Added functions for updating annotator for adjudication
- Added download all tags for adjudication
- Added sorting by label color
- Added MedTagger ann format converter
- Added UI for converting MedTagger results
- Added folder drag and drop for converter
- Added folder drag and drop for adjudication
- Updated IAA drop box width
- Updated code structure for better extension
- Updated wiki pages
- Fixed meta copy bug when generating adjudicated copy

### 1.2.32 (2022-05-26)

- Added sample text for schema test
- Added Cohen's Kappa score to exported XLSX report
- Updated texts on UI
- Updated CDN URLs for some packages
- Fixed default IAA sample data bug

### 1.2.30 (2022-05-12)

- Added seperate file download for adjudicated file
- Added annotator label for adjudicated files
- Updated adjudication tab UI
- Fixed edit bug

### 1.2.29 (2022-04-28)

- Added the sort for IAA file list
- Updated iaa result box style
- Updated sample dataset
- Fixed duplicated tag in adjudicated results
- Fixed ajax request type bug
- Fixed adjudicated result download bug

### 1.2.27 (2022-04-14)

- Added sample schema dropdown for editor to select
- Added sample schema files for standalone version
- Added help to schema editor with wiki
- Updated the tooltip information for annotation menu
- Updated scripts for creating sample DTD files
- Fixed the initial position of context menus
- Fixed schema editor menu UI margin
- Fixed path missing bug in the export script 

### 1.2.24 (2022-03-31) 

- Added Cohen's Kappa to IAA calculation results
- Added dropdown for selecting Cohen's Kappa for IAA result
- Added confusion matrix for Cohen's Kappa
- Added schema editor for creating and editing schema
- Added helper functions for building schema
- Added schema editor convert functions
- Updated annotation bar menu for schema editor
- Updated dtd stringify function
- Updated sample data for demo
- Updated browser detection for Brave
- Updated the size of search button
- Fixed the message for secure contexts
- Fixed the message for browsers without FSA APIs

### 1.2.15 (2022-03-17)

- Added sort button and menu for file list by file name or tags
- Added dynamic sort indicator for different sort mode
- Added a button for quickly deleting filter text
- Fixed concept name overflow bug in adjudication tab
- Fixed ribbon menu layout bug when resized

### 1.2.13 (2022-03-03)

- Added using attribute IAA calculation
- Added menu for attribute selection
- Added dropping file in the filelist view
- Updated the drop zone size
- Updated the schema and IAA sample dataset
- Updated the the JSON files of the samples
- Fixed switch button status when no dtd file

### 1.2.10 (2022-02-17)

- Added a new section in the statistics tab
- Added a new statistics report in xlsx format
- Added colored cells to the statistics report
- Added importing annotation files by dropping folder(s)
- Added memory check in settings
- Updated the statistics summary with more items
- Updated the XML zip file name with timestamp

### 1.2.6 (2022-02-03)

- Added the adjudication sheet in the IAA report xlsx file
- Updated the included tags in the IAA report xlsx file
- Updated the colors in IAA report xlsx file
- Updated wiki pages

### 1.2.5 (2022-01-20)

- Added a setting option for showing annotated tags
- Added fixed header for the "All Tags" in concept list 
- Updated the context menu position calculation
- Fixed the hover bug dismiss bug when deleting tag

### 1.2.3 (2022-01-06)

- Added IAA report download (as Excel XLSX format)
- Added background colors to IAA report cells
- Added summary and files details in the IAA report
- Updated Wiki button for issue report
- Updated IAA sample data annotation and schema design
- Updated sample json files for style information
- Updated the document-level adjudication label
- Updated default samples
- Fixed "Clear All" button not working bug

### 1.2.0 (2021-12-20)

- Added hover box to entity tag for details
- Added show adjudication in annotation tab with 
- Added download all annotation as a zip file
- Added fixed tag list header scrolling
- Added download schema dtd file
- Added dynamic tag rendering based on selected tag
- Added filter hinter based on selected tag
- Added clear seperate adjudication
- Updated the export message link
- Updated messages related to annotation file import
- Updated messages related to dtd file import
- Updated simple sentencize algorithm
- Updated sentencizer algorithm
- Updated adjudication tab design
- Updated mark style in editor
- Updated hover text style for tag and hint
- Updated animated tag style in tagging view
- Updated active style for tag list
- Updated conditions for saving annotation file
- Updated sample datasets
- Fixed rendering glitch when switching tab
- Fixed IAA calculation click not binding bug
- Fixed sentencizer setting not working bug
- Fixed document-level tag rendering bug
- Fixed tag attribute toggle in adjudication
- Fixed popup menu dobule click 
- Fixed popup menu initial position
- Fixed hover tag text shaking bug
- Fixed IAA accept button bug

### 1.1.3 (2021-12-13)

- Added search and clear search results in editor
- Added highlight in tag list
- Added script for standalone version export
- Updated menu item for exported rulesets
- Updated tool tips
- Updated samples for entity and relation annotation

### 1.1.0 (2021-11-28)

- Added a new standalone version for local usage without internet access
- Added build parameters for building standalone version
- Added local cache of all libraries for local standalone version
- Updated references configuration for standalone version
- Updated embedded sample data for standalone version
- Updated building output information
- Fixed drag & drop bug when reading local dtd file
- Fixed embedded sample JSON encoding bug

### 1.0.2 (2021-11-08)

- Added a sentence splitting / tokenization method for fast splitting.
- Added a side bar for managing settings.
- Added entity tag locating. Users could click on the `spans` to locate the entity tag in the editor. The editor will jump to the line where the clicked tag is and highlight that tag.

### 1.0.1 (2021-10-15)

- Added sample data for AMIA 2021 workshop.
- Fixed typos.

### 1.0.0

Release Highlights

- Serverless design. NO runtime installation is required.
- Four tabs for core steps in annotation.
- Visualized entity and relation annotation.
- Annotation hint based on existed tags.
- Visualized annotation results.
- Interactive adjudication and Inter-Annotator Agreement (IAA) calculation.
- Customizable annotation schema.
- Multi-format export.
- Multi-file annotation.

# Acknowledgements

