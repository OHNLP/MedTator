# Scripts for MedTator

This folder contains some scripts designed for tasks related to MedTator. 
You can use the script in your own project and make any changes to meet your own needs.
The function of each script is described as follows.

## Reading annotation files

The following two files are designed to read 

- `medtator_kits.py`: toolkits for parse MedTator's XML files.
- `sentence_kits.py`: toolkits for converting XML to sentence-based JSON format

## Web services for error analysis

- `fake_web_service_error_analysis.py`: a demo error analysis web service that defines the URL and parameters. Please use it as a reference for your own error analysis service.
- `fake_web_service_text_embedding.py`:a demo text embedding web service that defines the URL and parameters. You can implement your own service based on this demo. 
- `web_service_text_embedding.py`: a sample web service for text embedding based on sentence-transformer with Bio_ClinicalBERT.

## Demo of parsing annotation XML files for training machine learning models

The annotated corpus can be used for a varity of machine learning tasks, such as Named Entity Recognition (NER) and Relation Extraction (RE).
To faciliate this process, we developed some toolkits for showing how to use the annotated XML files for these task.

- `demo_xml2sentence.ipynb`: showing how to use the `medtator_kits.py` and `sentence_kits.py` for converting XML annotation files to build a machine learning model for the RE task, we create this Jupyter notebook for showing how to use the annotated entities and relations to build a ML model: [demo_xml2sentence.ipynb
](https://github.com/OHNLP/MedTator/blob/main/scripts/demo_xml2sentence.ipynb).


- `demo_inter-sentence.ipynb`: showing how to use the `sentence_kits.py` to generate sentence-based tags with different strategies for inter-sentence relations. You can exclude all inter-sentence relations, include inter-sentence relations in the first sentence, or include inter-sentence relations in all related sentences. 

- `demo_convert_to_jsonl.py`: showing how to use the `medtator_kits.py` and `sentence_kits.py` to a JSONL format for training relation extraction models by [Princeton PURE NLP](https://github.com/princeton-nlp/PURE).


## Other scripts

- `make_test_files.py`: generate sample text files for annotation.