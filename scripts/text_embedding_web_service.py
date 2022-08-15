'''
Text Embedding Web Service

A very simple text embedding web service for MedTator.
By using this service, the annotated tokens can ben 
visualized on an 2D plane.

In this simple service, HuggingFace's BERT model and t-SNE are used.
So you need to install the following first:

```bash
pip install flask
pip install flask_cors
pip install numpy
pip install scikit-learn
pip install -U sentence-transformers
```

More information about the sentence embedding can be found at:
https://huggingface.co/sentence-transformers.
And more information about scikit-learn's t-SNE:
https://scikit-learn.org/stable/modules/generated/sklearn.manifold.TSNE.html

Once the packages are install, you can run this web service on 8809:

```bash
python text_embedding_web_service.py
```

ATTENTION: As this web service runs locally for test purpose, 
the debug mode is ON.
'''
import json
import numpy as np
from sklearn.manifold import TSNE
from flask import Flask
from flask import request
from flask import jsonify
from flask_cors import CORS

from sentence_transformers import SentenceTransformer

# load the clinicalBERT model
model_name = 'emilyalsentzer/Bio_ClinicalBERT'
# model_name = 'multi-qa-MiniLM-L6-cos-v1'
model = SentenceTransformer(model_name)

def get_embedding(sentences):
    embedding = model.encode(sentences)
    return embedding


def get_tsned_embedding(sentences):
    embedding = get_embedding(sentences)
    X_e = TSNE(
        n_components=2,
        learning_rate='auto',
        init='random'
    ).fit_transform(embedding)

    return X_e


# the web service
app = Flask(__name__)
CORS(app)

HTML_EMBEDDING = """<html>
<head><title>Text Embedding | Tag</title></head>
<body>
<fieldset>
<legend>Get Embeddings</legend>
<p>
    POST request
    <br>
    - Parameter: <b>data</b>. a JSON object contains tags and docs for error analysis</label>
    <br>
    <br>
    Returns: a JSON object which contains the analysis results for all input tags.
</p>
<form method="POST" action="/embedding">
<p>Here's an example of embedding paramter for /embedding web service:</p>
<textarea name="data" cols="50" rows="11">{
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
<button>Submit the Above JSON object and check the output</button>
</form>
</fieldset>
</body>
</html>
"""

@app.route("/")
def index():
    return "<p>Hello! Please access the service <a href='./embedding'>/embedding</a> directly.</p>"


@app.route("/embedding", methods=['GET', 'POST'])
def embedding():
    if request.method == 'GET':
        return HTML_EMBEDDING

    # get data
    data_str = request.form.get('data')
    data = json.loads(data_str)

    # use tsne or raw embedding?
    is_tsne = data['is_tsne']

    # get all texts
    sentences = []
    for t in data['tags']:
        sentences.append(t['text'])

    if is_tsne:
        x = get_tsned_embedding(sentences)
    else:
        x = get_embedding(sentences)

    # the output is a NumPy ndarray
    x = x.tolist()

    # write back as a tag list
    tags = []
    for i, e in enumerate(x):
        tags.append({
            'uid': data['tags'][i]['uid'],
            'embedding_tsne': e
        })

    # return the tags
    ret = {
        "tags": tags
    }

    return jsonify(ret)


if __name__=='__main__':
    app.run(
        debug=True, 
        port=8809
    )