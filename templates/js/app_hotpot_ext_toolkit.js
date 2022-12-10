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
});


Object.assign(app_hotpot.vpp_methods, {

    tk_show_section: function(sec_name) {
        this.toolkit_section = sec_name;
    },

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
        this.force_module_update = Math.random();
    },

    tk_medtaggervis_clear_all: function() {
        this.tk_medtaggervis_txt_files = [];
        this.tk_medtaggervis_ann_files = [];

        // force update
        this.force_module_update = Math.random();
    },

    tk_medtaggervis_on_click_txt_file: function(fn) {
        console.log('* clicked tk medtaggervis txt file', fn);
    },

    tk_medtaggervis_on_click_ann_file: function(fn_ann) {

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

        // Now let's create the visualization?
    },

    tk_medtaggervis_parse_files: function() {

    }
});