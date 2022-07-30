/**
 * This is an extension for the error analysis in app_hotpot
 */

/////////////////////////////////////////////////////////////////
// Error Analysis related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {

    // loading files 
    // null: not loading
    // any number: loading
    razer_loading_status: null,

    // for holding the uploaded anns
    razer_ann_list: [
        // the first one must be the GSC
        { anns: [], name: 'Gold Standard Corpus' },
        // others follow the same structure
        { anns: [], name: 'Dataset 1' }
    ],

    // by default, just use the first dataset
    // the rid is this razer id or resource id
    razer_idx: 1,

    // for all razer information
    // the structure looks like:
    // {
    //     // this is the result of dataset 1
    //     // it's a err_dict
    //     1: {
    //         err_dict: { uid: {} },
    //         iaa_dict: { } // same iaa_dict
    //     },
    //     2: {}
    // },
    // 
    // we don't want to save extra information here
    razer_dict: null
});


/////////////////////////////////////////////////////////////////
// Error Analysis related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_methods, {

    on_drop_dropzone_razer: function(event, rid) {
        // stop the download event
        event.preventDefault();
        const items = event.dataTransfer.items;

        // set loading status
        this.razer_loading_status = rid;

        // set loading rid
        var promise_files = fs_get_file_texts_by_items(
            items,
            // only accept xml for iaa
            function(fn) {
                if (app_hotpot.is_file_ext_xml(fn)) {
                    return true;
                }
                return false;
            }
        );
        promise_files.then(function(files) {
            app_hotpot.vpp.add_files_to_razer_anns(files, rid);
        });
    },

    add_files_to_razer_anns: function(files, rid) {
        console.log('* adding '+files.length+' files to razer anns ' + rid);
        // it's possible that the `rid` slot is not ready
        if (this.razer_ann_list.length <= rid) {
            this.razer_ann_list.push({
                anns: [],
                name: 'Dataset ' + rid
            });
        }
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            var ann = app_hotpot.parse_file2ann(
                file,
                this.dtd
            );

            // it is possible that something wrong
            if (ann == null) {
                continue;
            }

            // save this ann
            this.razer_ann_list[rid].anns[
                this.razer_ann_list[rid].anns.length
            ] = ann;
        }

        // done
        this.razer_loading_status = null;
    },

    razer_analyze: function() {
        // first, get the IAA result 
        var iaa_dict = iaa_calculator.evaluate_anns_on_dtd(
            this.dtd,
            // using 1 as dataset for eva
            this.razer_ann_list[1].anns,
            // using 0 as GSC
            this.razer_ann_list[0].anns,
            'overlap',
            iaa_calculator.default_overlap_ratio,
            null,
            true
        );

        // second, get the err_dict and doc_dict
        var err_doc = iaa_calculator.get_iaa_error_tags(
            iaa_dict,
            this.dtd
        );

        // then, get the stat

        // last, set
        if (this.razer_dict == null) {
            this.razer_dict = {};
        }
        this.razer_dict[
            this.razer_idx
        ] = {
            iaa_dict: iaa_dict,
            err_dict: err_doc.err_dict
        };
    },

    razer_export_report: function() {

    }
});