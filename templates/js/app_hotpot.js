var app_hotpot = {
    // metro app toast
    metro_toast: Metro.toast.create,

    // for tracking how many anns
    n_anns: 0,

    // the magic number for MedTator World Peace
    // (no need to force update)
    cnt_no_more_anns: 0,

    // the threshold of number of anns for a small project
    n_anns_small_project: 100,

    // for tour
    tour: {
        annotation: null,
    },

    // waiting for closing 
    seconds_before_closing_loading_anns_panel: 3,

    // for key event
    has_pressed_ctrl_meta: false,

    // vue app
    vpp: null,
    vpp_id: '#app_hotpot',

    vpp_data: {

        // for the section control
        section: 'annotation',

        // for the dtd
        dtd: null,

        // decide which ann file is working on.
        // null indicates that currently it is not editing
        ann_idx: null,

        // for the ann files in the file list
        anns: [],
        mn4anns: 0.1,

        // pagination
        pg_index: 0,
        pg_total: 1,
        pg_numpp: 100,

        // for loading many anns
        is_loading_anns: false,
        is_loaded_anns: false,
        msg_loading_anns: '',
        n_anns_droped: 0,
        n_anns_loaded: 0,
        n_anns_error: 0,

        // sort anns
        // - default: how the anns are imported into tool
        // - alphabet: A-Z
        // - alphabet_r: Z-A
        // - tags: 0-N
        // - tags_r: N-0
        // - label: color
        sort_anns_by: 'default',

        // for annotation tab working mode
        // there will be the following mode:
        // 1. annotation, which is the usually mode, and it is default
        // 2. adjudication, which is for adjudication from adj.tab
        // the UI logic will be different in each mode
        annotation_tab_working_mode: 'annotation',

        // for showing the tag by tag_name,
        display_tag_name: '__all__',

        // statistics
        display_stat_doc_sum_selected: null,
        stat_filter_min_tokens: 0,
        stat_filter_token_text: true,

        // for the hints of current ann
        hints: [],

        // for all hints of all anns
        hint_dict: {},

        // for popmenu
        clicked_tag_id: null,

        // hover
        hovered_tag: null,

        // a flag for showing which mode we are working
        is_linking: false,
        linking_tag_def: null,
        linking_tag: null,
        linking_atts: [],
        
        // linking
        pan_working_tag: {
            pos: {
                clientX: undefined,
                clientY: undefined,
                movementX: 0,
                movementY: 0
            }
        },

        // for converting the txt to xmls
        txt_anns: [],
        txt_xmls: [],
        txt_xml_prefix: '',
        txt_xml_suffix: '',

        // for file name filter
        fn_pattern: '',

        // for updating the sub module
        force_module_update: Math.random(), 

        // for IAA
        // see app_hotpot_ext_iaa.js

        // cm settings
        cm: {
            // document / sentences
            display_mode: 'document',

            // node / span
            mark_mode: 'node',

            // simple / smart
            hint_mode: 'simple',

            // update the hint when delete
            // but I found this is not doable.
            // the deleted tag may be used in different place,
            // so simplely deleting the token from hint dict 
            // may cause issue.
            enabled_auto_hint_update: true,

            // display the hints or not
            enabled_hints: true,

            // display the links
            enabled_links: true,

            // display the link name
            enabled_link_name: true,

            // display complex link
            enabled_link_complex: true,

            // for updating the codemirror instance
            is_expire: false
        },

        // general cfg
        cfg: {
            // display the setting panel or not
            enable_show_settings: false,

            // display the old menu dropzone
            enable_display_menu_dropzone_ann: false,

            // auto save the current ann
            auto_save_current_ann: 'disable',

            // active tab
            active_setting_tab: 'gui',

            // which algorithm to use as default
            sentence_splitting_algorithm: 'simpledot',

            // render all marks or only the selected marks
            linking_marks_selection: 'all_concepts',

            // show the new UI for ea
            new_ui_for_ea: 'disable',

            // show the new UI for cohen's kappa
            // due to the 
            new_ui_for_ck: 'disable',
        },

        // for statistics

        // for export
        export_text: '',

        // for texts
        // this variable would be replaced by the 
        // app_hotpot_ext_texts.js module
        texts: {}
    },

    vpp_methods: {

        /////////////////////////////////////////////////////////////////
        // Settings related functions
        /////////////////////////////////////////////////////////////////
        switch_setting_tab: function(tab) {
            this.cfg.active_setting_tab = tab;
        },

        is_adjudication_working_mode: function() {
            return this.annotation_tab_working_mode == 'adjudication';
        },

        is_auto_save: function() {
            return this.cfg.auto_save_current_ann == 'enable';
        },

        get_metator_mem: function() {
            // return Math.floor(window.performance.memory.totalJSHeapSize / 1024 / 1024);
            if (window.hasOwnProperty('performance')) {
                if (window.performance.hasOwnProperty('memory')) {
                    return Math.floor(window.performance.memory.usedJSHeapSize / 1024 / 1024);
                }
            } else {
                return 'NA';
            }
            return 'NA';
        },

        /////////////////////////////////////////////////////////////////
        // Loading files related functions
        /////////////////////////////////////////////////////////////////
        on_dragover_prevent_default: function(event) {
            event.preventDefault();
        },

        on_click_open_dtd_file: function() {
            // the settings for dtd file
            var pickerOpts = {
                types: [
                    {
                        description: 'Annotation Schema File',
                        accept: {
                            'text/dtd': ['.dtd', '.json', '.yaml']
                        }
                    },
                ],
                excludeAcceptAllOption: true,
                multiple: false
            };

            // get the file handles
            var promise_fileHandles = fs_open_files(pickerOpts);

            promise_fileHandles.then(function(fileHandles) {
                // read the fh and set dtd
                // in fact, there is only one file for this dtd
                for (let i = 0; i < fileHandles.length; i++) {
                    const fh = fileHandles[i];

                    // read the file
                    var p_dtd = fs_read_dtd_file_handle(fh);

                    p_dtd.then((function(){
                        return function(dtd) {
                            if (dtd == null) {
                                // must be something wrong
                                app_hotpot.msg(
                                    'Something wrong with the selected file, please check the schema format.', 
                                    'warning'
                                );
                                return;
                            }
                            // just set the dtd
                            app_hotpot.set_dtd(dtd);
                        }
                    })());
                    
                    // just one file
                    break;
                }
            });
            
        },

        on_drop_dropzone_dtd: function(event) {
            // prevent the default download event
            event.preventDefault();

            if (!isFSA_API_OK) {
                app_hotpot.msg('Please use modern web browser for reading local file', 'warning');
                return;
            }

            let items = event.dataTransfer.items;

            // user should only upload one folder or a file
            if (items.length>1) {
                console.log('* selected more than 1 item!');
                app_hotpot.msg('Please just drop only one schema file', 'warning');
                return;
            }

            let item = items[0].getAsFileSystemHandle();
            console.log('* using FSA API to load item as dtd');
            
            // read this handle
            item.then(function(fh) {
                if (fh.kind != 'file') { return null; }

                // get the dtd object
                var p_dtd = fs_read_dtd_file_handle(fh);

                // handle the response
                // we just create a function agent
                // for support other parameters in future if possible
                p_dtd.then((function(){
                    return function(dtd) {
                        if (dtd == null) {
                            // must be something wrong
                            app_hotpot.msg(
                                'Something wrong with the dropped file, please check the schema format.', 
                                'warning'
                            );
                            return;
                        }
                        // just set the dtd
                        app_hotpot.set_dtd(dtd);
                    }
                })());
            });
        },

        on_click_open_ann_files: function() {
            if (this.dtd == null) {
                app_hotpot.msg(
                    "Please load the annotation schema first.",
                    "warning"
                );
                return;
            }
            var pickerOpts = {
                types: [
                    {
                        description: 'Annotation Files',
                        accept: {
                            'text/dtd': ['.xml', '.txt']
                        }
                    },
                ],
                excludeAcceptAllOption: true,
                multiple: true
            };

            var p_fhs = fs_open_files(pickerOpts);

            p_fhs.then(function(fhs) {
                var p_files = fs_get_file_texts_by_fhs(
                    fhs,
                    function(fn) {
                        if (app_hotpot.is_file_ext_txt(fn)) {
                            return true;
                        }
                        if (app_hotpot.is_file_ext_xml(fn)) {
                            return true;
                        }
                        return false;
                    }
                )
                p_files.then(function(files) {
                    app_hotpot.vpp.add_files_to_anns(files);

                    // fix the missing?
                    // app_hotpot.vpp.refresh_v_anns();
                });
            });
        },

        on_drop_filelist: function(event) {
            // prevent the default download event
            event.preventDefault();

            if (this.dtd == null) {
                app_hotpot.msg(
                    "Please load the annotation schema first.",
                    "warning"
                );
                return;
            }

            const items = event.dataTransfer.items;
            console.log('* dropped ' + items.length + ' items but maybe not all are acceptable.');

            // first, set to loading status and init the values
            this.reset_loading_anns_status();
            this.is_loading_anns = true;
            this.msg_loading_anns = 'Reading files ...';

            var promise_files = fs_get_file_texts_by_items(
                items,
                function(fn) {
                    if (app_hotpot.is_file_ext_txt(fn)) {
                        return true;
                    }
                    if (app_hotpot.is_file_ext_xml(fn)) {
                        return true;
                    }
                    return false;
                }
            );
            promise_files.then(function(files) {
                app_hotpot.vpp.add_files_to_anns(files);
            });
        },

        add_files_to_anns: function(files) {
            // now we know how many files are droped
            this.n_anns_droped = files.length;

            // let's parse all files
            var anns = [];
            this.msg_loading_anns = 'Parsing files ...'
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                var ann = app_hotpot.parse_file2ann(
                    file,
                    this.dtd
                );
                
                // it is possible that something wrong
                if (ann == null) {
                    this.n_anns_error += 1;
                }

                // ok, let's save this ann
                anns[anns.length] = ann;
                this.n_anns_loaded += 1;
            }

            // update the status
            this.msg_loading_anns = 'Updating file list ...'

            // last step! add to
            this.add_anns(anns);
            this.msg_loading_anns = 'Loaded all annotation files!'

            this.is_loaded_anns = true;
            console.log('* has added ' + anns.length + ' annotation files');

            if (anns.length > this.pg_numpp) {
                setTimeout(
                    'app_hotpot.vpp.reset_loading_anns_status()', 
                    app_hotpot.seconds_before_closing_loading_anns_panel * 1000
                );
            } else {
                this.reset_loading_anns_status();
            }
        },

        add_ann: function(ann) {
            // this.anns.push(ann);
            this.anns[this.anns.length] = ann;
            // update the hint_dict by this ann
            ann_parser.add_ann_to_hint_dict(
                ann,
                this.hint_dict
            );
        },

        add_ann_by_push: function(ann) {
            this.anns.push(ann);
            // update the hint_dict by this ann
            ann_parser.add_ann_to_hint_dict(
                ann,
                this.hint_dict
            );
        },

        add_anns: function(anns) {
            /**
             * 2022-07-13: performance issue when large dataset
             * 
             * When there are just a few files (<500),
             * .push() can handle smoothly and the file count
             * can be updataed instantly without intervention.
             * But when the number of files increase,
             * the loading will take extremely long time.
             * 
             * After debugging, there are mainly three reasons:
             * 
             * 1. `anns.push(ann)` takes very long time.
             * it seems the .push() method runs much slower while size increases.
             * the only way I know is to change to `anns[anns.length] = ann`
             * 
             * 2. `$forceUpdate()` or automatic refresh.
             * When the data in Vue app is changed, 
             * the binded UI will also be redrawn.
             * But as the number of files increase, 
             * the relevent calculation needs more time, 
             * and most of the calcuation is redundant.
             * 
             * 3. `update_hint_dict_by_anns()` batch update.
             * To get the statistics on the anns,
             * this function is called whenever anns changes.
             * But in fact, it's not necessary at all (I think).
             * If the user doesn't want to use hint,
             * or only a few things are updated,
             * it's not necessary to update the whole dictionary from all anns.
             * 
             * To address these issues ...
             * 
             * Pagination!
             */
            for (let i = 0; i < anns.length; i++) {
                this.add_ann(anns[i]);
            }

            // ok, now update v_ann
            this.refresh_v_anns();
        },
        
        refresh_v_anns: function() {
            // just for trigger the vue's computed prop
            this.mn4anns = Math.random();
        },

        reset_loading_anns_status: function() {
            this.is_loading_anns = false;
            this.is_loaded_anns = false;
            this.msg_loading_anns = '';
            this.n_anns_droped = 0;
            this.n_anns_loaded = 0;
            this.n_anns_error = 0;
        },

        goto_anns_page: function(new_pg_index) {
            this.pg_index = new_pg_index;
        },

        reset_anns_page: function() {
            this.pg_index = 0;
        },

        save_xml_by_ann: function(ann) {
            var idx = this.find_included(
                ann._filename,
                this.anns
            );
            if (idx < 0) {
                // what????
                return
            } else {
                // ok, we find it
            }

            this.save_xml_by_idx(idx);
        },

        save_xml_by_idx: function(idx) {
            // switch to this ann first
            if (this.ann_idx != idx) {
                this.ann_idx = idx;
            }
            // $this.$forceUpdate();
            this.save_xml();
        },

        save_xml: function() {
            // before checking, need to ensure the FSA API
            if (this.has_FSA_API()) {
                // OK, go go go
            } else {
                // well ... it's ok ...
                app_hotpot.msg(
                    'The browser you are using does not support File System Access API. You can use "Download XML" function instead.', 
                    'warning'
                );
                return;
            }
            // before saving, need to check the _fh
            var p_ann = null;
            if (this.ann_idx == null) {
                app_hotpot.msg(
                    'Please open an annotation file for saving.',
                    'warning'
                );
                return;
            }
            if (!this.anns[this.ann_idx].hasOwnProperty('_fh') || 
                this.anns[this.ann_idx]._fh === null ||
                typeof(this.anns[this.ann_idx]._fh.createWritable)==='undefined') {
                // which means this ann's original file is not available
                // or it is a txt-converted ann
                // let's go to save as directly
                p_ann = fs_save_new_ann_file(
                    this.anns[this.ann_idx],
                    this.dtd
                );
                
            } else {
                // normal save
                var p_ann = fs_save_ann_file(
                    this.anns[this.ann_idx],
                    this.dtd
                );
            }
            p_ann.then(function(ann) {
                // usually it should be OK ...
                // but it may change ...
                // using the given ann to replace the current ann
                app_hotpot.vpp.set_current_ann(ann);
                app_hotpot.vpp.refresh_v_anns();
                app_hotpot.toast('Successfully saved ' + ann._filename);
            })
            .catch(function(error) {
                console.log(error);
                if (error.name == 'AbortError') {
                    app_hotpot.toast('Cancelled file saving.');
                    return;
                }
                if (error.name == 'NotAllowedError') {
                    // which means user or system cancelled this saving
                    app_hotpot.toast('Cancelled file saving.');
                    return;
                }
                app_hotpot.msg(
                    'Saving xml failed. Try to use "Save As" instead.', 
                    'bg-lightCrimson fg-white'
                );
                console.log('* error when save xml', error);
            });;
        },
        
        /////////////////////////////////////////////////////////////////
        // "Label" related functions
        /////////////////////////////////////////////////////////////////
        has_any_label: function(ann) {
            if (ann.hasOwnProperty('meta') &&
                ann.meta.hasOwnProperty('label') &&
                ann.meta.label.length > 0) {
                return true;
            }

            return false;
        },

        set_label: function(color, ann) {
            if (typeof(color)=='undefined') {
                color = 'green';
            }

            if (typeof(ann)=='undefined') {
                // just a reference
                ann = this.anns[this.ann_idx];
            }

            // if this is not label, the `label` may be available
            if (!this.has_any_label(ann)) {
                ann.meta['label'] = [];
            }

            // just set the label
            ann.meta['label'] = [{
                'color': color
            }];

            // mark this file is changed and needs to be saved
            ann._has_saved = false;
            this.set_ann_unsaved(ann);

            // update the UI
            this.$forceUpdate();
        },

        remove_labels: function(ann) {
            if (typeof(ann)=='undefined') {
                // just a reference
                ann = this.anns[this.ann_idx];
            }

            ann.meta['label'] = [];

            // mark this file is changed and needs to be saved
            ann._has_saved = false;
            this.set_ann_unsaved(ann);

            // update the UI
            this.$forceUpdate();
        },
        
        /////////////////////////////////////////////////////////////////
        // "Save as" related functions
        /////////////////////////////////////////////////////////////////
        save_as_xml: function() {
            // convert to xml
            var xmlDoc = ann_parser.ann2xml(
                this.anns[this.ann_idx],
                this.dtd
            );

            // convert to text
            var xmlStr = ann_parser.xml2str(xmlDoc, false);

            // get the current file name
            var fn = this.anns[this.ann_idx]._filename;

            // create a new name for suggestion
            var new_fn = 'copy_of_' + fn;

            // ask for new fh for this file
            var p_fh = fs_get_new_ann_file_handle(new_fn);

            // when new fh is ready, save it
            p_fh.then((function(xmlStr){
                return function(fh) {
                    // first, update the fh
                    
                    // save this xmlStr with the given fh
                    let p_done = fs_write_ann_file(
                        fh,
                        xmlStr
                    );

                    // show something when saved
                    p_done.then(function(fh) {
                        app_hotpot.toast('Successfully saved as ' + fh.name);
                    });
                }
            })(xmlStr))
            .catch(function(error) {
                console.log('* error when save as xml', error);
            });
        },

        download_schema_as_dtd: function() {
            // if (this.dtd.hasOwnProperty('text')) {
            //     // get the current file name
            //     var fn = this.dtd.name + '.dtd';

            //     // download this dtd text
            //     var blob = new Blob([this.dtd.text], {type: "text/txt;charset=utf-8"});
            //     saveAs(blob, fn);
            // } else {
            //     // what???
            //     return;
            // }
            
            // first, convert the base_dtd to text
            var text = dtd_parser.stringify_yaml(
                this.dtd
            );

            // then save it
            // get the current file name
            var fn = this.dtd.name + '.yaml';

            // download this dtd text
            var blob = new Blob(
                [text], 
                {type: "text/txt;charset=utf-8"}
            );
            saveAs(blob, fn);
        },
        
        download_copy_as_xml: function() {
            // convert to xml
            var xmlDoc = ann_parser.ann2xml(
                this.anns[this.ann_idx],
                this.dtd
            );

            // convert to text
            var xmlStr = ann_parser.xml2str(xmlDoc, false);

            // get the current file name
            var fn = this.anns[this.ann_idx]._filename;

            // download this csv
            var blob = new Blob([xmlStr], {type: "text/xml;charset=utf-8"});
            saveAs(blob, fn);
        },

        download_copy_as_bioc: function() {
            // create a new file name for this format
            var fn = 'BioC-' + this.anns[this.ann_idx]._filename;
            bioc_parser.download_dataset_bioc(
                [this.anns[this.ann_idx]],
                this.dtd,
                fn
            );
        },

        download_all_as_zip: function(skip_dtd) {
            if (typeof(skip_dtd) == 'undefined') {
                skip_dtd = true;
            }
            var fn = 'annotation-' + 
                this.dtd.name + 
                '-' +
                this.get_datetime_now() +
                '.zip';
            console.log('* download all as zip ' + fn);

            var file_list = nlp_toolkit.download_dataset_raw(
                this.anns,
                this.dtd,
                fn,
                skip_dtd
            );
            
            console.log('* downloaded zip file:', file_list);
            // update the UI?
        },

        /////////////////////////////////////////////////////////////////
        // Search related functions
        /////////////////////////////////////////////////////////////////

        show_search_bar: function() {
            app_hotpot.codemirror.execCommand('find');
        },

        clear_search_result: function() {
            app_hotpot.codemirror.execCommand('clearSearch');
        },

        clear_filter_box: function() {
            this.fn_pattern = '';
        },

        /////////////////////////////////////////////////////////////////
        // Help related functions
        /////////////////////////////////////////////////////////////////

        show_wiki: function() {
            // app_hotpot.start_tour_annotation();
            window.open(
                'https://github.com/OHNLP/MedTator/wiki',
                '_blank'
            );
        },

        show_best_practice: function() {
            window.open(
                'https://github.com/OHNLP/MedTator/wiki/Annotation-Best-Practices',
                '_blank'
            );
        },

        report_an_issue: function() {
            window.open(
                'https://github.com/OHNLP/MedTator/issues',
                '_blank'
            );
        },

        show_changelog: function() {
            var html = [];
            // parse the latest change log
            var lines = jarvis.changelog_latest.split('\n');
            for (let i = 0; i < lines.length; i++) {
                var line = lines[i];
                line = line.trim();
                if (line == '') {
                    // nothing to do with empty line
                    continue;
                }
                if (html.length == 0) {
                    // this is the first line, the title
                    html.push(
                        '<h3 class="changelog-h3">' + 
                        '<b>MedTator</b> v' + 
                        line + 
                        '</h3>'
                    );
                } else {
                    html.push(
                        '<p class="changelog-p">'+line+'</p>'
                    );
                }
            }
            // last line is the link
            html.push(
                '<p>For more details, check <a target="_blank" href="https://github.com/OHNLP/MedTator#change-log">the README on our GitHub repo</a>.</p>'
            );
            html = html.join('');
            Metro.infobox.create(html);
        },

        show_howtouse: function() {
            window.open(
                'https://github.com/OHNLP/MedTator/wiki/Manual#how-to-use-the-exported-data',
                '_blank'
            );
        },

        show_sample_schema_files: function() {
            window.open(
                'https://github.com/OHNLP/MedTator/tree/main/sample',
                '_blank'
            );
        },

        load_sample_ds: function(ds_name) {
            if (typeof(ds_name) == 'undefined') {
                ds_name = 'MINIMAL_TASK';
            }
            // for local version, load JSON data through binding
            if (jarvis.hasOwnProperty('sample_dict')) {
                var sample_data = jarvis.sample_dict[ds_name];

                // copy the sample to overwrite app_hotpot
                Object.assign(app_hotpot.vpp.$data, sample_data);
                app_hotpot.set_dtd(
                    app_hotpot.vpp.$data.dtd
                );
                app_hotpot.vpp.set_ann_idx(0);

                return;
            }

            // for web version, load JSON data through AJAX
            // $.get(
            //     './static/data/vpp_data_'+ds_name+'.json', 
            //     {
            //         rnd: Math.random()
            //     }, 
            //     function(data) {
            //         Object.assign(app_hotpot.vpp.$data, data);
            //         app_hotpot.set_dtd(
            //             app_hotpot.vpp.$data.dtd
            //         );
            //         app_hotpot.vpp.set_ann_idx(0);
            //     }, 
            //     'json'
            // );

            $.ajax({
                url: './static/data/vpp_data_'+ds_name+'.json', 
                dataType: 'json',
                success: function(data) {
                    Object.assign(app_hotpot.vpp.$data, data);
                    app_hotpot.set_dtd(
                        app_hotpot.vpp.$data.dtd
                    );
                    app_hotpot.vpp.set_ann_idx(0);
                }, 
                error: function (xhr, status, error) {
                    // console.error(error);

                    app_hotpot.toast(
                        'Something wrong when loading the sample dataset, check the data availability and try later?',
                        'alert'
                    );
                }
            });
        },

        load_sample_ds_remote: function(ds_name) {
            if (typeof(ds_name) == 'undefined') {
                ds_name = 'MINIMAL_TASK';
            }
            // always try to load github repo
            $.ajax({
                // https://ohnlp.github.io/MedTator/static/data/vpp_data_MINIMAL_TASK.json?rnd=0.26234995297601804
                // url: './static/data/vpp_data_'+ds_name+'.json', 
                url: 'https://ohnlp.github.io/MedTator/static/data/vpp_data_'+ds_name+'.json', 
                dataType: "json",
                success: function(data, status, xhr) {
                    // parse the data and load it
                    Object.assign(app_hotpot.vpp.$data, data);
                    app_hotpot.set_dtd(
                        app_hotpot.vpp.$data.dtd
                    );
                    app_hotpot.vpp.set_ann_idx(0);

                    // toast?
                    app_hotpot.toast(
                        'Loaded Sample Dataset',
                        'info'
                    );
                },
                error: function (xhr, status, error) {
                    console.error(error);

                    app_hotpot.toast(
                        'Something wrong when loading the sample dataset, try later?',
                        'warning'
                    );
                }
            })
        },

        load_sample_txt: function() {
            if (this.dtd == null) {
                app_hotpot.toast(
                    'Please load annotation schema first',
                    'warning'
                );
                return;
            }
            var ann = this.add_sample_txt_as_ann(
                jarvis.sample_text['covid_vax']
            );

            app_hotpot.toast(
                'Loaded a sample text [' + 
                ann._filename +
                '] for test'
            );
        },

        load_sample_txt_from_input: function() {
            if (this.dtd == null) {
                app_hotpot.toast(
                    'Please load annotation schema first',
                    'warning'
                );
                return;
            }
            var txt = window.prompt(
                'Please input text in the following input box.'
            );
        
            if (txt == null) {
                app_hotpot.toast(
                    'Cancelled creating sample text.'
                );
                return;
            }
            
            // just in case empty
            txt = txt.trim();
            if (txt.length == 0) {
                app_hotpot.toast(
                    'Failed to create a sample text from empty input.'
                );
                return;
            }

            var ann = this.add_sample_txt_as_ann(
                txt
            );

            app_hotpot.toast(
                'Loaded a sample text [' + 
                ann._filename +
                '] for test'
            );
        },

        add_sample_txt_as_ann: function(text) {

            // first, create an ann
            var ann = ann_parser.txt2ann(text, this.dtd);

            // bind the filename seperately
            ann._filename = 'sample-'+
                (Math.random() + 1).toString(36).substring(7)+
                '.xml';

            // add this ann
            this.add_ann_by_push(ann);
            
            return ann;
        },
        

        /////////////////////////////////////////////////////////////////
        // Concept List related functions
        /////////////////////////////////////////////////////////////////
        
        update_tag_table: function(tag) {
            // update the display tag
            if (typeof(tag) == 'undefined') {
                // set to all 
                this.display_tag_name = '__all__';

            } else {
                // set to specific tag
                this.display_tag_name = tag.name;
            }

            // need to re-render the code-mirror accordingly
            if (this.is_render_tags_of_all_concepts()) {
                // no need to update marks if render all by default
            } else {
                app_hotpot.cm_update_marks();
            }
        },

        /////////////////////////////////////////////////////////////////
        // File list related functions
        /////////////////////////////////////////////////////////////////

        sort_filelist_by: function(sort_by) {
            this.sort_anns_by = sort_by;
        },

        get_sort_by: function() {
            if (this.hasOwnProperty('sort_anns_by')) {
                return this.sort_anns_by;
            } else {
                return 'default';
            }
        },

        get_sort_by_label: function(sort_by) {
            return {
                'default': 'Sort',
                'label': 'Gr-NA',
                'label_r': 'NA-Gr',
                'alphabet': 'A-Z',
                'alphabet_r': 'Z-A',
                'tags': '0-N',
                'tags_r': 'N-0'
            }[sort_by];
        },

        get_sorted_v_anns: function() {
            var sort_by = this.get_sort_by();
            var current_ann_idx = this.ann_idx;

            const start = performance.now();

            // a virtual list of ann, just contain the file name
            // this is prepared for sorting only
            // because the sort is an in-place sort
            // we can't modify the order in the original anns
            var v_anns = [];
            for (let i = 0; i < this.anns.length; i++) {
                var ann = this.anns.at(i);

                // add filter logic here
                if (!this.is_match_filename(ann._filename)) {
                    continue;
                }

                // add style logic here
                var css_class = '';
                if (i == current_ann_idx) {
                    css_class = 'file-selected';
                }

                var ann_label = 'zunisha';
                if (this.has_any_label(ann)) {
                    ann_label = ann.meta.label[0].color;
                }
                v_anns[v_anns.length] = {
                    // file name
                    _filename: ann._filename,

                    // number of annotated tags
                    n_tags: ann.tags.length,

                    // label color
                    label: ann_label,

                    // the true idx
                    idx: i,

                    // special style
                    css_class: css_class
                };
            }

            if (sort_by == 'default') {
                // OK, just default anns

            } else if (sort_by == 'alphabet') {
                v_anns.sort(function(a, b) {
                    return a._filename.localeCompare(
                        b._filename
                    )
                });

            } else if (sort_by == 'alphabet_r') {
                v_anns.sort(function(a, b) {
                    return -a._filename.localeCompare(
                        b._filename
                    )
                });
                
            } else if (sort_by == 'tags') {
                v_anns.sort(function(a, b) {
                    return a.n_tags - b.n_tags
                });

            } else if (sort_by == 'tags_r') {
                v_anns.sort(function(a, b) {
                    return b.n_tags - a.n_tags
                });
                
            } else if (sort_by == 'label') {
                // blue
                // green
                // red
                // yellow
                // zunisha
                v_anns.sort(function(a, b) {
                    return a.label.localeCompare(
                        b.label
                    )
                });

            } else if (sort_by == 'label_r') {
                v_anns.sort(function(a, b) {
                    return b.label.localeCompare(
                        a.label
                    )
                });

            } else {
                // ???
            }

            const duration = performance.now() - start;
            console.log('* sorted v_anns in ' +  duration);
            return v_anns;
        },

        set_current_ann: function(ann) {
            // replace the ann object
            this.anns[this.ann_idx] = ann;

            // reset the marks and others
            this.set_ann_idx(this.ann_idx);
        },

        set_ann_idx: function(idx) {
            console.log('* set ann_idx', idx);

            // update the ann_idx
            this.ann_idx = idx;

            if (idx == null) {
                // which means remove the content
                app_hotpot.cm_set_ann(null);

                // update the marks
                app_hotpot.cm_update_marks();

            } else {
                // update the text display
                app_hotpot.cm_set_ann(
                    this.anns[this.ann_idx]
                );

                // update the marks
                app_hotpot.cm_update_marks();
            }
        },

        set_ann_idx_by_ann: function(ann) {
            // find the idx
            var idx = this.find_included(
                ann._filename,
                this.anns
            );

            if (idx < 0) {
                // what?? how could it be?
                return;
            } else {
                // ok, we get it
            }

            // finally, just call the set_ann_idx
            this.set_ann_idx(idx);
        },

        show_ann_file: function(fn) {
            // first, find the ann_idx
            var idx = this.find_included(fn, this.anns);

            if (idx < 0) {
                // no such file
                app_hotpot.toast('Not found ' + fn + ' file', 'bg-yellow');
                return;
            }

            // then switch to annotation to ensure the UI logic
            this.switch_mui('annotation');

            // then show the idx
            this.set_ann_idx(idx);

            // trick for cm late update
            this.cm.is_expire = true;
        },

        remove_ann_file_by_ann: function(ann) {
            var idx = this.find_included(
                ann._filename,
                this.anns
            );
            
            // delete this first
            this.anns.splice(idx, 1);

            // once the file is removed, update the hint_dict
            // app_hotpot.update_hint_dict_by_anns();

            if (idx == this.ann_idx) {
                this.set_ann_idx(null);
            }

            // need to move the current ann_idx location
            if (idx < this.ann_idx) {
                this.ann_idx -= 1;
            }
        },

        remove_all_ann_files: function(force_remove) {
            if (typeof(force_remove) == 'undefined') {
                force_remove = false;
            }
            if (force_remove) {
                // just remove
                this.set_ann_idx(null);
                this.anns = [];

            } else {
                // ask for user confirm
                var ret = window.confirm('Are you sure to remove all annotation files?');
                if (ret) {
                    this.set_ann_idx(null);
                    this.anns = [];
                }
            }
            // also remove the loading if any
            this.reset_loading_anns_status();
            // also reset page number
            this.reset_anns_page();
        },


        /////////////////////////////////////////////////////////////////
        // Tag list related functions
        /////////////////////////////////////////////////////////////////

        on_click_tag_table_row: function(tag) {
            if (!this.is_etag(tag)) {
                // no need to highlight other tag
                return;
            }

            if (this.is_etag_doc_level(tag)) {
                // no need to highlight doc-level tag
                return;
            }

            // in the editor
            // 1. jump to this tag for display
            app_hotpot.cm_jump2tag(
                tag, 
                this.anns[this.ann_idx]
            );
            // 2. highlight the tag in editor
            app_hotpot.cm_highlight_editor_tag(tag.id);

            // 3. in the tag table, highlight the row
            app_hotpot.highlight_tag_table_row(tag.id);
        },

        on_change_attr_value: function(event) {
            // just mark current ann as unsaved
            // this.anns[this.ann_idx]._has_saved = false;
            this.set_current_ann_unsaved();
            console.log('* changed attr in', event.target);
        },

        on_change_idref_value: function(event) {
            // this.anns[this.ann_idx]._has_saved = false;
            // need to notify v_ann update
            this.set_current_ann_unsaved();
            // then, need to update this value
            this.on_change_link_settings(event);
        },

        on_input_attr_value: function(event) {
            // just mark current ann as unsaved
            // this.anns[this.ann_idx]._has_saved = false;
            this.set_current_ann_unsaved();
            console.log('* changed input attr to', event.target.value);
        },

        on_change_display_mode: function(event) {
            // console.log();
            // need to set ann again,
            // it will display according to the mode
            app_hotpot.cm_set_ann(
                this.anns[this.ann_idx]
            );
            app_hotpot.cm_update_marks();
            console.log('* changed display mode to ' + event.target.value);
        },

        on_change_mark_mode: function(event) {
            console.log(event.target.value);
            app_hotpot.cm_update_marks();
        },

        // on_change_hint_mode: function(event) {
        //     console.log(event.target.value);
        //     app_hotpot.cm_update_marks();
        // },
        on_change_hint_mode: function(hint_mode) {
            this.cm.hint_mode = hint_mode;
            app_hotpot.cm_update_marks();
        },

        on_change_link_settings: function(event) {
            console.log(event.target.value);
            // app_hotpot.cm_clear_rtag_marks();

            // have to update all marks ...
            app_hotpot.cm_update_marks();
        },

        accept_all_hints: function() {
            if (this.hints.length == 0) {
                app_hotpot.msg('No hints found');
                return;
            }

            var msg = [
                "There are " + this.hints.length + " hints found and not decided yet in current annotation:\n\n"
            ];
            for (let i = 0; i < this.hints.length; i++) {
                msg.push((i+1) + ' | ' + this.hints[i].tag + ', ' + this.hints[i].spans + ' [' + this.hints[i].text + ']\n');
            }
            msg.push('\nAre you sure to accept all of them?');

            msg = msg.join('');

            var ret = window.confirm(msg);

            if (ret) {
                // check all hints
                for (let i = 0; i < this.hints.length; i++) {
                    const hint_id = this.hints[i].id;
                    this.add_tag_by_hint(hint_id, false);
                }
                // update the cm
                app_hotpot.cm_update_marks();
                // scroll the view
                app_hotpot.scroll_annlist_to_bottom();

            } else {
                return;
            }
        },

        get_hint: function(hint_id) {
            for (let i = 0; i < this.hints.length; i++) {
                if (this.hints[i].id == hint_id) {
                    return this.hints[i];
                }
            }
            return null;
        },

        add_tag_by_hint: function(hint_id, update_marks) {
            if (typeof(update_marks)=='undefined') {
                update_marks = true;
            }
            // get the hint from list 
            var hint = this.get_hint(hint_id);
            if (hint == null) { 
                // fix the missing
                app_hotpot.cm_update_marks();
                return; 
            }
            var tag_name = hint.tag;

            // createa new ann tag
            var _tag = {
                'spans': hint.spans,
                'text': hint.text
            }
            var tag_def = this.dtd.tag_dict[tag_name];
            
            // create a new tag
            var tag = app_hotpot.make_etag(
                _tag, 
                tag_def, 
                this.anns[this.ann_idx]
            );

            // add this tag to ann
            this.anns[this.ann_idx].tags.push(tag);

            // mark _has_saved
            // this.anns[this.ann_idx]._has_saved = false;
            this.set_current_ann_unsaved();
            console.log('* added tag by hint, ' + tag_name + ' on ' + hint.text);

            // update the hint_dict
            app_hotpot.update_hint_dict_by_tag(
                this.anns[this.ann_idx],
                tag
            );

            if (update_marks) {
                // update the cm
                app_hotpot.cm_update_marks();
                // scroll the view
                app_hotpot.scroll_annlist_to_bottom();
            }
        },

        add_nc_etag_by_ctxmenu: function(tag_def) {
            this.add_nc_etag(tag_def);

            // for ctxmenu, we need to remove the ctx after click
            app_hotpot.ctxmenu_nce.hide();

            // scroll the view
            app_hotpot.scroll_annlist_to_bottom();

            console.log('* added nc etag by right click, ' + tag_def.name);
        },

        add_etag_by_ctxmenu: function(tag_def) {
            // get the basic tag
            var _tag = app_hotpot.cm_make_basic_etag_from_selection();

            // then call the general add_etag process
            this.add_etag(_tag, tag_def);

            // clear the selection to avoid stick keys
            app_hotpot.cm_clear_selection();

            // for ctxmenu, we need to remove the ctx after click
            app_hotpot.ctxmenu_sel.hide();

            // scroll the view
            app_hotpot.scroll_annlist_to_bottom();

            console.log('* added etag by right click, ' + tag_def.name);
        },

        add_etag_by_shortcut_key: function(key) {
            // first, get selection
            var selection = app_hotpot.cm_get_selection();
            if (selection.sel_txts == '') {
                // nothing selected for tag, skip
                return;
            }

            // then get the tag_def by the given key
            var tag_def = null;
            for (let i = 0; i < this.dtd.etags.length; i++) {
                if (this.dtd.etags[i].shortcut == key) {
                    // found!
                    tag_def = this.dtd.etags[i];
                    break
                }
            }
            if (tag_def == null) {
                // oh, this shortcut is not registered
                return;
            }

            // get a basic tag
            var _tag = app_hotpot.cm_make_basic_etag_from_selection();

            // then call the general add_etag process
            this.add_etag(_tag, tag_def);

            // clear the selection to avoid stick keys
            app_hotpot.cm_clear_selection();

            console.log('* added tag by shortcut, ' + tag_def.name + ' on ' + _tag.text);
        },

        /////////////////////////////////////////////////////////////////
        // Ann and tag related functions
        /////////////////////////////////////////////////////////////////

        set_ann_unsaved: function(ann) {
            // set status
            ann._has_saved = false;
            // notify the virutal anns to be refreshed
            this.refresh_v_anns();

            // it's still under test
            if (this.is_auto_save()) {
                // wow, auto save is enabled?
                this.save_xml();
            }
        },

        set_current_ann_unsaved: function() {
            this.set_ann_unsaved(
                this.anns[this.ann_idx]
            );
        },

        add_etag: function(basic_tag, tag_def) {
            // create a new tag
            var tag = app_hotpot.make_etag(
                basic_tag, 
                tag_def, 
                this.anns[this.ann_idx]
            );

            // add this tag to ann
            this.anns[this.ann_idx].tags.push(tag);

            // mark _has_saved
            // this.anns[this.ann_idx]._has_saved = false;
            this.set_ann_unsaved(
                this.anns[this.ann_idx]
            );

            // add this new tag to hint_dict
            app_hotpot.update_hint_dict_by_tag(this.anns[this.ann_idx], tag);

            // update the cm
            app_hotpot.cm_update_marks();
        },

        add_nc_etag: function(etag_def) {
            var etag = app_hotpot.make_empty_etag_by_tag_def(etag_def);

            // set to nc 
            etag.spans = dtd_parser.NON_CONSUMING_SPANS;

            // create an tag_id
            var tag_id = ann_parser.get_next_tag_id(
                this.anns[this.ann_idx],
                etag_def
            );
            etag.id = tag_id;
            
            // add to list
            this.anns[this.ann_idx].tags.push(etag);

            // mark _has_saved
            // this.anns[this.ann_idx]._has_saved = false;
            this.set_ann_unsaved(
                this.anns[this.ann_idx]
            );

            // ok, that's all?
            app_hotpot.toast('Added a new document-leve tag [' + etag.id + ']');
        },

        add_empty_etag: function(etag_def) {
            var etag = app_hotpot.make_empty_etag_by_tag_def(etag_def);
            // create an tag_id
            var tag_id = ann_parser.get_next_tag_id(
                this.anns[this.ann_idx],
                etag_def
            );
            etag.id = tag_id;
            
            // add to list
            this.anns[this.ann_idx].tags.push(etag);

            // mark _has_saved
            // this.anns[this.ann_idx]._has_saved = false;
            this.set_ann_unsaved(
                this.anns[this.ann_idx]
            );
            // ok, that's all?
            app_hotpot.toast('Added a new entity tag [' + etag.id + ']');
        },

        add_empty_rtag: function(rtag_def) {
            var rtag = app_hotpot.make_empty_rtag_by_tag_def(rtag_def);

            // create an tag_id
            var tag_id = ann_parser.get_next_tag_id(
                this.anns[this.ann_idx],
                rtag_def
            );
            rtag.id = tag_id;

            // add to list
            this.anns[this.ann_idx].tags.push(rtag);

            // mark _has_saved
            // this.anns[this.ann_idx]._has_saved = false;
            this.set_ann_unsaved(
                this.anns[this.ann_idx]
            );

            // ok, that's all?
            app_hotpot.toast('Added a new relation tag [' + rtag.id + ']');
        },

        delete_tag: function(tag_id) {
            // delete the clicked tag id
            app_hotpot.delete_tag(
                tag_id, 
                this.anns[this.ann_idx]
            );
        },

        set_tag_annotator: function(tag_id, annotator, ann) {
            if (typeof(ann) == 'undefined') {
                // just use the current ann
                ann = this.anns[this.ann_idx];
            }
            var tag_idx = -1;
            for (let i = 0; i < ann.tags.length; i++) {
                if (ann.tags[i].id == tag_id) {
                    ann.tags[i]._annotator = annotator;
                    break;
                }            
            }

            // what to do?
            if (tag_idx == -1) {
                // ???
            } else {
                // ???
            }

            // mark this file is changed and needs to be saved
            // ann._has_saved = false;
            this.set_ann_unsaved(
                ann
            );

            console.log('* set annotator to tag: ', 
                tag_id + '._annotator = ' + annotator);

            return ann;
        },

        /////////////////////////////////////////////////////////////////
        // Statistics related functions
        /////////////////////////////////////////////////////////////////
        // see app_hotpot_ext_statistics.js
        

        /////////////////////////////////////////////////////////////////
        // IAA Related
        /////////////////////////////////////////////////////////////////
        // see app_hotpot_ext_iaa.js


        /////////////////////////////////////////////////////////////////
        // Exporter Related
        /////////////////////////////////////////////////////////////////
        // see app_hotpot_ext_exporter.js


        /////////////////////////////////////////////////////////////////
        // Context Menu Related
        /////////////////////////////////////////////////////////////////
        get_nc_etags: function() {
            var nc_etags = [];
            // no dtd yet?
            if (this.dtd == null) { return []; }
            // no file selected yet?
            if (this.ann_idx == null) { return []; }
            for (let i = 0; i < this.dtd.etags.length; i++) {
                const etag = this.dtd.etags[i];
                if (etag.is_non_consuming) {
                    nc_etags.push(etag);
                }
            }
            return nc_etags;
        },

        close_ctxmenu: function() {
            app_hotpot.ctxmenu_sel.hide();
            app_hotpot.ctxmenu_nce.hide();
        },

        close_popmenu: function() {
            app_hotpot.popmenu_tag.hide();
        },

        on_click_editor_tag: function(event, tag_id) {
            // console.log('* clicked on editor etag', tag_id);

            // set the clicked tag_id
            this.clicked_tag_id = tag_id;

            // get the position of user pointer
            // var mouseX = event.clientX;
            // var mouseY = event.clientY;

            // get the position of the tag it self
            var elm = $(event.target);
            var x = elm.offset().left;
            var y = elm.offset().top;

            // then show the popmenu
            app_hotpot.show_tag_popmenu_at(x, y);

            // then show the item in the list
            app_hotpot.scroll_tag_table_to(tag_id);

            // then highlight this item in table
            app_hotpot.highlight_tag_table_row(tag_id);

            // then highlight this item in editor
            app_hotpot.cm_highlight_editor_tag(tag_id);
        },

        on_enter_tag: function(event) {
            // console.log('* enter etag', event.target);
            var elm = $(event.target);
            var tag_id = elm.attr('tag_id');
            this.hovered_tag = this.get_tag_by_tag_id(
                tag_id,
                this.anns[this.ann_idx]
            );

            // set location
            $('#hoverbox_etag').css('top', elm.offset().top + 20);
            $('#hoverbox_etag').css('left', elm.offset().left);
        },

        on_leave_tag: function(event) {
            // console.log('* leave etag', event.target);
            this.hovered_tag = null;
        },

        popmenu_del_tag: function() {
            // delete the clicked tag id
            app_hotpot.delete_tag(
                this.clicked_tag_id, 
                this.anns[this.ann_idx]
            );

            // hide the menu 
            app_hotpot.popmenu_tag.hide();

            // reset the clicked tag id
            this.clicked_tag_id = null;
        },

        popmenu_start_linking: function(rtag_def) {
            // first, set the working mode
            this.is_linking = true;

            // set the linking tag_def
            this.linking_tag_def = rtag_def;

            // create a rtag
            this.linking_tag = app_hotpot.make_empty_rtag_by_tag_def(rtag_def);

            // then get the linking atts for this rtag
            // this list contains all atts for this rtag
            // and during the linking, we will remove those linked att out
            this.linking_atts = this.get_idref_attrs(rtag_def);

            // let's set the first idref attr
            // pop the first att from atts
            var att = this.linking_atts[0];
            this.linking_atts.splice(0, 1)
            this.linking_tag[att.name] = this.clicked_tag_id;
            
            // maybe we could show a float panel
            // for showing the current annotation
            console.log('* start linking', rtag_def.name, 
                'on attr [', att.name,
                '] =', this.clicked_tag_id
            );
        },

        popmenu_set_linking: function(att_idx) {
            // pop the target idx att from atts
            var att = this.linking_atts[att_idx];
            this.linking_atts.splice(att_idx, 1);

            // set current tag to this att
            this.linking_tag[att.name] = this.clicked_tag_id;
            
            console.log('* set linking', this.linking_tag_def.name, 
                'on attr [', att.name,
                '] =', this.clicked_tag_id
            );

            // final check the left?
            if (this.linking_atts.length == 0) {
                // which means we have tagged all idrefs
                // we could append this linking tag to ann
                var tag_id = ann_parser.get_next_tag_id(
                    this.anns[this.ann_idx],
                    this.linking_tag_def
                );
                this.linking_tag.id = tag_id;
                this.anns[this.ann_idx].tags.push(this.linking_tag);

                // mark _has_saved
                // this.anns[this.ann_idx]._has_saved = false;
                this.set_ann_unsaved(
                    this.anns[this.ann_idx]
                );

                // then, we could show this new link in cm
                app_hotpot.cm_draw_rtag(
                    this.linking_tag,
                    this.linking_tag_def,
                    this.anns[this.ann_idx]
                );

                // we could reset linking status
                this.cancel_linking();

            } else {
                // not finished yet?
                // keep working on it
            }
        },

        done_linking: function() {
            // no matter what decision, just done this linking,
            // we could append this linking tag to ann
            var tag_id = ann_parser.get_next_tag_id(
                this.anns[this.ann_idx],
                this.linking_tag_def
            );
            this.linking_tag.id = tag_id;
            this.anns[this.ann_idx].tags.push(this.linking_tag);

            // mark unsaved
            // this.anns[this.ann_idx]._has_saved = false;
            this.set_ann_unsaved(
                this.anns[this.ann_idx]
            );

            // then, we could show this new link in cm
            app_hotpot.cm_draw_rtag(
                this.linking_tag,
                this.linking_tag_def,
                this.anns[this.ann_idx]
            );

            // we could reset linking status
            this.cancel_linking();
        },

        cancel_linking: function() {
            // so, user doesn't want to continue current linking
            this.is_linking = false;
            this.linking_tag_def = null;
            this.linking_tag = null;
            this.linking_atts = [];
        },

        dragMouseDown: function(event) {
            console.log('* drag start', event);
            event.preventDefault()
            // get the mouse cursor position at startup:
            this.pan_working_tag.pos.clientX = event.clientX
            this.pan_working_tag.pos.clientY = event.clientY
            document.onmousemove = this.elementDrag
            document.onmouseup = this.closeDragElement
        },
        elementDrag: function (event) {
            event.preventDefault()
            this.pan_working_tag.pos.movementX = this.pan_working_tag.pos.clientX - event.clientX
            this.pan_working_tag.pos.movementY = this.pan_working_tag.pos.clientY - event.clientY
            this.pan_working_tag.pos.clientX = event.clientX
            this.pan_working_tag.pos.clientY = event.clientY
            // set the element's new position:
            this.$refs.pan_working_tag_box.style.top = (this.$refs.pan_working_tag_box.offsetTop - this.pan_working_tag.pos.movementY) + 'px'
            this.$refs.pan_working_tag_box.style.left = (this.$refs.pan_working_tag_box.offsetLeft - this.pan_working_tag.pos.movementX) + 'px'
        },
        closeDragElement () {
            document.onmouseup = null
            document.onmousemove = null
        },

        /////////////////////////////////////////////////////////////////
        // Other utils
        /////////////////////////////////////////////////////////////////

        switch_mui: function(section) {
            console.log('* switch to section', section);
            this.section = section;

            if (section == 'annotation') {
                // refresh the code mirror
                this.set_ann_idx(this.ann_idx);

                // trick for cm late update
                this.cm.is_expire = true;

                // bind drop zone for dtd
                // app_hotpot.bind_dropzone_dtd();

                // bind drop zone for annotation xml/txt files
                // app_hotpot.bind_dropzone_ann();

            } else if (section == 'iaa') {

                // bind drop zone for anns
                // app_hotpot.bind_dropzone_iaa();

            } else if (section == 'corpus') {
                // need something?

            }

            // no matter what tab, resize the UI
            app_hotpot.resize();

            // maybe need to close the tqv
            this.hide_tqv();
        },

        make_html_bold_tag_name: function(tag) {
            var html = '<span class="tag-list-row-name-id-prefix">' + tag.id_prefix + '</span>';
            var name = tag.name;
            name = name.replace(tag.id_prefix, '');
            html = html += name;
            return html;
        },

        get_smaller_value: function(a, b) {
            return Math.min(a, b);
        },

        get_bigger_value: function(a, b) {
            return Math.max(a, b);
        },

        count_n_tags: function(tag) {
            if (this.ann_idx == null) {
                return '';
            }
            var cnt = 0;
            if (tag == null) {
                return this.anns[this.ann_idx].tags.length;
            }
            for (let i = 0; i < this.anns[this.ann_idx].tags.length; i++) {
                if (this.anns[this.ann_idx].tags[i].tag == tag.name) {
                    cnt += 1;
                }
            }
            return cnt;
        },

        is_current_ann: function(ann) {
            if (this.ann_idx == null) {
                // which means there is no ann displayed now
                return false;
            }
            if (ann._filename == this.anns[this.ann_idx]._filename) {
                return true;
            } else {
                return false;
            }
        },

        is_match_filename: function(fn) {
            if (this.fn_pattern == '') {
                return true;
            }
            if (fn.lastIndexOf(this.fn_pattern) >= 0) {
                return true;
            } else {
                return false;
            }
        },

        find_included: function(fn, anns) {
            for (let i = 0; i < anns.length; i++) {
                if (anns[i]._filename == fn) {
                    return i;
                }
            }

            return -1;
        },

        has_included: function(fn, anns) {
            // return false;
            for (let i = 0; i < anns.length; i++) {
                if (anns[i]._filename == fn) {
                    return true;
                }
            }

            return false;
        },

        has_included_ann_file: function(fn) {
            return this.has_included(fn, this.anns);
        },

        get_new_ann_fn_by_txt_fn: function(txt_fn) {
            // var new_fn = txt_fn + '.xml';
            // var i = 1;
            // while (true) {
            //     if (this.has_included_ann_file(new_fn)) {
            //         new_fn = txt_fn + '_' + i + '.xml';
            //         i += 1;
            //     } else {
            //         break;
            //     }
            // }
            // return new_fn;
            return app_hotpot.get_new_ann_fn_by_txt_fn(txt_fn);
        },

        has_included_txt_ann_file: function(fn) {
            return this.has_included(fn, this.txt_anns);
        },

        has_unsaved_ann_file: function() {
            for (let i = 0; i < this.anns.length; i++) {
                const ann = this.anns[i];
                if (ann._has_saved) {

                } else {
                    return true;
                }
            }
            return false;
        },

        get_tag_spans_text: function(tag) {
            if (tag.spans == '-1~-1') {
                return 'DOCLEVEL';
            } else {
                return tag.spans;
            }
        },

        get_tags_by_tag_name: function(ann, tag_name) {
            var tags = [];
            for (let i = 0; i < ann.tags.length; i++) {
                const tag = ann.tags[i];
                if (tag.tag == tag_name) {
                    tags.push(tag);
                }
            }
            return tags;
        },

        get_tags_by_type: function(ann, dtd) {
            if (typeof(type) == 'undefined') {
                type = 'etag';
            }
            var tags = [];
            for (let i = 0; i < ann.tags.length; i++) {
                const tag = ann.tags[i];
                if (dtd.tag_dict[tag.tag].type==type) {
                    tags.push(tag);
                }
            }
            return tags;
        },

        get_tag_desc_html: function(tag) {
            var html = [];

            for (const attr in tag) {
                if (Object.hasOwnProperty.call(tag, attr)) {
                    const val = tag[attr];
                    if (['id', 'tag', 'spans', 'text', '_annotator'].indexOf(attr)>=0) {
                        continue;
                    }

                    html.push(
                        "<span class='tag-desc-item'>" +
                        "<span class='tag-desc-attr'>" + attr + ": </span>" +
                        "<span class='tag-desc-value'>" + val + "</span>" +
                        "</span>"
                    );
                }
            }

            html = html.join('<br>');

            return html;
        },

        get_clicked_tag: function() {
            if (this.clicked_tag_id == null) {
                return null;
            }
            if (this.ann_idx == null) {
                return null;
            }
            return this.get_tag_by_tag_id(
                this.clicked_tag_id, 
                this.anns[this.ann_idx]
            )
        },

        get_tag_by_tag_id: function(tag_id, ann) {
            if (ann == null) {
                return null;
            }
            for (let i = 0; i < ann.tags.length; i++) {
                if (ann.tags[i].id == tag_id) {
                    return ann.tags[i];
                }                
            }
            return null;
        },

        get_tag_def: function(tag_name) {
            if (this.dtd.tag_dict.hasOwnProperty(tag_name)) {
                return this.dtd.tag_dict[tag_name];
            } else {
                return null;
            }
        },

        get_idref_attr_by_seq: function(rtag_def, seq=0) {
            var cnt = -1;
            for (let i = 0; i < rtag_def.attrs.length; i++) {
                if (rtag_def.attrs[i].vtype == 'idref') {
                    cnt += 1;
                    if (cnt == seq) {
                        // great! we get the attr we want
                        return rtag_def.attrs[i];
                    }
                }
            }
            return null;
        },

        get_idref_attrs: function(rtag_def) {
            var attrs = [];
            for (let i = 0; i < rtag_def.attrs.length; i++) {
                const att = rtag_def.attrs[i];
                if (att.vtype == 'idref') {
                    attrs.push(att);
                }
            }
            return attrs;
        },

        to_fixed: function(v) {
            if (typeof(v) == 'undefined' ||
                v == null || 
                isNaN(v)) {
                return 'NA';
            }
            return v.toFixed(2);
        },

        to_comma: function(v) {
            if (typeof(v) == 'undefined' ||
                v == null || 
                isNaN(v)) {
                return 'NA';
            }
            // format as number
            var _v = parseFloat("" + v);
            return _v.toLocaleString("en-US");
        },

        val2width: function(val, max_val, max_width) {
            if (typeof(val) == 'undefined' ||
                val == null ||
                isNaN(val)) {
                val = 0;
            }
            if (typeof(max_val) == 'undefined' ||
                max_val < 10) {
                max_val = 10;
            }
            if (typeof(max_width) == 'undefined') {
                // which means 100px
                max_width = 100;
            }

            // very simple conversion
            var width = val / max_val * max_width;

            return width;
        },

        per2width: function(v) {
            if (typeof(v) == 'undefined' ||
                v == null ||
                isNaN(v)) {
                return 1;
            }
            return v * 100;
        },

        has_doc_sum_selected_tags: function() {
            if (this.display_stat_doc_sum_selected == null) {
                return false;
            }
            if (this.has_included_ann_file(
                this.display_stat_doc_sum_selected.file_name
            )) {
                return true;
            }
            return false;
        },

        on_click_stat_ann_tag_box: function(event, file_name, tag_name) {
            // get the dom element
            var elm = $(event.target);

            // set the obj for this event
            this.display_stat_doc_sum_selected = {
                file_name: file_name,
                tag_name: tag_name
            };

            console.log('* display_stat_doc_sum_selected:', this.display_stat_doc_sum_selected);

            // show the box
            $('#stat_doc_tag_detailbox').css('top', elm.offset().top - 215);
            $('#stat_doc_tag_detailbox').css('left', elm.offset().left + 25);
        },

        on_close_stat_ann_tag_box: function() {
            this.display_stat_doc_sum_selected = null;
            // I'm not sure why, but there is a 26px bar left???
            // so just move it out of view
            $('#stat_doc_tag_detailbox').css('top', -1000);
        },

        has_FSA_API: function() {
            return isFSA_API_OK;
        },

        show_help: function(token) {
            if (typeof(token) == 'undefined') {
                // ?
                return;
            }

            // find this token
            if (app_hotpot.texts.hasOwnProperty(token)) {
                var html_content = '';

                // add the title
                html_content += 
                    "<h4>" + 
                    app_hotpot.texts[token].title + 
                    "</h4>";
                
                // add the content
                html_content += app_hotpot.texts[token].html;

                // show the html content
                Metro.infobox.create(html_content);

            } else {
                // ???
            }
        },

        is_display_tag_name: function(tag_name) {
            if (this.display_tag_name == '__all__') {
                return true;
            }

            if (this.display_tag_name == tag_name) {
                return true;
            }

            return false;
        },

        /**
         * Show UI for error analysis
         * 
         * The UI workflow could be changed by the setting
         * `cfg.new_ui_for_ea`.
         * 
         * @returns true/false
         */
        is_show_new_ui_for_ea: function() {
            return this.cfg.new_ui_for_ea == 'enable';
        },

        /**
         * Render all tags of all concepts or not
         * 
         * The UI workflow could be changed by the setting
         * `cfg.linking_marks_selection`.
         * 
         * @returns true/false
         */
        is_render_tags_of_all_concepts: function() {
            return this.cfg.linking_marks_selection == 'all_concepts';
        },

        /**
         * Check if a tag is related to a certain tag type
         * 
         * @param {object} tag a tag object
         * @param {list} tag_name tag names to be checked
         * @param {object} ann annotation
         */
        is_tag_related_to_tag_name: function(tag, tag_names, ann) {
            // find the 
            var related_tags = ann_parser.get_linked_rtags(
                tag.id,
                ann
            );

            // check each related tag, which is usually a link tag
            for (let i = 0; i < related_tags.length; i++) {
                const related_tag = related_tags[i];
                if (tag_names.indexOf(related_tag.tag)>=0) {
                    return true;
                }
            }

            return false;
        },

        is_etag_doc_level: function(tag) {
            if (tag.spans == '-1~-1') {
                return true;
            }
            return false;
        },
        
        is_etag: function(tag) {
            if (tag.hasOwnProperty('spans')) {
                return true;
            }
            return false;
        },

        stat_value2width: function(value, max_value) {
            return this.val2width(value, max_value);
        },

        stat_value2bgcolor: function(value, max_value, zero_color) {
            if (typeof(max_value)=='undefined') {
                max_value = 10;
            }
            if (typeof(zero_color)=='undefined') {
                zero_color = '#ffffff';
            }
            if (value == 0) {
                return zero_color;
            } else {
                return d3.rgb(
                    d3.interpolateReds(value / max_value)
                ).formatHex() + '';
            }
        },

        stat_value2ftcolor: function(value, max_value, zero_color) {
            if (typeof(max_value)=='undefined') {
                max_value = 10;
            }
            if (typeof(zero_color)=='undefined') {
                zero_color = '#eeeeee';
            }
            if (value == 0) {
                return zero_color;
            } else {
                if (value / max_value < 0.6) {
                    return '#000000';
                } else {
                    return '#ffffff';
                }
            }
        },

        get_date_now: function() {
            return dayjs().format('YYYY-MM-DD');
        },

        get_datetime_now: function() {
            return dayjs().format('YYYY-MM-DD_HH.mm.ss');
        },

        get_n_pages_by_total: function(total) {
            return Math.ceil(total / this.pg_numpp);
        },

        get_pages_by_total: function(total) {
            return [...Array(this.get_n_pages_by_total(total)).keys()];
        },
        
    },

    vpp_computed: {
        pages_of_anns_total: function() {
            return Math.ceil(this.anns.length / this.pg_numpp);
        },

        pages_of_anns: function() {
            return [...Array(Math.ceil(this.anns.length / this.pg_numpp)).keys()];
        },

        virtual_anns: function() {
            if (this.section == 'annotation' && 
                this.mn4anns>0) {
                if (this.anns.length > 0) {
                    var v_anns = this.get_sorted_v_anns();
                    var v_anns_paged = v_anns;
                    // get the page of current
                    if (Math.ceil(v_anns.length / this.pg_numpp) > 1) {
                        v_anns_paged = v_anns.slice(
                            this.pg_index * this.pg_numpp,
                            (this.pg_index + 1) * this.pg_numpp
                        );
                    }

                    return {
                        v_anns: v_anns,
                        v_anns_paged: v_anns_paged
                    };
                }   
            }
            // for all other cases
            return {
                v_anns: [],
                v_anns_paged: []
            };
        },

        stat_docs_by_tags: function() {
            if (this.section == 'statistics') {
                return stat_helper.get_stat_docs_by_tags_json(
                    this.anns,
                    this.dtd
                );
            } else {
                // don't update if not in stat section
                return stat_helper.get_stat_docs_by_tags_json(
                    [],
                    this.dtd
                );
            }
        },

        stat_summary: function() {
            if (this.section == 'statistics') {
                return stat_helper.get_stat_items(
                    this.anns,
                    this.dtd
                );
            } else {
                // don't update if not in stat section
                return [];
            }
        },

        stat_doc_sum_selected_tags: function() {
            if (this.section == 'statistics') {
                if (this.display_stat_doc_sum_selected == null) {
                    return null;
                }
                // find this ann
                var ann_idx = this.find_included(
                    this.display_stat_doc_sum_selected.file_name,
                    this.anns
                );

                // find the tags
                var tags = this.get_tags_by_tag_name(
                    this.anns[ann_idx],
                    this.display_stat_doc_sum_selected.tag_name
                );

                // last is just update tags
                return tags;
            } else {
                // don't update if not in stat section
                return [];
            }
        }
    },

    // code mirror instance
    codemirror: null,
    // marked texts in code mirror
    marktexts: [],
    // the selected text
    selection: null,

    // the context menu for selection
    ctxmenu_sel: null,

    // the context menu for nc etags
    ctxmenu_nce: null,

    // the popup menu for tag
    popmenu_tag: null,

    // interval update
    interval_force_update: null,
    // the seconds for interval
    interval_force_update_duration: 1,

    start_interval_force_update: function() {
        if (this.interval_force_update != null) {
            // which means it is already started
            return;
        }
        // start !
        app_hotpot.interval_force_update = setTimeout(
            "app_hotpot.exec_interval_force_update()", 
            app_hotpot.interval_force_update_duration * 1000
        );
        console.log('* started auto interval force update')
    },

    exec_interval_force_update: function() {
        if (app_hotpot.n_anns == app_hotpot.vpp.$data.anns.length) {
            if (app_hotpot.cnt_no_more_anns >= 3) {
                // ok, nothing to do now
                // let's stop the interval
                app_hotpot.cnt_no_more_anns = 0;
                app_hotpot.interval_force_update = null;
                console.log('* cleared auto interval force update');

            } else {
                // just double check later
                app_hotpot.cnt_no_more_anns += 1;
            }
        } else {
            // force update
            app_hotpot.n_anns = app_hotpot.vpp.$data.anns.length;
            app_hotpot.vpp.$forceUpdate();
            console.log('* force-updated app_hotpot vpp!');
        }

        if (app_hotpot.interval_force_update == null) {
            // that's great!
            // no need to check later
        } else {
            app_hotpot.interval_force_update = setTimeout(
                "app_hotpot.exec_interval_force_update()", 
                app_hotpot.interval_force_update_duration * 1000
            );
            console.log(
                '* scheduled interval force update in ' + 
                app_hotpot.interval_force_update_duration + ' second(s).'
            );
        }
    },

    init: function() {
        this.vpp = new Vue({
            el: this.vpp_id,
            data: this.vpp_data,
            methods: this.vpp_methods,

            mounted: function() {
                Metro.init();
            },

            computed: this.vpp_computed,

            updated: function() {
                this.$nextTick(function () {
                    // Code that will run only after the
                    // entire view has been re-rendered
                    if (this.section == 'annotation') {
                        if (this.cm.is_expire) {
                            this.set_ann_idx(this.ann_idx);
                            this.cm.is_expire = false;
                        }
                    }
                });
            }
        });

        // the code mirror
        this.cm_init();

        // the global event
        this.bind_events();

        // set the resize
        this.resize();

        // init brat
        fig_bratvis.init();
    },

    /**
     * Set the DTD for this annotation project
     * 
     * @param {Object} dtd An object of dtd
     */
    set_dtd: function(dtd) {
        console.log('* set dtd', dtd);
        this.vpp.$data.dtd = dtd;

        // update the color define
        this.update_tag_styles();

        // update the shortcuts
        this.update_tag_shortcuts();

        // update the context menu
        this.update_tag_ctxmenu();

        // update the context menu
        this.update_nce_ctxmenu();

        // update the pop menu
        this.update_tag_popmenu();

        // special rule for dtd meta
        if (dtd.hasOwnProperty('meta')) {
            console.log('* found meta in annotation schema', dtd.meta);
            this.set_meta_from_dtd(dtd);
        }

        // force update
        this.vpp.$forceUpdate();
    },

    set_meta_from_dtd: function(dtd) {
        if (dtd.meta.hasOwnProperty('sentencize_exceptions')) {
            // this is for the sentencizer
            this.set_meta_of_sentencize_exceptions(dtd.meta.sentencize_exceptions);
        }

        if (dtd.meta.hasOwnProperty('error_definition')) {
            // this is for the error analysis
            this.vpp.set_meta_of_error_definition(dtd.meta.error_definition);
        }
    },

    set_meta_of_sentencize_exceptions: function(sentencize_exceptions) {
        // this is for the nlp_toolkit
        for (let i = 0; i < sentencize_exceptions.length; i++) {
            var se = sentencize_exceptions[i];
            var se_lower = se.toLocaleLowerCase();

            // add to the nlp_toolkit sentencize_exceptions
            nlp_toolkit.sentencize_exceptions.add(se_lower);
        }
        this.toast('Updated NLP Toolkit sentencize_exceptions with ' + 
            sentencize_exceptions.length + ' tokens.',
            'info'
        );
    },

    clear_ann_all: function() {
        // clean all annotations and related data
        this.anns = [];
        this.ann_idx = null;
        this.hint_dict = {};
    },

    reset_vpp: function() {
        this.dtd = null;
        this.clear_ann_all();
        this.clear_iaa_all();
    },

    add_ann: function(ann, is_switch_to_this_ann) {
        // check the schema first
        // if (ann.dtd_name != this.vpp.$data.dtd.name) {
        //     console.log('* skip unmatched ann', ann);
        //     app_hotpot.msg('Skipped unmatched file ' + ann._filename, 'warning');
        //     return;
        // }

        // if (this.vpp.$data.anns.length < this.n_anns_small_project) {
        //     this.vpp.$data.anns.push(ann);
        // } else {
        //     this.vpp.$data.anns[
        //         this.vpp.$data.anns.length
        //     ] = ann;
        //     // this.start_interval_force_update();
        // }

        // update hint_dict when add new ann file
        // this.update_hint_dict_by_ann(ann);

        // if (is_switch_to_this_ann || this.vpp.$data.anns.length == 1) {
        //     this.vpp.$data.ann_idx = this.vpp.$data.anns.length - 1;

        //     // update the text display
        //     this.cm_set_ann(
        //         this.vpp.$data.anns[this.vpp.$data.ann_idx]
        //     );
    
        //     // update the marks
        //     this.cm_update_marks();
        // }

        // this.vpp.$forceUpdate();
        // console.log("* added ann", ann._filename);
    },

    /////////////////////////////////////////////////////////////////
    // Events related
    /////////////////////////////////////////////////////////////////

    bind_events: function() {
        // init bind for annotation

        // bind drop zone for dtd
        // this.bind_dropzone_dtd();

        // bind drop zone for annotation xml/txt files
        // this.bind_dropzone_ann();

        // bind global click event for annotation
        this.bind_click_event();

        // bind global key event for annotation
        this.bind_keypress_event();

        // bind a dragable for tqv
        this.bind_tqv_dragable();

        // global bind
        // bind the closing event
        this.bind_unload_event();
    },

    bind_click_event: function() {
        document.getElementById('app_hotpot').addEventListener(
            "click",
            function(event) {
                // console.log('* clicked on', event.target);

                var dom = event.target;
                var obj = $(dom);

                if (obj.hasClass('mark-tag') ||
                    obj.hasClass('mark-tag-text')) {
                    // which means clicks on a tag.
                    // so don't touch the popmenu
                } else {
                    // 
                    if (app_hotpot.popmenu_tag != null) {
                        app_hotpot.popmenu_tag.hide();
                    }
                }

                // show the menu
                // var mouseX = event.clientX;
                // var mouseY = event.clientY;

                // close the right click menu
                if (app_hotpot.ctxmenu_sel != null) {
                    app_hotpot.ctxmenu_sel.hide();
                }
                if (app_hotpot.ctxmenu_nce != null) {
                    app_hotpot.ctxmenu_nce.hide();
                }

                // if (obj.hasClass('mark-tag-text')) {
                //     // this is a mark in code mirror
                //     var tag_id = dom.getAttribute('tag_id');

                //     // set the clicked tag_id
                //     app_hotpot.vpp.$data.clicked_tag_id = tag_id;

                //     // show the menu
                //     app_hotpot.show_tag_popmenu_at(mouseX, mouseY);
                // } else {
                //     // what to do?
                // }
            }
        );
    },

    bind_keypress_event: function() {
        document.addEventListener(
            "keypress",
            function(event) {
                // console.log('* pressed on', event);

                // first, check if there is any selection
                app_hotpot.vpp.add_etag_by_shortcut_key(
                    event.key.toLocaleLowerCase()
                );
            }
        );

        document.addEventListener('keydown', function(event) {
            if (event.ctrlKey ||
                event.metaKey || 
                event.which === 19) {
                app_hotpot.has_pressed_ctrl_meta = true;
                timer = Date.now();
            }
            if (app_hotpot.has_pressed_ctrl_meta && 
                event.which === 83 && 
                Date.now()-timer<100){
                event.preventDefault();
                app_hotpot.has_pressed_ctrl_meta = false;

                // ok, let's do saving
                console.log('* pressed Cmd/Ctrl + S for saving the current annotation')
                app_hotpot.vpp.save_xml();
            }
          });
    },

    bind_unload_event: function() {
        window.addEventListener('beforeunload', function (event) {
            if (app_hotpot.vpp.has_unsaved_ann_file()) {
                event.preventDefault();
                var msg = 'There are unsaved annotation files, are you sure to leave them unsaved?';
                event.returnValue = msg;
                return msg;
            }
        });
    },

    resize: function() {
        var w = $(window).width();
        var h = $(window).height();
        $('.main-ui').css('height', h - 145);

        if (this.vpp.$data.section == 'annotation') {
            // due the svg issue, when resizing the window,
            // redraw all rtag marks only when annotation 
            this.cm_clear_rtag_marks();

            // redraw all marks
            this.cm_update_tag_marks();
        }

        console.log('* resized windows to ' + w + 'x' + h);
    },

    parse_file2ann: function(file, dtd) {
        var ann = null;
        if (app_hotpot.is_file_ext_txt(file.fh.name)) {
            // this is a text file
            ann = ann_parser.txt2ann(
                file.text,
                dtd
            );

            // bind fh, but txt has no real fh
            ann._fh = null;
            // bind the filename seperately
            // create a file name 
            ann._filename = app_hotpot.get_new_ann_fn_by_txt_fn(
                file.fh.name
            );

        } else if (app_hotpot.is_file_ext_xml(file.fh.name)) {
            // this is a xml file
            ann = ann_parser.xml2ann(
                file.text,
                dtd
            );

            // bind the fh
            ann._fh = file.fh;
            // bind the filename seperately
            ann._filename = file.fh.name;
        }

        return ann;
    },


    read_file_async: function(fileEntry, callback) {
        fileEntry.file(function(file) {
            let reader = new FileReader();
            reader.onload = callback;
            reader.readAsText(file)
        });
    },

    parse_ann_file_fh: function(fh, dtd) {
        // show something if this file exists
        // check if this file name exists
        if (app_hotpot.vpp.has_included_ann_file(fh.name)) {
            // exists? skip this file
            app_hotpot.msg('Skipped same name or duplicated ' + fh.name);
            return;
        }

        // if drop a txt!
        if (app_hotpot.is_file_ext(fh.name, 'txt')) {
            // parse this txt file
            app_hotpot.parse_ann_txt_file_fh(
                fh,
                dtd
            );
            return;
        }

        // should be a ann txt/xml file
        if (app_hotpot.is_file_ext(fh.name, 'xml')) {
            app_hotpot.parse_ann_xml_file_fh(
                fh,
                dtd
            );
            return;
        }

        console.log('* skip unknown format file', fh.name);
    },

    get_new_ann_fn_by_txt_fn: function(txt_fn) {
        return txt_fn + '.xml';
    },

    update_ann_sentences: function(ann, skip_existed) {
        if (typeof(skip_existed) == 'undefined') {
            skip_existed = true;
        }

        if (ann._sentences_text != '') {
            if (skip_existed) {
                return ann;
            }
        }
        var r = nlp_toolkit.sent_tokenize(
            ann.text,
            app_hotpot.vpp.$data.cfg.sentence_splitting_algorithm
        );
        ann._sentences = r.sentences;
        ann._sentences_text = r.sentences_text;

        // console.log('* updated sentences for ann', ann._filename);
        return ann;
    },

    /////////////////////////////////////////////////////////////////
    // DTD update related
    /////////////////////////////////////////////////////////////////
    // the default colors are from
    // https://colorbrewer2.org/#type=qualitative&scheme=Set3&n=12
    app_colors: [
        '#a6cee3',
        // '#1f78b4',
        '#51a1d7',
        '#b2df8a',
        '#33a02c',
        '#fb9a99',
        '#e31a1c',
        '#fdbf6f',
        '#ff7f00',
        '#cab2d6',
        '#9654dc',
        '#d0aa3d',
        '#b15928',
        '#8dd3c7',
        '#9c9c64',
        '#bebada',
        '#fb8072',
        '#80b1d3',
        '#fdb462',
        '#b3de69',
        '#fccde5',
        '#d9d9d9',
        '#bc80bd',
        '#ccebc5',
        '#ffed6f',
    ],

    update_tag_styles: function() {
        var elem_style = document.getElementById ("dtd_style");
        var style = elem_style.sheet ? elem_style.sheet : elem_style.styleSheet;

        // clear all rules first
        while(style.cssRules.length>0) {
            style.deleteRule(0);
        }

        // check each tag
        var i = 0;
        for (const tag_name in this.vpp.$data.dtd.tag_dict) {
            if (Object.hasOwnProperty.call(this.vpp.$data.dtd.tag_dict, tag_name)) {
                var tag = this.vpp.$data.dtd.tag_dict[tag_name];
                
                // add a new style for this tag
                var color = 'white';
                if ( i < this.app_colors.length ) {
                    // use default color
                    color = this.app_colors[i];
                } else {
                    // we don't have enough colors now
                    // just use a random color
                    color = '#' + Math.floor(Math.random()*16777215).toString(16);
                }

                // update the color for this tag
                this.vpp.$data.dtd.tag_dict[tag_name].style = {
                    color: color
                };
                
                // add this tag as the given color
                // set this color for related css rules
                style.insertRule(
                    ".mark-tag-" + tag_name + " { background-color: " + color + "; }",
                    0
                );
                style.insertRule(
                    ".border-tag-" + tag_name + " { border-color: " + color + " !important; }",
                    0
                );
                style.insertRule(
                    ".fg-tag-" + tag_name + " { color: " + color + " !important; }",
                    0
                );

                // add this for svg
                style.insertRule(
                    ".svgmark-tag-" + tag_name + " { fill: " + color + "; }",
                    0
                );

                // add this tag as the hint
                style.insertRule(
                    ".mark-hint-" + tag_name + ":hover { background-color: " + color + "; }",
                    0
                );
                
                i += 1;
            }
        }
    },

    app_shortcuts: [
        '1',
        '2',
        '3',
        '4',
        '5',
        'q',
        'w',
        'e',
        'r',
        't',
        'a',
        's',
        'd',
        'f',
        'g',
        'z',
        'x',
        'c',
        'v',
        'b'
    ],

    update_tag_shortcuts: function() {
        for (let i = 0; i < this.vpp.dtd.etags.length; i++) {
            if (i < this.app_shortcuts.length) {
                // assign a key to this etag
                this.vpp.dtd.etags[i].shortcut = this.app_shortcuts[i];
                
                // now, we need to update the tag_dict
            }
        }
    },

    show_tag_ctxmenu: function(x, y) {
        var w = this.ctxmenu_sel.width();
        var h = this.ctxmenu_sel.height();
        var new_y = this.adjust_ctxmenu_y(y, h);
        console.log("* show tag ctx menu on ", x, y, "("+new_y+")", 'w', w, 'h', h);

        // show the tag ctx menu
        this.ctxmenu_sel.css('left', (x - 10 - w) + 'px')
            .css('top', (new_y + 10) + 'px')
            .show('drop', {}, 200, null);
    },

    show_nce_ctxmenu: function(x, y) {
        var w = this.ctxmenu_nce.width();
        var h = this.ctxmenu_nce.height();
        var new_y = this.adjust_ctxmenu_y(y, h);
        console.log("* show nce ctx menu on ", x, y, "("+new_y+")", 'w', w, 'h', h);
        
        // show the document level menu
        this.ctxmenu_nce.css('left', (x - 10 - w) + 'px')
            .css('top', (new_y + 10) + 'px')
            .show('drop', {}, 200, null);
    },

    show_tag_popmenu_at: function(x, y) {
        var w = this.popmenu_tag.width();
        console.log("* show tag pop menu ("+w+") on ", x, y);
        // fix for not rendering
        if (w < 150) { w = 150;}
        this.popmenu_tag.css('left', (x - 10 - w) + 'px')
            .css('top', (y + 10) + 'px')
            .show('drop', {}, 200, null);
    },

    adjust_ctxmenu_y: function(y, h) {
        // get the height of current window
        var win_h = $(window).height();

        // set a new y position
        var new_y = y;

        // check the height to avoid hidden by 
        if (y + h > win_h) {
            new_y = win_h - h - 15;
        }

        return new_y;
    },

    update_tag_ctxmenu: function() {
        // update the context menu
        this.ctxmenu_sel = $('#ctxmenu_sel').menu({
            items: "> :not(.ui-widget-header)"
        });
    },

    update_nce_ctxmenu: function() {
        // update the context menu
        this.ctxmenu_nce = $('#ctxmenu_nce').menu({
            items: "> :not(.ui-widget-header)"
        });
    },

    update_tag_popmenu: function() {
        // update the pop menu
        this.popmenu_tag = $('#popmenu_tag').menu({
            items: "> :not(.ui-widget-header)"
        });
    },

    update_hint_dict_by_ann: function(ann) {
        this.vpp.hint_dict = ann_parser.add_ann_to_hint_dict(
            ann,
            this.vpp.hint_dict
        );
    },

    update_hint_dict_by_tag: function(ann, tag) {
        this.vpp.hint_dict = ann_parser.add_tag_to_hint_dict(
            ann, 
            tag, 
            this.vpp.hint_dict
        );
        //console.log('* updated hint_dict by a tag', this.vpp.hint_dict, tag);
    },

    /////////////////////////////////////////////////////////////////
    // Tag Related
    /////////////////////////////////////////////////////////////////
    make_etag: function(basic_tag, tag_def, ann) {
        // first, add the tag name
        basic_tag['tag'] = tag_def.name;

        // find the id number
        // var n = 0;
        // for (let i = 0; i < ann.tags.length; i++) {
        //     if (ann.tags[i].tag == tag_def.name) {
        //         // get the id number of this tag
        //         var _id = parseInt(ann.tags[i].id.replace(tag_def.id_prefix, ''));
        //         if (_id >= n) {
        //             n = _id + 1;
        //         }
        //     }
        // }
        // basic_tag['id'] = tag_def.id_prefix + n;
        basic_tag['id'] = ann_parser.get_next_tag_id(ann, tag_def);

        // add other attr defined in the tag_dee from schema (.dtd)
        for (let i = 0; i < tag_def.attrs.length; i++) {
            const att = tag_def.attrs[i];

            if (att.name == 'spans') {
                // special rule for spans attr
                // which means it could be a non-consuming tag?
            } else {
                // set the default value
                basic_tag[att.name] = att.default_value;
            }
        }

        return basic_tag;
    },

    make_rtag: function() {

    },

    make_empty_etag_by_tag_def: function(tag_def) {
        var etag = {
            id: '',
            tag: tag_def.name,
            spans: '',
            text: ''
        };

        // for non-consuming tag (doc-level tag)
        if (tag_def.hasOwnProperty('is_non_consuming') &&
            tag_def.is_non_consuming) {
            etag.spans = dtd_parser.NON_CONSUMING_SPANS;
        }

        // then add other attr
        for (let i = 0; i < tag_def.attrs.length; i++) {
            const att = tag_def.attrs[i];

            if (att.name == 'spans') {
                // special rule for spans attr
                etag.spans = dtd_parser.NON_CONSUMING_SPANS;

            } else {
                // set the default value
                etag[att.name] = att.default_value;
            }
        }

        return etag;
    },

    make_empty_rtag_by_tag_def: function(tag_def) {
        var rtag = {
            id: '',
            tag: tag_def.name
        };

        // then add other attr
        for (let i = 0; i < tag_def.attrs.length; i++) {
            const att = tag_def.attrs[i];

            if (att.name == 'spans') {
                // special rule for spans attr
            } else {
                // set the default value
                rtag[att.name] = att.default_value;
            }
        }

        return rtag;
    },
    
    remove_tag_from_ann: function(tag_id, ann) {
        var tag_idx = -1;
        for (let i = 0; i < ann.tags.length; i++) {
            if (ann.tags[i].id == tag_id) {
                tag_idx = i;
                break;
            }            
        }

        // delete the found tag idx
        if (tag_idx == -1) {
            // ???
        } else {
            ann.tags.splice(tag_idx, 1); 
        }

        return ann;
    },

    delete_tag: function(tag_id, ann, is_check_rtag, is_update_marks) {
        if (typeof(ann) == 'undefined') {
            ann = this.vpp.$data.anns[this.vpp.$data.ann_idx];
        }
        if (typeof(is_check_rtag) == 'undefined') {
            is_check_rtag = true;
        }
        if (typeof(is_update_marks) == 'undefined') {
            is_update_marks = true;
        }

        if (is_check_rtag) {
            // when deleting etag, need to check if there is linked rtag
            var linked_rtags = ann_parser.get_linked_rtags(tag_id, ann);

            if (linked_rtags.length == 0) {
                // great! no links!
                // just keep going
            } else {
                // ok, are you sure?
                // let's make a long message
                var msg = ['There are ' + linked_rtags.length + ' link tag(s) related to [' + tag_id + ']:\n'];
                for (let i = 0; i < linked_rtags.length; i++) {
                    const rtag = linked_rtags[i];
                    msg.push('- ' + rtag.id + ' (' + rtag.tag + ') ' + '\n');
                }
                msg.push('\nDeleting [' + tag_id + '] will also delete the above link tag(s).\n');
                msg.push('Are you sure to continue?');
                msg = msg.join('');

                var ret = this.confirm(msg);

                if (ret) {
                    // ok, let's delete the links first
                    for (let i = 0; i < linked_rtags.length; i++) {
                        const rtag = linked_rtags[i];
                        // save some time when running this inner deletion
                        this.delete_tag(
                            rtag.id, 
                            ann, 
                            false, 
                            false
                        );
                    }
                } else {
                    // nice choice! keep them all!
                    return;
                }
            }
        }

        // just remove this tag now
        this.vpp.$data.anns[this.vpp.$data.ann_idx] = this.remove_tag_from_ann(tag_id, ann);

        // mark _has_saved
        // this.vpp.$data.anns[this.vpp.$data.ann_idx]._has_saved = false;
        this.vpp.set_current_ann_unsaved();

        console.log('* deleted tag ' + tag_id);

        // remove the hover box
        this.vpp.hovered_tag = null;

        // update the marks
        if (is_update_marks) {
            app_hotpot.cm_update_marks();
        }

        // toast
        app_hotpot.toast(
            'Successfully deleted tag ' + tag_id,
            ''
        );
    },

    /////////////////////////////////////////////////////////////////
    // Annotation Related
    /////////////////////////////////////////////////////////////////

    scroll_annlist_to_bottom: function() {
        var objDiv = document.getElementById("mui_annlist");
        objDiv.scrollTop = objDiv.scrollHeight;
    },

    scroll_tag_table_to: function(tag_id) {
        // get the annlist height
        var h = $('#mui_annlist').height();
        
        // get the offset of this tag
        var tr = $('#tag-table-row-' + tag_id);
        if (tr.length != 1) {
            // which means no such element
            return; 
        }
        var offset_y = tr[0].offsetTop;

        // scroll to the view
        // when scrolling to the offset
        $('#mui_annlist')[0].scrollTo(
            0, // the x-axis should be no scroll
            offset_y - h / 2
        );
    },

    highlight_tag_table_row: function(tag_id) {
        // get the row of this tag
        var tagr = $('#tag-table-row-' + tag_id);
        if (tagr.length != 1) {
            // which means no such element
            return; 
        }
        var flag_actived = tagr.hasClass('tag-table-tr-actived');

        // remove other style
        $('.tag-table-row').removeClass('tag-table-tr-actived');

        // add a class to this dom
        if (flag_actived) {

        } else {
            tagr.addClass('tag-table-tr-actived');
        }
        // show animation
        // tagr.animate({backgroundColor: 'yellow'}, 300)
        // .animate({backgroundColor: 'white'}, 700);
    },
    
    /////////////////////////////////////////////////////////////////
    // Shared utils for all functions
    /////////////////////////////////////////////////////////////////
    is_same_dtd: function(dtd_a, dtd_b, level) {
        if (typeof(level) == 'undefined') {
            level = 0;
        }

        if (level>=0) {
            if (dtd_a.name == dtd_b.name) {
                
            } else {
                return false;
            }
        }

        return true;
    },

    is_fn_existed_in_files: function(fn, files) {
        for (let i = 0; i < files.length; i++) {
            const _f = files[i];
            if (_f.fh.name == fn) {
                return true;
            }
        }

        return false;
    },

    is_file_ext: function(filename, ext) {
        var fn_lower = filename.toLocaleLowerCase();

        if (fn_lower.endsWith("." + ext)) {
            return true;
        }

        return false;
    },

    is_file_ext_txt: function(fn) {
        return app_hotpot.is_file_ext(fn, 'txt');
    },

    is_file_ext_xml: function(fn) {
        return app_hotpot.is_file_ext(fn, 'xml');
    },

    is_file_ext_json: function(fn) {
        return app_hotpot.is_file_ext(fn, 'json');
    },

    is_file_ext_yaml: function(fn) {
        return app_hotpot.is_file_ext(fn, 'yaml');
    },

    is_file_ext_ann: function(fn) {
        return app_hotpot.is_file_ext(fn, 'ann');
    },

    toast: function(msg, cls, timeout) {
        if (typeof(cls) == 'undefined') {
            cls = '';
        }
        if (typeof(timeout) == 'undefined') {
            timeout = 3000;
        }
        var options = {
            showTop: true,
            timeout: timeout,
            clsToast: cls
        };
        Metro.toast.create(msg, null, null, null, options);
    },

    msg: function(msg, cls) {
        if (typeof(cls) == 'undefined') {
            cls = 'info';
        }
        msg = '<i class="fa fa-info-circle"></i> ' + msg; 
        var notify = Metro.notify;
        notify.setup({
            width: 300,
            timeout: 3000,
            animation: 'swing'
        });
        notify.create(msg, null, { 
            cls: cls
        });
    },

    confirm: function(msg) {
        return window.confirm(msg);
        // Metro.dialog.create({
        //     title: "Use Windows location service?",
        //     content: "<div>Bassus abactors ducunt ad triticum...</div>",
        //     actions: [
        //         {
        //             caption: "Agree",
        //             cls: "js-dialog-close alert",
        //             onclick: function(){
        //                 alert("You clicked Agree action");
        //             }
        //         },
        //         {
        //             caption: "Disagree",
        //             cls: "js-dialog-close",
        //             onclick: function(){
        //                 alert("You clicked Disagree action");
        //             }
        //         }
        //     ]
        // });
    },

    get_elem_shape: function(elem) {
        // get the bounding box for this element
        var bounds = elem.getBBox();

        // get the extend style 
        var style = getComputedStyle(elem);
        var padding_top = parseInt(style["padding-top"])
        var padding_left = parseInt(style["padding-left"])
        var padding_right = parseInt(style["padding-right"])
        var padding_bottom = parseInt(style["padding-bottom"])

        // now, we could get the shape of this element
        var shape = {
            x: bounds.x - padding_left,
            y: bounds.y - padding_top,
            width: bounds.width + padding_left + padding_right,
            height: bounds.height + padding_top + padding_bottom
        }

        return shape;
    },

    make_svg_text_bg: function(elem, cls) {
        // get the shape
        var shape = this.get_elem_shape(elem);

        // create a background
        var bg = document.createElementNS(
            "http://www.w3.org/2000/svg", 
            "rect"
        );

        // set the attributes of this bg
        bg.setAttribute("x", shape.x);
        bg.setAttribute("y", shape.y);
        bg.setAttribute("width", shape.width);
        bg.setAttribute("height", shape.height);
        bg.setAttribute("class", 'tag-linktext-bg ' + cls);

        elem.parentNode.insertBefore(bg, elem);
    },


    hard_slice: function(a, n) {
        if (typeof(n) == 'undefined') {
            n = 10;
        }

        if (n>a.length) {
            n = a.length;
        }

        var b = [];
        for (let i = 0; i < n; i++) {
            b.push(a[i]);
        }

        return b;
    },


    /////////////////////////////////////////////////////////////////
    // Code Mirror Related
    /////////////////////////////////////////////////////////////////
    // see app_hotpot_ext_codemirror.js

    
    /////////////////////////////////////////////////////////////////
    // Tour Related
    /////////////////////////////////////////////////////////////////
    // see app_hotpot_ext_tour.js

};