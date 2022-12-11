Object.assign(app_hotpot.vpp_data, {
    // toolkit
    // 1. medtaggervis
    // 2. iob2editor
    toolkit_section: 'medtaggervis',

    // for medtaggervis
    tk_medtaggervis_is_loading_txt_files: false,
    tk_medtaggervis_is_loading_ann_files: false,
    tk_medtaggervis_txt_files: [],
    tk_medtaggervis_ann_files: [],
    tk_medtaggervis_force_module_update: 0,

    // for iob2editor
    tk_iob2editor_is_loading_iob_files: false,
    tk_iob2editor_iob_files: [],
    tk_iob2editor_force_module_update: 0,

});


Object.assign(app_hotpot.vpp_methods, {

    tk_show_section: function(sec_name) {
        this.toolkit_section = sec_name;
    },


    /////////////////////////////////////////////////////////////////
    // MedTaggerVis related functions
    /////////////////////////////////////////////////////////////////

    tk_medtaggervis_on_drop_txt_files: function(event) {
        // prevent the default download event
        event.preventDefault();

        // get items
        const items = event.dataTransfer.items;
        console.log('* dropped ' + items.length + ' items but maybe not all are acceptable.');

        // first, set to loading status and init the values
        this.tk_medtaggervis_is_loading_txt_files = true;

        var promise_files = fs_get_file_texts_by_items(
            items,
            function(fn) {
                if (app_hotpot.is_file_ext_txt(fn)) {
                    return true;
                }
                return false;
            }
        );

        // call back
        promise_files.then(function(files) {
            app_hotpot.vpp.tk_medtaggervis_add_txt_files(files);
        });
    },

    tk_medtaggervis_add_txt_files: function(files) {
        console.log('* adding '+files.length+' txt files to medtaggervis');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // save this file
            this.tk_medtaggervis_txt_files[
                this.tk_medtaggervis_txt_files.length
            ] = file;
        }

        // reset loading status
        this.tk_medtaggervis_is_loading_txt_files = false;

        // force update
        this.force_module_update = Math.random();
    },
    

    tk_medtaggervis_on_drop_ann_files: function(event) {
        // prevent the default download event
        event.preventDefault();

        // get items
        const items = event.dataTransfer.items;
        console.log('* dropped ' + items.length + ' items but maybe not all are acceptable.');

        // first, set to loading status and init the values
        this.tk_medtaggervis_is_loading_ann_files = true;

        var promise_files = fs_get_file_texts_by_items(
            items,
            function(fn) {
                if (app_hotpot.is_file_ext_ann(fn)) {
                    return true;
                }
                return false;
            }
        );

        // call back
        promise_files.then(function(files) {
            app_hotpot.vpp.tk_medtaggervis_add_ann_files(files);
        });
    },

    tk_medtaggervis_add_ann_files: function(files) {
        console.log('* adding '+files.length+' ann files to medtaggervis');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // save this file
            this.tk_medtaggervis_ann_files[
                this.tk_medtaggervis_ann_files.length
            ] = file;
        }

        // reset loading status
        this.tk_medtaggervis_is_loading_ann_files = false;

        // force update
        this.tk_medtaggervis_force_module_update = Math.random();
    },

    tk_medtaggervis_clear_all: function() {
        // clear data
        this.tk_medtaggervis_txt_files = [];
        this.tk_medtaggervis_ann_files = [];

        // clear figure
        fig_bratvis.clear('tk_medtaggervis_brat_fig');

        // force update
        this.tk_medtaggervis_force_module_update = Math.random();
    },

    tk_medtaggervis_on_click_txt_file: function(file) {
        console.log('* clicked tk medtaggervis txt file', file);
    },

    tk_medtaggervis_on_click_ann_file: function(file) {
        var fn_ann = file.fn;

        // OK, next need to search 
        var fn_txt = fn_ann.substring(0, fn_ann.length-4);

        // get this file
        function _ff(fn, list) {
            for (let i = 0; i < list.length; i++) {
                var file = list[i];
                if (file.fn == fn) {
                    return file
                }
            }
            return null;
        }
        var f_ann = _ff(fn_ann, this.tk_medtaggervis_ann_files);
        var f_txt = _ff(fn_txt, this.tk_medtaggervis_txt_files);
        if (f_txt == null) {
            app_hotpot.toast(
                '[' + fn_txt + '] is not found in your uploaded files, please ensure the file is uploaded or the file name is correct.',
                'warning'
            );
            return;
        }
        console.log('* found ann file', f_ann, ' and txt file', f_txt);

        // get the collection and document data
        var text = f_txt.text;
        var ann_rs = medtagger_toolkit.parse_ann_file(f_ann);
        var brat_vis_obj = brat_parser.medtagger2brat(
            text,
            ann_rs
        );
        console.log('* got brat vis obj', brat_vis_obj);

        // Now let's create the visualization?
        // clear figure if any
        fig_bratvis.clear('tk_medtaggervis_brat_fig');

        // then draw a new one
        fig_bratvis.visualize(
            brat_vis_obj.col_data,
            brat_vis_obj.doc_data,
            'tk_medtaggervis_brat_fig'
        );
    },

    tk_medtaggervis_parse_files: function() {

    },

    tk_medtaggervis_how_to_use: function() {
        this.show_help('tk_medtaggervis_help');
    },




    /////////////////////////////////////////////////////////////////
    // IOB2Editor related functions
    /////////////////////////////////////////////////////////////////


    tk_iob2editor_on_drop_iob_files: function(event) {
        // prevent the default download event
        event.preventDefault();

        // get items
        const items = event.dataTransfer.items;
        console.log('* dropped ' + items.length + ' items but maybe not all are acceptable.');

        // first, set to loading status and init the values
        this.tk_iob2editor_is_loading_iob_files = true;

        var promise_files = fs_get_file_texts_by_items(
            items,
            function(fn) {
                // no file name extension requirement for iob2/bio
                return true;
            }
        );

        // call back
        promise_files.then(function(files) {
            app_hotpot.vpp.tk_iob2editor_add_iob_files(files);
        });
    },

    tk_iob2editor_add_iob_files: function(files) {
        console.log('* adding '+files.length+' iob files to iob2editor');
        for (let i = 0; i < files.length; i++) {
            var file = files[i];

            // add status
            file.has_saved = false;
            
            // save this file
            this.tk_iob2editor_iob_files[
                this.tk_iob2editor_iob_files.length
            ] = file;
        }

        // reset loading status
        this.tk_iob2editor_is_loading_iob_files = false;

        // force update
        this.tk_iob2editor_force_module_update = Math.random();
    },

    tk_iob2editor_clear_all: function() {
        // clear data
        this.tk_iob2editor_iob_files = [];

        // force update
        this.tk_iob2editor_force_module_update = Math.random();
    },

    tk_iob2editor_on_click_iob_file: function(file) {

    }
});