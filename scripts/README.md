# Scripts for MedTator

This folder contains some scripts designed for tasks related to MedTator. 
You can use the script in your own project and make any changes to meet your own needs.
The function of each script is described as follows:

- `fake_error_analysis_web_service.py`: a demo error analysis web service that defines the URL and parameters. Please use it as a reference for your own error analysis service.
- `fake_text_embedding_web_service.py`:a demo text embedding web service that defines the URL and parameters. You can implement your own service based on this demo. 
- `text_embedding_web_service.py`: a sample web service for text embedding based on sentence-transformer with Bio_ClinicalBERT.
- `make_files.py`: generate sample text files for annotation.
- `medtator_kits.py`: toolkits for read / write MedTator's XML files.
- `sentence_kits.py`: toolkits for converting XML to sentence-based JSON format
- `xml2sentence_demo.ipynb`: showing how to use the `sentence_kits.py` for converting XML annotation files for building a machine learning model.
- `demo_convert_to_jsonl.py`: showing how to use the `medtator_kits.py` and `sentence_kits.py` to a JSONL format for training relation extraction models by [Princeton PURE NLP](https://github.com/princeton-nlp/PURE).

## Machine learning (ML)

The annotated corpus can be used for a varity of machine learning tasks, such as Named Entity Recognition (NER) and Relation Extraction (RE).
To faciliate this process, we developed some toolkits for showing how to use the annotated XML files for these task.

For RE task, we create a Jupyter notebook for showing how to use the annotated entities and relations to build a ML model: [xml2sentence_demo.ipynb
](https://github.com/OHNLP/MedTator/blob/main/scripts/xml2sentence_demo.ipynb).