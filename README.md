# <img alt="MedTator" src="https://raw.githubusercontent.com/wiki/OHNLP/MedTator/img/logo.png">

MedTator is a serverless web tool for corpus annotation. It is built on HTML5 techniques and many open-source packages, and was designed to be easy-to-use for your annotation task.

No need to install any server or client runtime! 
[Check Here to Start Annotation Now!](https://ohnlp.github.io/MedTator/?st=yes)

![MedTator Demo](https://raw.githubusercontent.com/wiki/OHNLP/MedTator/img/MedTator-demo.gif)


## Documentation

* New to MedTator? Let's have a [Quick Start](https://github.com/OHNLP/MedTator/wiki/Quick-Start).
* More samples? Check our [Sample Datasets](https://github.com/OHNLP/MedTator/tree/main/sample).
* Design annotation schema? Check this [Annotation Schema Design](https://github.com/OHNLP/MedTator/wiki/Annotation-Schema).
* No internet access? Check this [Standalone version](https://github.com/OHNLP/MedTator/wiki#download-standalone-version)
* Parse annotation data? Here is the [Annotation File Format](https://github.com/OHNLP/MedTator/wiki/Annotation-Data).
* More details about MedTator? We have a [Manual](https://github.com/OHNLP/MedTator/wiki/Manual).


## Development

For development, a Python 3+ runtime environment is needed. 
Then, download the source code and install the requirements (just Python Flask, that's all):

```bash
pip install -r requirements.txt
```

Then, run the following command to start a local server which is binding port 8086:

```bash
python web.py
```

Then you can open web browser and check the http://localhost:8086/. 
For more details of the parameters, run `python web.py -h` and it will show the following details.

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

## Change log

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


## License

Apache-2.0 License