'''Fake Text Embedding Web Service

This is a fake web service for text embeddings for MedTator.
The text embeddings can help researchers to understand the token distribution.

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

def fake_text_embedding(data):
    '''
    Fake text embedding function

    It just read each tag and return random result.
    Please implement a real text embedding instead
    '''
    import random

    # just a shortcut
    tags = data['tags']

    # save the ret
    ret = []
    
    # ok, work on each tag
    for tag in tags:
        r = {
            'uid': tag['uid'],
            "embedding_tsne": [
                random.random(),
                random.random(),
            ]
        }
        ret.append(r)

    return ret


HTML_EMBEDDING = """<html>
<head><title>Text Embedding | Tag</title></head>
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
    "is_tsne": true,
    "tags": [
        { "uid": 1, "text": "mild cough" },
        { "uid": 2, "text": "slight fever" },
        { "uid": 3, "text": "heart attack" },
        { "uid": 4, "text": "night sweats" },
        { "uid": 5, "text": "not sure what it is"}
    ]
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

@app.route("/embedding", methods=['GET', 'POST'])
def embedding():
    # show an UI for users
    if request.method == 'GET':
        return HTML_EMBEDDING
    
    # the data contains everything sent by client
    # get the str format data from requests
    data_str = request.form.get('data')

    # parse to data obj
    try:
        data = json.loads(data_str)
    except Exception as err:
        print('* skip wrong format input')
        print(err)
        return '?'

    if 'tags' not in data:
        print('* skip wrong json input')
        print(data)
        return '??'

    #######################################################
    # embedding code goes here
    #######################################################
    # do something to the data
    tags = fake_text_embedding(data)
    ret = {
        "tags": tags
    }

    # at last, the API will return this obj as JSON
    return jsonify(ret)


if __name__ == '__main__':
    app.run(
        host='0.0.0.0', 
        port=8809, 
        debug=True
    )