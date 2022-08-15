'''Fake Error Analysis Web Service

This is a fake web service for conducting error analysis for MedTator.
The error analysis can help researchers to understand the quality of 
the annnotated corpus and the output from NLP systems.

This is web service is not required by MedTator,
so you don't need to run it for general annnotation tasks.
In addition, this web service is just an experimental tool.
Please do NOT use it in your production environment,
but you can customized and use it for your own purpose.

To run this web service, you need to install Flask and Flask-CORS:

pip install -U flask
pip install -U flask-cors

The CORS support is needed for cross-origin AJAX request.
'''
import json

from flask import Flask
from flask_cors import CORS
from flask import request
from flask import jsonify

# create a Flask App for web service
app = Flask(__name__)
CORS(app)

def fake_error_analysis(data):
    '''
    Fake error analysis function for parsing the given data

    It just read each tag and return random result.
    Please implement a real error analysis instead
    '''
    import random
    err_cate_types = {
        " Linguistic": [
            "Lexicon",
            "Orthographic",
            "Morphologic",
            "Syntactic",
            "Semantic",
        ], 
        "Contextual": [
            "Section",
            "Certainty",
            "Status",
            "Temporality",
            "Subject",
            "Absence of Context",
            "Exclusion",
        ], 
        "Logic": [
            "Pattern and Rule",
        ], 
        "Annotation": [
            "Missing Annotation",
            "Insufficent Context",
            "Extrapolation of Evidence",
            "Non-defined Concept",
        ],
        "Concept Definition": [
            "Ambiguity",
            "Source Evidence",
            "Change of Status",
        ]
    }

    # just a shortcut
    tags = data['tags']
    docs = data['docs']

    # save the ret
    ret = []
    
    # ok, work on each tag
    for tag in tags:
        errors = []

        # just for remove duplicates
        error_set = []

        # get a random count of errors, most of time only 1 error
        n_errors = random.choice([
            # very rare
            3, 
            # rare
            2, 2, 2, 
            # not rare
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
        ])

        for i in range(n_errors):

            # just for finding a non-used error
            while(True):
                err_cate = random.choice(list(err_cate_types.keys()))
                err_type = random.choice(err_cate_types[err_cate])
                err_str = err_cate + err_type
                if err_str in error_set:
                    continue

                error_set.append(err_str)
                break

            errors.append({
                "category": err_cate,
                "type": err_type,
            })
            
        r = {
            'uid': tag['uid'],
            "errors": errors
        }
        ret.append(r)

    return ret


# a page for /ea_tag
PAGE_EVA_TAGS = """<html>
<head><title>Error Analysis | Tag</title></head>
<body>
<fieldset>
<legend>Evaluate tags</legend>
<p>
    POST request
    <br>
    - Parameter: <b>data</b>. a JSON object contains tags and docs for error analysis</label>
    <br>
    <br>
    Returns: a JSON object which contains the analysis results for all input tags.
</p>

<form action="/eva_tags" method="POST">
<textarea name="data" cols="120" rows="20">{
    "tags": [{
        "uid": "8x9iju7xs2",        
        "id": "AE1",                
        "spans": "82~87",           
        "sentence": "I went to go check on her and she stated that she felt as though she was going to faint.",
        "sentence_spans": "82~87",  
        "tag": "AE",                
        "text": "faint",            
        "certainty": "Positive",    
        "comment": "Are you sure?", 
        "_filename": "12345.txt",
        "_annotator": "B",
        "_judgement": "FP" 
    }],
    "docs": {
        "12345.txt": "I went to go check on her and she stated that she felt as though she was going to faint. I advised her to stay seated, asked if she would like an ice pack and water."
    }
}</textarea>
<br>
<br>
<button>Submit the Above JSON object and check the output</button>
</form>
</fieldset>
</body>
</html>"""

@app.route("/")
def index():
    return """<h1>EA Service</h1> 
<p>Please install <a href="https://flask.palletsprojects.com/en/2.1.x/">Flask</a> and <a href="https://flask-cors.readthedocs.io/en/latest/">Flask-CORS</a> first.</p>
<p>Evaluate tags: <a href="./eva_tags">/eva_tags</a></p>
"""

@app.route("/eva_tags", methods=['GET', 'POST'])
def eva_tags():
    # show an UI for users
    if request.method == 'GET':
        return PAGE_EVA_TAGS
    
    # the data contains everything sent by client
    # The following is a sample
    # and this variable will be overwritten by json.loads
    data = {
        # the list of tags, which is a list.
        "tags": [{
            # tag information
            "uid": "8x9iju7xs2",           # unique id for this tag
            "id": "AE1",                   # id for this tag in XML
            "spans": "82~87",              # global spans in the doc
            "sentence_spans": "82~87",     # sentence-level spans
            "tag": "AE",                   # norm of the tag
            "text": "faint",               # the tag text
            "certainty": "Positive",       # optional, depends on dtd
            "comment": "Are you sure?",    # optional, depends on dtd

            # file information, the file content is in the "docs" dictionary
            "raw_text_file_name": "12345.txt",

            # context information 
            "sentence": "I went to go check on her and she stated that she felt as though she was going to faint.",

            # IAA result
            "_annotator": "B",             # A means GS, B means system
            "_judgement": "FP"             # A-> FN, B-> FP
        }],
        # the documents related to the tags, which are saved in a dictionary.
        # the file name is the key, and the file content is the value.
        "docs": {
            "12345.txt": "I went to go check on her and she stated that she felt as though she was going to faint. I advised her to stay seated, asked if she would like an ice pack and water."
        }
    }

    # get the str format data from requests
    data_str = request.form.get('data')

    # parse to data obj
    try:
        data = json.loads(data_str)

    except Exception as err:
        print('* skip wrong format input')
        print(err)
        return '?'

    if 'tags' not in data or 'docs' not in data:
        print('* skip wrong json input')
        print(data)
        return '??'

    print('* received requests %s tags and %s docs' % (
        len(data['tags']),
        len(data['docs'])
    ))

    # this API should return a JSON object
    # similar to the following
    # this ret will be overwritten by the error analysis
    ret = {
        "tags": [{
            "uid": "8x9iju7xs2",
            "error_type": "FN",
            "error_category": "Rare Expression",
            # or other results
        }]
    }

    #######################################################
    # Evaluation Code goes here
    #######################################################
    # do something to the data
    tags = fake_error_analysis(data)
    ret = {
        "tags": tags
    }

    # at last, the API will return this obj as JSON
    return jsonify(ret)


if __name__ == '__main__':
    app.run(
        host='0.0.0.0', 
        port=8808, 
        debug=True
    )