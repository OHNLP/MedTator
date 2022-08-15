# Scripts for MedTator

This folder contains some scripts designed for tasks related to MedTator. 
You can use the script in your own project and make any changes to meet your own needs.
The function of each script is described as follows:

- `fake_error_analysis_web_service.py`: a demo error analysis web service that defines the URL and parameters. Please use it as a reference for your own error analysis service.
- `fake_text_embedding_web_service.py`:a demo text embedding web service that defines the URL and parameters. You can implement your own service based on this demo. 
- `text_embedding_web_service.py`: a sample web service for text embedding based on sentence-transformer with Bio_ClinicalBERT.
- `make_files.py`: generate sample text files for annotation.
- `medtator_kits.py`: toolkits for read / write MedTator's XML files.
