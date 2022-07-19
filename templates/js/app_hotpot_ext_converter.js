/**
 * This is an extension for converter 
 */

/////////////////////////////////////////////////////////////////
// Corpus converter related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot, {
    // for medtagger
    converter_corpus_medtagger_txt_files: [],
    converter_corpus_medtagger_ann_files: [],

    // for pure raw text
    converter_corpus_raw_txt_files: [],

    // for results
    converter_results: [],
});

Object.assign(app_hotpot.vpp_data, {
    // tasks
    // 1. medtagger: txt+ann
    // 2. raw: txt
    converter_corpus_task: 'raw',
    max_converter_display_files: 100,

    // for medtagger
    is_converter_loading_medtagger_txt_files: false,
    is_converter_loading_medtagger_ann_files: false,
    n_converter_corpus_medtagger_txt_files: 0,
    n_converter_corpus_medtagger_ann_files: 0,
    converter_corpus_medtagger_txt_files: [],
    converter_corpus_medtagger_ann_files: [],

    // for pure raw text
    is_converter_loading_raw_txt_files: false,
    n_converter_corpus_raw_txt_files: 0,
    converter_corpus_raw_txt_files: [],

    // for results
    n_converter_results: 0,
    converter_results: [],
});

/////////////////////////////////////////////////////////////////
// Corpus converter related functions
/////////////////////////////////////////////////////////////////

Object.assign(app_hotpot, {

    /////////////////////////////////////////////////////////////////
    // Raw text format related functions
    /////////////////////////////////////////////////////////////////
    add_files_to_converter_raw_txts: function(files) {
        console.log('* adding '+files.length+' files to converter raw txts');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.converter_corpus_raw_txt_files[
                this.converter_corpus_raw_txt_files.length
            ] = file;
        }
        
        // update the number
        app_hotpot.vpp.$data.n_converter_corpus_raw_txt_files = this.converter_corpus_raw_txt_files.length;

        // update some sample data
        app_hotpot.vpp.$data.converter_corpus_raw_txt_files = this.hard_slice(
            this.converter_corpus_raw_txt_files,
            this.vpp.$data.max_converter_display_files
        );

        // reset loading status
        app_hotpot.vpp.$data.is_converter_loading_raw_txt_files = false;
    },

    convert_from_raw_txt: function() {
        if (this.converter_corpus_raw_txt_files.length == 0) {
            app_hotpot.toast('Conversion is terminated. The .txt text files are needed for conversion.', 'alert');
            return;
        }

        // just call the function
        this.converter_results = [];

        for (let i = 0; i < this.converter_corpus_raw_txt_files.length; i++) {
            var file = this.converter_corpus_raw_txt_files[i];
            
            var ann = ann_parser.txt2ann(
                file.text,
                this.vpp.$data.dtd
            );
            ann._filename = file.fn + '.xml';

            this.converter_results[
                this.converter_results.length
            ] = ann;
        }

        // update the number
        app_hotpot.vpp.$data.n_converter_results = this.converter_results.length;

        // copy to vpp
        app_hotpot.vpp.$data.converter_results = this.hard_slice(
            this.converter_results,
            this.vpp.$data.max_converter_display_files
        );
    },

    /////////////////////////////////////////////////////////////////
    // MedTagger format related functions
    /////////////////////////////////////////////////////////////////

    add_files_to_converter_medtagger_txts: function(files) {
        console.log('* adding '+files.length+' files to converter medtagger txts');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // save this file
            this.converter_corpus_medtagger_txt_files[
                this.converter_corpus_medtagger_txt_files.length
            ] = file;
        }

        // update numbers and samples
        app_hotpot.vpp.$data.n_converter_corpus_medtagger_txt_files = this.converter_corpus_medtagger_txt_files.length;

        // update some sample data
        app_hotpot.vpp.$data.converter_corpus_medtagger_txt_files = this.hard_slice(
            this.converter_corpus_medtagger_txt_files,
            this.vpp.$data.max_converter_display_files
        );

        // reset loading status
        this.vpp.$data.is_converter_loading_medtagger_txt_files = false;
    },

    add_files_to_converter_medtagger_anns: function(files) {
        console.log('* adding '+files.length+' files to converter medtagger anns');
        for (let i = 0; i < files.length; i++) {
            var file = files[i];

            // add more information for ann
            file.text = file.text.trim();
            file.lines = file.text.split('\n');
            
            // save this file
            this.converter_corpus_medtagger_ann_files[
                this.converter_corpus_medtagger_ann_files.length
            ] = file;
        }

        // update numbers and samples
        app_hotpot.vpp.$data.n_converter_corpus_medtagger_ann_files = this.converter_corpus_medtagger_ann_files.length;

        // update some sample data
        app_hotpot.vpp.$data.converter_corpus_medtagger_ann_files = this.hard_slice(
            this.converter_corpus_medtagger_ann_files,
            this.vpp.$data.max_converter_display_files
        );

        // reset loading status
        this.vpp.$data.is_converter_loading_medtagger_ann_files = false;
    },

    convert_from_medtagger_txt_and_ann: function() {
        if (this.converter_corpus_medtagger_txt_files.length == 0) {
            app_hotpot.toast('Conversion is terminated. The .txt text files are needed for conversion.', 'alert');
            return;
        }
        if (this.converter_corpus_medtagger_ann_files.length == 0) {
            app_hotpot.toast('Conversion is terminated. The .ann output files are needed for conversion.', 'alert');
            return;
        }
        this.converter_results = medtagger_toolkit.convert_medtagger_files_to_anns(
            this.converter_corpus_medtagger_txt_files,
            this.converter_corpus_medtagger_ann_files,
            this.vpp.$data.dtd
        );

        // update the number
        app_hotpot.vpp.$data.n_converter_results = this.converter_results.length;

        // copy to vpp
        app_hotpot.vpp.$data.converter_results = this.hard_slice(
            this.converter_results,
            this.vpp.$data.max_converter_display_files
        );
    },

    /////////////////////////////////////////////////////////////////
    // General functions
    /////////////////////////////////////////////////////////////////

    clear_converter_corpus_all: function() {
        // remove the medtagger files
        this.converter_corpus_medtagger_txt_files = [];
        this.converter_corpus_medtagger_ann_files = [];
        
        // remove the raw files
        this.converter_corpus_raw_txt_files = [];

        // remove the results
        this.converter_results = [];
    },

    download_converted_results_as_zip: function() {
        if (this.converter_results.length == 0) {
            app_hotpot.toast('Download is terminated. No converted files are found for conversion.', 'alert');
            return;
        }

        // create filename
        var fn = this.vpp.$data.dtd.name + '-' +
            this.vpp.converter_corpus_task + '-' +
            this.vpp.get_date_now() +
            '.zip';
        
        // donwload!
        var file_list = nlp_toolkit.download_dataset_raw(
            this.converter_results,
            this.vpp.$data.dtd,
            fn,
            true
        );
        
        console.log('* downloaded converted files as a zip:', file_list);
    },
});

Object.assign(app_hotpot.vpp_methods, {

    /////////////////////////////////////////////////////////////////
    // Raw text format related functions
    /////////////////////////////////////////////////////////////////
    on_drop_converter_raw_txt: function(event) {
        // prevent the default download event
        event.preventDefault();
        // get all dropped items
        let items = event.dataTransfer.items;
        // set loading status
        this.is_converter_loading_raw_txt_files = true;

        // set loading iaa_id
        var promise_files = fs_get_file_texts(
            items,
            // only accept xml for iaa
            function(fn) {
                if (app_hotpot.is_file_ext_txt(fn)) {
                    return true;
                }
                return false;
            }
        );
        promise_files.then(function(files) {
            app_hotpot.add_files_to_converter_raw_txts(files);
        });
    },

    /////////////////////////////////////////////////////////////////
    // MedTagger format related functions
    /////////////////////////////////////////////////////////////////
    on_drop_converter_medtagger_txt: function(event) {
        // prevent the default download event
        event.preventDefault();
        // get all dropped items
        let items = event.dataTransfer.items;
        // set loading status
        this.is_converter_loading_medtagger_txt_files = true;

        // set loading iaa_id
        var promise_files = fs_get_file_texts(
            items,
            // only accept xml for iaa
            function(fn) {
                if (app_hotpot.is_file_ext_txt(fn)) {
                    return true;
                }
                return false;
            }
        );
        promise_files.then(function(files) {
            app_hotpot.add_files_to_converter_medtagger_txts(files);
        });
    },

    // callback for loading ann files
    on_drop_converter_medtagger_ann: function(event) {
        // prevent the default download event
        event.preventDefault();
        // get all dropped items
        let items = event.dataTransfer.items;
        // set loading status
        this.is_converter_loading_medtagger_ann_files = true;

        // set loading iaa_id
        var promise_files = fs_get_file_texts(
            items,
            // only accept xml for iaa
            function(fn) {
                if (app_hotpot.is_file_ext_ann(fn)) {
                    return true;
                }
                return false;
            }
        );
        promise_files.then(function(files) {
            app_hotpot.add_files_to_converter_medtagger_anns(files);
        });
    },
    

    /////////////////////////////////////////////////////////////////
    // General converter functions
    /////////////////////////////////////////////////////////////////
    /**
     * Quick view the converted ann
     * 
     * @param {Object} event click event
     * @param {Object} ann an annotation
     */
    qv_converter_result_ann: function(event, ann) {
        // get position
        var x = event.clientX;
        var y = event.clientY;
        console.log('* show tqv at (' + x + ', ' + y + ')');

        // get the content to show
        var xmlstr = ann_parser.xml2str(
            ann_parser.ann2xml(
                ann,
                this.dtd
            )
        );

        // show content
        this.show_tqv_at(
            xmlstr,
            x,
            y,
            ann._filename,
            'File Size: ' + (xmlstr.length / 1024).toFixed(2) + 'kb'
        );
    },

    qv_converter_txt: function(event, file) {
        // get position
        var x = event.clientX;
        var y = event.clientY;
        console.log('* show tqv at (' + x + ', ' + y + ')');

        // show content
        this.show_tqv_at(
            file.text,
            x,
            y,
            file.fn,
            'File Size: ' + (file.text.length / 1024).toFixed(2) + 'kb'
        );
    },

    switch_corpus: function(corpus_task) {
        this.converter_corpus_task = corpus_task;
    },

    clear_converter_corpus_all: function() {
        // remove outside data
        app_hotpot.clear_converter_corpus_all();

        // remove vpp data
        // remove the medtagger files
        this.n_converter_corpus_medtagger_txt_files = 0;
        this.n_converter_corpus_medtagger_ann_files = 0;
        this.converter_corpus_medtagger_txt_files = [];
        this.converter_corpus_medtagger_ann_files = [];
        
        // remove the raw files
        this.n_converter_corpus_raw_txt_files = 0;
        this.converter_corpus_raw_txt_files = [];

        // remove the results
        this.n_converter_results = 0;
        this.converter_results = [];
    },

    convert_corpus_to_medtator_format: function() {
        if (this.converter_corpus_task == 'medtagger') {
            app_hotpot.convert_from_medtagger_txt_and_ann();

        } else if (this.converter_corpus_task == 'raw') {
            app_hotpot.convert_from_raw_txt();
        }
    },

    download_converted_result: function(ann) {
        // convert to xml first
        var xmlDoc = ann_parser.ann2xml(ann, this.dtd);

        // convert xml to string
        var xmlStr = ann_parser.xml2str(xmlDoc, false);

        // save this
        var blob = new Blob(
            [xmlStr], 
            {type: "text/xml;charset=utf-8"}
        );
        saveAs(blob, ann._filename);
    },

    download_converted_results_as_zip: function() {
        app_hotpot.download_converted_results_as_zip();
    },

    show_converter_how_to_user: function() {
        window.open(
            'https://github.com/OHNLP/MedTator/wiki/Manual#converter-tab',
            '_blank'
        );
    },
});