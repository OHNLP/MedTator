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
        
        var tsv = nlp_toolkit.download_sentence_tsv(
            this.anns,
            this.dtd,
            fn
        );

        // update the text
        this.export_text = tsv;
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