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
    //         err_stat: {},
    //         err_dict: { uid: {} },
    //         iaa_dict: { }, // same iaa_dict
    //     },
    //     2: {}
    // },
    // 
    // we don't want to save extra information here
    razer_dict: null,

    // the err def for analysis
    razer_err_def: null,
    razer_err_def_mapping: {},

    // show panel?
    is_shown_razer_pan_err_def: false,
    razer_active_err_uid: null,
    razer_pan_err_def_right: 0,
    razer_pan_err_def_top: 0,

    // the fig obj
    razer_fig_sankey: null,

    // the uids for checking
    razer_err_list_uids: null
});


/////////////////////////////////////////////////////////////////
// Error Analysis related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_methods, {

    get_razer_rst: function() {
        if (this.razer_dict == null) {
            return null;
        } else {
            return this.razer_dict[this.razer_idx];
        }
    },

    get_razer_err: function(uid) {
        var rr = this.get_razer_rst();
        if (rr == null) {
            return null;
        }
        if (rr.err_dict.hasOwnProperty(uid)) {
            return rr.err_dict[uid];
        }
        return null;
    },

    get_razer_n_stat_by_err_type: function(err_type, err) {
        var stat = this.get_razer_stat_by_err_type(err_type, err);

        if (stat == null) {
            return null;
        } else {
            return stat.length;
        }
    },

    get_razer_stat_by_err_type: function(err_type, err) {
        var rr = this.get_razer_rst();
        if (rr == null) {
            return null;
        }
        if (!rr.err_stat.by_err.hasOwnProperty(err_type)) {
            return null;
        }

        // err is FP or FN
        if (typeof(err)=='undefined') {
            return rr.err_stat.by_err[err_type].FP.concat(
                rr.err_stat.by_err[err_type].FN
            );
        }
        return rr.err_stat.by_err[err_type][err];
    },

    clear_razer_all: function() {
        this.razer_ann_list = [
            // the first one must be the GSC
            { anns: [], name: 'Gold Standard Corpus' },
            // others follow the same structure
            { anns: [], name: 'Dataset 1' }
        ];
        this.razer_idx = 1;
        this.razer_dict = null;
        this.razer_err_def = null;
    },

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

        if (this.razer_dict != null) {
            // which means there is something analyzed
            var ret = app_hotpot.confirm(
                'Re-Analyze will overwrite ALL of the existing error labels. You can save the current first before doing this. Are you sure to continue?'
            );

            if (ret) {

            } else {
                return;
            }
        }

        if (this.razer_err_def == null) {
            this.razer_err_def = JSON.parse(JSON.stringify(error_analyzer.DEFAULT_ERROR_DEF));

            // add mapping
            var shortcut = 1;
            for (const err_cate in this.razer_err_def) {
                this.razer_err_def_mapping[shortcut] = err_cate;
                shortcut += 1;
            }

            // add UNKNOWN
            this.razer_err_def[error_analyzer.UNK_ERROR_CATE] = [error_analyzer.UNK_ERROR_TYPE];
        }

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
        var err_stat = error_analyzer.get_err_stat(
            iaa_dict,
            err_doc.err_dict,
            this.dtd
        );

        // last, set to razer_dict
        if (this.razer_dict == null) {
            this.razer_dict = {};
        }
        this.razer_dict[
            this.razer_idx
        ] = {
            iaa_dict: iaa_dict,
            err_dict: err_doc.err_dict,
            err_stat: err_stat
        };

        // draw?
        this.razer_draw_sankey();
    },

    update_razer_dict_stats: function() {
        // then, get the stat
        var err_stat = error_analyzer.get_err_stat(
            this.razer_dict[this.razer_idx].iaa_dict,
            this.razer_dict[this.razer_idx].err_dict,
            this.dtd
        );

        // just update stats
        this.razer_dict[
            this.razer_idx
        ].err_stat = err_stat;

        // draw?
        this.razer_draw_sankey();
    },

    razer_draw_sankey: function() {
        var data_sankey = error_analyzer.get_sankey_data(
            this.get_razer_rst().err_stat.by_rel
        );
        console.log('* got data for sankey diagram', data_sankey);

        if (this.razer_fig_sankey == null) {
            // make a new sankey figure
            this.razer_fig_sankey = figmker_sankey.make_fig(
                '#razer_sankey_diagram'
            );
            this.razer_fig_sankey.headers = [
                'Error',
                'Error Category',
                'Error Type',
                'Concept'
            ]
            this.razer_fig_sankey.init();
        }

        this.razer_fig_sankey.draw(data_sankey);
    },

    razer_export_report: function() {

    },

    close_razer_pan_err_def: function() {
        this.is_shown_razer_pan_err_def = false;
        this.razer_active_err_uid = null;
    },

    show_razer_pan_err_def_for_uid: function(event, uid) {
        // set the working uid
        this.razer_active_err_uid = uid;

        // get mouse position
        var x = event.clientX;
        var y = event.clientY;

        this.razer_pan_err_def_right = 5;

        var new_top = y - 110;
        if (new_top + $('#razer_pan_err_def').height() > $('#main_ui').height()) {
            new_top = $('#main_ui').height() - $('#razer_pan_err_def').height() - 1;
        }
        this.razer_pan_err_def_top = new_top;

        // ok, show it
        this.is_shown_razer_pan_err_def = true;
    },

    show_uids_in_razer_err_list: function(uids1, uids2) {
        // empty the current list
        // this.razer_err_list_uids = [];

        if (uids1 == null) {
            if (uids2 == null) {

            } else {
                this.razer_err_list_uids = uids2;
            }
        } else {
            if (uids2 == null) {
                this.razer_err_list_uids = uids1;

            } else {
                this.razer_err_list_uids = uids1.concat(uids2);
            }
        }
    },

    get_html_sentag_by_err: function(err) {
        var tag = err.tag;
        var txt = err.text;
        var sen = err.sentence;

        var colored_txt = '<span class="clr-black mark-tag-' + tag + '">' + 
            txt + 
            '</span>';

        var html = sen.replace(txt, colored_txt);

        return '<span>' + html + '</html>';
    },

    add_razer_err_label: function(err_cate, err_type, uid) {
        var rr = this.get_razer_rst();
        if (rr == null) {
            return null;
        }

        // ok, let's check errors label
        if (!rr.err_dict[uid].hasOwnProperty('errors')) {
            rr.err_dict[uid]['errors'] = [];
        }

        // add this tag?
        rr.err_dict[uid]['errors'].push({
            category: err_cate,
            type: err_type
        });

        // close?
        this.close_razer_pan_err_def();

        // update UI?
        this.update_razer_dict_stats();
    },

    remove_razer_err_label: function(uid, e_idx) {

    }
});