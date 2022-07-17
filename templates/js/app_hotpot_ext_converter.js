/**
 * This is an extension for converter 
 */

/////////////////////////////////////////////////////////////////
// Corpus converter related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {
    converter_corpus_task: 'medtagger',

    // for medtagger
    convert_rnd: 0,
    is_converter_loading_medtagger_txt_files: false,
    converter_corpus_medtagger_txt_files: [],
    converter_corpus_medtagger_ann_files: [],
    converter_corpus_medtagger_results: []
});

/////////////////////////////////////////////////////////////////
// Corpus converter related functions
/////////////////////////////////////////////////////////////////

Object.assign(app_hotpot, {

    on_get_converter_medtagger_txt_file: function(file) {
        // check duplication
        if (app_hotpot.vpp.exists_converter_corpus_file(
            file.fh.name,
            app_hotpot.vpp.$data.converter_corpus_medtagger_txt_files
        )) {
            app_hotpot.toast('Skip [' + fh.name + '] due to duplicated file name');
            return;
        }
        app_hotpot.vpp.$data.converter_corpus_medtagger_txt_files[
            app_hotpot.vpp.$data.converter_corpus_medtagger_txt_files.length
        ] = file;
        // console.log('* added', file);
    },

    on_get_converter_medtagger_ann_file: function(file) {
        // for ann, we need the lines
        file.text = file.text.trim();
        file.lines = file.text.split('\n');

        // save this 
        app_hotpot.vpp.$data.converter_corpus_medtagger_ann_files[
            app_hotpot.vpp.$data.converter_corpus_medtagger_ann_files.length
        ] = file;
    }
});


Object.assign(app_hotpot.vpp_methods, {
    on_drop_converter_medtagger_txt: function(event) {
        // prevent the default download event
        event.preventDefault();

        let items = event.dataTransfer.items;
        for (let i=0; i<items.length; i++) {
            // get this item as a FileSystemHandle Object
            // this could be used for saving the content back
            // let item = items[i].webkitGetAsEntry();
            let item = items[i].getAsFileSystemHandle();
            app_hotpot.vpp.$data.is_converter_loading_medtagger_txt_files = true;

            // read this handle
            item.then(function(fh) {
                if (fh.kind == 'file') {
                    app_hotpot.parse_file_fh(
                        fh, 
                        function(file) {
                            app_hotpot.on_get_converter_medtagger_txt_file(file);
                            app_hotpot.vpp.$data.is_converter_loading_medtagger_txt_files = false;
                            app_hotpot.vpp.$data.convert_rnd = Math.random();
                        },
                        app_hotpot.is_file_ext_txt
                    );

                } else {
                    // so item is a directory?
                    app_hotpot.parse_dir_fh(
                        fh, 
                        function(files) {
                            for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                app_hotpot.on_get_converter_medtagger_txt_file(file);
                            }
                            console.log('* parsed all '+ files.length +' files in folder');
                            // then we can update GUI
                            app_hotpot.vpp.$data.is_converter_loading_medtagger_txt_files = false;
                        },
                        app_hotpot.is_file_ext_txt
                    );
                }
            });
        }
    },

    // callback for loading ann files
    on_drop_converter_medtagger_ann: function(event) {
        // prevent the default download event
        event.preventDefault();


        let items = event.dataTransfer.items;
        for (let i=0; i<items.length; i++) {
            // get this item as a FileSystemHandle Object
            // this could be used for saving the content back
            // let item = items[i].webkitGetAsEntry();
            let item = items[i].getAsFileSystemHandle();

            // read this handle
            item.then(function(fh) {
                if (fh.kind == 'file') {
                    app_hotpot.parse_file_fh(
                        fh, 
                        app_hotpot.on_get_converter_medtagger_ann_file
                    );
                } else {
                    // so item is a directory?
                    app_hotpot.parse_dir_fh(
                        fh, 
                        app_hotpot.on_get_converter_medtagger_ann_file
                    );
                }
            });
        }
    },

    switch_corpus: function(corpus_task) {
        this.converter_corpus_task = corpus_task;
    },

    clear_converter_corpus_all: function() {
        // remove the medtagger files
        this.converter_corpus_medtagger_txt_files = [];
        this.converter_corpus_medtagger_ann_files = [];
        this.converter_corpus_medtagger_results = [];
    },

    exists_converter_corpus_file: function(fn, files) {
        for (let i = 0; i < files.length; i++) {
            const _f = files[i];
            if (_f.fh.name == fn) {
                return true;
            }
        }

        return false;
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
        if (this.converter_corpus_medtagger_txt_files.length == 0) {
            app_hotpot.toast('Conversion is terminated. The .ann output files are needed for conversion.', 'alert');
            return;
        }
        this.converter_corpus_medtagger_results = medtagger_toolkit.convert_medtagger_files_to_anns(
            this.converter_corpus_medtagger_txt_files,
            this.converter_corpus_medtagger_ann_files,
            this.dtd
        );
    },

    download_converted_files_as_zip: function() {
        if (this.converter_corpus_medtagger_results.length == 0) {
            app_hotpot.toast('Download is terminated. No converted files are found for conversion.', 'alert');
            return;
        }

        // get the results, which are the ann files 
        var anns = [];
        for (let i = 0; i < this.converter_corpus_medtagger_results.length; i++) {
            const r = this.converter_corpus_medtagger_results[i];
            // the medtator_ann contains the ann objects for MedTator
            anns.push(r.medtator_ann);
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