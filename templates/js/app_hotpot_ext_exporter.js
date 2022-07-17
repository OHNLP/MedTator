Object.assign(app_hotpot.vpp_methods, {
    get_ruleset_base_name: function() {
        var fn = this.dtd.name + '-' + this.anns.length;
        return fn;
    },

    download_text_tsv: function() {
        var fn = this.get_ruleset_base_name() + '_text.tsv';
        var txt_tsv = nlp_toolkit.download_text_tsv(
            this.anns,
            this.dtd,
            this.hint_dict,
            fn
        );

        // update the text
        this.export_text = txt_tsv;
    },

    download_text_sent_tsv: function() {
        var fn = this.get_ruleset_base_name() + '_text_sentence.tsv';
        
        // convert the hint dict to a json obj
        var json = [];

        for (let i = 0; i < this.anns.length; i++) {
            const ann = this.anns[i];
            for (let j = 0; j < ann.tags.length; j++) {
                const tag = ann.tags[j];
                // now mapping the span to token index
                if (!tag.hasOwnProperty('spans')) {
                    // this is not an entity tag
                    continue;
                }
                // there maybe multiple spans
                // var spans = tag.spans.split(',');
                var locs = ann_parser.spans2locs(tag.spans);

                for (let k = 0; k < locs.length; k++) {
                    // const _span = spans[k];
                    // const span = nlp_toolkit.txt2span(_span);
                    const span = locs[k];
                    if (span[0] == -1 || span[1] == -1) {
                        // which means this tag is just a non-consuming tag
                        // at present, we won't use this kind of tag 
                        continue;
                    }

                    // find the offset in a sentence
                    var loc0 = nlp_toolkit.find_linech(
                        span[0], 
                        ann._sentences
                    );
                    if (loc0 == null) {
                        // something wrong?
                        continue;
                    }
                    // find the location for the right part
                    // var loc1 = this.find_linech(span[1], ann._sentences);
                    var loc1 = Object.assign({}, loc0);
                    loc1.ch += (span[1] - span[0]);

                    // create a new row/item in the output data
                    json.push({
                        concept: tag.tag,
                        text: tag.text,
                        doc_span: span,
                        sen_span: [
                            loc0.ch,
                            loc1.ch
                        ],
                        document: ann._filename,
                        sentence: ann._sentences[loc0.line].text
                    });
                }
            }
        }

        // then convert the json to csv
        var csv = Papa.unparse(json, {
            delimiter: '\t'
        });

        // update the text
        this.export_text = csv;

        // download this csv
        var blob = new Blob([csv], {type: "text/tsv;charset=utf-8"});
        saveAs(blob, fn);
    },
    
    download_dataset_iob2: function() {
        var txt_dataset = nlp_toolkit.download_dataset_bio(
            this.anns,
            this.dtd,
            'dataset-' + this.get_ruleset_base_name() + '-BIO.zip'
        );

        // update the text
        this.export_text = txt_dataset;
    },

    download_dataset_bioc: function() {
        var txt_dataset = bioc_parser.download_dataset_bioc(
            this.anns,
            this.dtd,
            'dataset-' + this.get_ruleset_base_name() + '-BioC.xml'
        );

        // update the text
        this.export_text = txt_dataset;
    },

    download_ruleset_medtagger_zip: function() {
        var rulepack = erp_toolkit.download_anns_as_zip(
            this.anns,
            this.dtd,
            'ruleset-medtagger-' + this.get_ruleset_base_name() + '.zip'
        );

        // update the text
        this.export_text = "Please unzip the file and check details";
    },

    download_ruleset_spacy_jsonl: function() {
        var text = spacy_toolkit.download_anns_as_jsonl(
            this.anns,
            this.dtd,
            'ruleset-spacy-' + this.get_ruleset_base_name() + '.jsonl'
        );

        // update the text
        this.export_text = text;
    },
});