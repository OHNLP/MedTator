/**
 * This is an extension for converter 
 */

/////////////////////////////////////////////////////////////////
// Corpus converter related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {
    // tasks
    // 1. medtagger: txt+ann
    // 2. raw: txt
    converter_corpus_task: 'raw',
    converter_results: [],

    // for medtagger
    is_converter_loading_medtagger_txt_files: false,
    is_converter_loading_medtagger_ann_files: false,
    converter_corpus_medtagger_txt_files: [],
    converter_corpus_medtagger_ann_files: [],

    // for pure raw text
    is_converter_loading_raw_txt_files: false,
    converter_corpus_raw_txt_files: [],
});

/////////////////////////////////////////////////////////////////
// Corpus converter related functions
/////////////////////////////////////////////////////////////////

Object.assign(app_hotpot, {

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
            app_hotpot.vpp.add_files_to_converter_raw_txts(files);
        });
    },

    add_files_to_converter_raw_txts: function(files) {
        console.log('* adding '+files.length+' files to converter raw txts');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.converter_corpus_raw_txt_files[
                this.converter_corpus_raw_txt_files.length
            ] = file;
        }

        // reset loading status
        this.is_converter_loading_raw_txt_files = false;
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
                this.dtd
            );
            ann._filename = file.fh.name + '.xml';

            this.converter_results[
                this.converter_results.length
            ] = ann;
        }

        this.converter_results = this.converter_results;
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
            app_hotpot.vpp.add_files_to_converter_medtagger_txts(files);
        });
    },

    add_files_to_converter_medtagger_txts: function(files) {
        console.log('* adding '+files.length+' files to converter medtagger txts');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // if (app_hotpot.is_fn_existed_in_files(
            //     file.fh.name,
            //     this.converter_corpus_medtagger_txt_files
            // )) {
            //     app_hotpot.toast('Skip [' + file.fh.name + '] due to duplicated file name');
            //     return;
            // }
            this.converter_corpus_medtagger_txt_files[
                this.converter_corpus_medtagger_txt_files.length
            ] = file;
        }

        // reset loading status
        this.is_converter_loading_medtagger_txt_files = false;
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
            app_hotpot.vpp.add_files_to_converter_medtagger_anns(files);
        });
    },

    add_files_to_converter_medtagger_anns: function(files) {
        console.log('* adding '+files.length+' files to converter medtagger anns');
        for (let i = 0; i < files.length; i++) {
            var file = files[i];

            // add more information for ann
            file.text = file.text.trim();
            file.lines = file.text.split('\n');
            // if (app_hotpot.is_fn_existed_in_files(
            //     file.fh.name,
            //     this.converter_corpus_medtagger_ann_files
            // )) {
            //     app_hotpot.toast('Skip [' + file.fh.name + '] due to duplicated file name');
            //     return;
            // }
            this.converter_corpus_medtagger_ann_files[
                this.converter_corpus_medtagger_ann_files.length
            ] = file;
        }

        // reset loading status
        this.is_converter_loading_medtagger_ann_files = false;
    },

    convert_from_medtagger_txt_and_ann: function() {
        if (this.dtd == null) {
            app_hotpot.toast('Conversion is terminated. The annotation schema (.dtd) is needed for conversion. Please load the schema file first in the annotation tab', 'alert');
            return;
        }
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
            this.dtd
        );
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
            ann_parser.ann2xml(ann)
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
            file.fh.name,
            'File Size: ' + (file.text.length / 1024).toFixed(2) + 'kb'
        );
    },

    switch_corpus: function(corpus_task) {
        this.converter_corpus_task = corpus_task;
    },

    clear_converter_corpus_all: function() {
        // remove the medtagger files
        this.converter_corpus_medtagger_txt_files = [];
        this.converter_corpus_medtagger_ann_files = [];

        // remove the raw files
        this.converter_corpus_raw_txt_files = [];

        // remove the results
        this.converter_results = [];
    },

    convert_corpus_to_medtator_format: function() {
        if (this.converter_corpus_task == 'medtagger') {
            this.convert_from_medtagger_txt_and_ann();

        } else if (this.converter_corpus_task == 'raw') {
            this.convert_from_raw_txt();
        }
    },

    download_converted_result: function(ann) {
        // convert to xml first
        var xmlDoc = ann_parser.ann2xml(ann, this.dtd);

        // convert xml to string
        var xmlStr = ann_parser.xml2str(xmlDoc, false);

        // save this
        var blob = new Blob([xmlStr], {type: "text/xml;charset=utf-8"});
        saveAs(blob, ann._filename);
    },

    download_converted_results_as_zip: function() {
        if (this.converter_results.length == 0) {
            app_hotpot.toast('Download is terminated. No converted files are found for conversion.', 'alert');
            return;
        }

        // get the results, which are the ann files 
        var anns = [];
        for (let i = 0; i < this.converter_results.length; i++) {
            const ann = this.converter_results[i];
            // the medtator_ann contains the ann objects for MedTator
            anns.push(ann);
        }

        // create filename
        var fn = 'Converted-' + 
            this.converter_corpus_task + 
            '-' +
            this.get_date_now() +
            '.zip';
        
        var file_list = nlp_toolkit.download_dataset_raw(
            anns,
            this.dtd,
            fn,
            true
        );
        
        console.log('* downloaded converted files as a zip:', file_list);
    },

    show_converter_how_to_user: function() {
        window.open(
            'https://github.com/OHNLP/MedTator/wiki/Manual#converter-tab',
            '_blank'
        );
    },
});