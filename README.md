# <img alt="MedTator" src="https://raw.githubusercontent.com/wiki/OHNLP/MedTator/img/logo.png">

MedTator is a serverless web tool for corpus annotation. It is built on HTML5 techniques and many open-source packages, and was designed to be easy-to-use for your annotation task.

No need to install any server or client runtime! 
[Check Here to Start Annotation Now!](https://ohnlp.github.io/MedTator/?st=yes)

![MedTator Demo](https://raw.githubusercontent.com/wiki/OHNLP/MedTator/img/MedTator-demo.gif)


## Documentation

* New to MedTator? Let's have a [Quick Start](https://github.com/OHNLP/MedTator/wiki/Quick-Start).
* More samples? Check our [Sample Datasets](https://github.com/OHNLP/MedTator/tree/main/sample).
* Design annotation schema? Check this [Annotation Schema Design](https://github.com/OHNLP/MedTator/wiki/Annotation-Schema).
* Parse annotation data? Here is the [Annotation File Format](https://github.com/OHNLP/MedTator/wiki/Annotation-Data).
* More details about MedTator? We have a [Manual](https://github.com/OHNLP/MedTator/wiki/Manual)


## Development?

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


## Build the static version

To update the static version for publication (e.g., GitHub Pages), run the following command. It will generate a static HTML file in the docs/ folder and copy other files.

```bash
python web.py --mode build
```

Or you can specify where output folder is for the exported files:

```bash
python web.py --mode build --path EXPORT_PATH
```

## License

Apache-2.0 License