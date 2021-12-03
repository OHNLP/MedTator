var app_hotpot = {
    // metro app toast
    metro_toast: Metro.toast.create,

    // for tour
    tour: {
        annotation: null,
    },

    // vue app
    vpp: null,
    vpp_id: '#app_hotpot',

    vpp_data: {
        // for the section control
        section: 'annotation',

        // for the dtd
        dtd: null,

        // for the ann files
        ann_idx: null,
        anns: [],

        // for showing the tag by tag_name,
        display_tag_name: '__all__',

        // for the hints of current ann
        hints: [],

        // for all hints of all anns
        hint_dict: {},

        // for popmenu
        clicked_tag_id: null,

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

        // for iaa comp
        iaa_ann_list: [
            {anns: [], name: 'A'}, // for annotator A
            {anns: [], name: 'B'}, // for annotator B
        ],
        iaa_dict: null,
        iaa_display_tag_name: '__all__',
        iaa_match_mode: 'overlap', // overlap / exact
        iaa_overlap_ratio: 50,
        iaa_overlap_ratio_default: 50,
        iaa_display_hashcode: null,
        iaa_display_tags_context: true,
        iaa_display_tags_tp: false,
        iaa_display_adj_panel: true,
        iaa_display_adj_detail: false,
        force_module_update: Math.random(), // for updating the sub module

        // for iaa adjudication
        iaa_gs_dict: null,

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
            is_show_settings: false,

            // active tab
            active_setting_tab: 'import',

            // which algorithm to use as default
            sentence_splitting_algorithm: 'simpledot',
        },

        // for statistics

        // for export
        export_text: null,

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

        /////////////////////////////////////////////////////////////////
        // Annotation section related functions
        /////////////////////////////////////////////////////////////////
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
                app_hotpot.msg('The browser you are using does not support File System Access API. You can use "Download XML" function instead.', 'warning');
                return;
            }
            // before saving, need to check the _fh
            var p_ann = null;
            if (this.anns[this.ann_idx]._fh === null ||
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
        
        download_as_xml: function() {
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

        show_wiki: function() {
            // app_hotpot.start_tour_annotation();
            window.open(
                'https://github.com/OHNLP/MedTator/wiki',
                '_blank'
            );
        },

        show_howtouse: function() {
            window.open(
                'https://github.com/OHNLP/MedTator/wiki/Manual#export-tab',
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
            $.get(
                './static/data/vpp_data_'+ds_name+'.json', 
                {
                    rnd: Math.random()
                }, 
                function(data) {
                    Object.assign(app_hotpot.vpp.$data, data);
                    app_hotpot.set_dtd(
                        app_hotpot.vpp.$data.dtd
                    );
                    app_hotpot.vpp.set_ann_idx(0);
                }, 
                'json'
            );
        },

        open_dtd_file: function() {
            // the settings for dtd file
            var pickerOpts = {
                types: [
                    {
                        description: 'DTD File',
                        accept: {
                            'text/dtd': ['.dtd']
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

                    p_dtd.then(function(dtd) {
                        app_hotpot.set_dtd(dtd);
                    });
                }
            });
        },
        
        open_ann_files: function() {
            // the settings for annotation file
            var pickerOpts = {
                types: [
                    {
                        description: 'Annotation File',
                        accept: {
                            'text/xml': ['.xml']
                        }
                    },
                ],
                excludeAcceptAllOption: true,
                multiple: true
            };

            // get the file handles
            var promise_fileHandles = fs_open_files(pickerOpts);

            promise_fileHandles.then(function(fileHandles) {
                // bind the content
                for (let i = 0; i < fileHandles.length; i++) {
                    const fh = fileHandles[i];

                    // check exists
                    if (app_hotpot.vpp.has_included_ann_file(fh.name)) {
                        // exists? skip this file
                        app_hotpot.msg('Skipped same name or duplicated ' + fh.name);
                        return;
                    }
                    
                    // parse this ann fh
                    app_hotpot.parse_ann_file_fh(
                        fh,
                        app_hotpot.vpp.$data.dtd
                    );
                }
            });
        },

        update_tag_table: function(tag) {
            console.log('* update tag table', tag);
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

        show_ann_file: function(fn) {
            // first, find the ann_idx
            var idx = this.fn2idx(fn);

            if (idx < 0) {
                // no such file
                app_hotpot.toast('Not found ' + fn + ' file', 'bg-yellow');
                return;
            }

            // then switch to annotation
            this.switch_mui('annotation');

            // then show the idx
            this.set_ann_idx(idx);

            // trick for cm late update
            this.cm.is_expire = true;
        },

        fn2idx: function(fn) {
            for (let i = 0; i < this.anns.length; i++) {
                if (this.anns[i]._filename == fn) {
                    return i;
                }                
            }
            return -1;
        },

        remove_ann_file: function(idx) {
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

        remove_all_ann_files: function() {
            var ret = window.confirm('Are you sure to remove all annotation files?');
            if (ret) {
                this.set_ann_idx(null);
                this.anns = [];
            }
        },

        highlight_tag: function(tag) {
            var dom_id = 'mark-etag-id-' + tag.id;
            console.log('* highlight tag: ' + dom_id);

            // remove class
            $('.mark-tag-active').removeClass('mark-tag-active');

            // jump to this tag for display
            app_hotpot.cm_jump2tag(
                tag, 
                this.anns[this.ann_idx]
            );

            // remove class
            $('.mark-tag-active').removeClass('mark-tag-active');

            // add a class to this dom
            $('#'+dom_id).addClass('mark-tag-active');
        },

        on_change_attr_value: function(event) {
            // just mark current ann as unsaved
            this.anns[this.ann_idx]._has_saved = false;
            console.log('* changed attr in', event.target);
        },

        on_change_idref_value: function(event) {
            this.anns[this.ann_idx]._has_saved = false;
            // then, need to update this value
            this.on_change_link_settings(event);
        },

        on_input_attr_value: function(event) {
            // just mark current ann as unsaved
            this.anns[this.ann_idx]._has_saved = false;
            console.log('* changed input attr to', event.target.value);
        },

        on_change_display_mode: function(event) {
            console.log(event.target.value);
            // need to set ann again,
            // it will display according to the mode
            app_hotpot.cm_set_ann(
                this.anns[this.ann_idx]
            );
            app_hotpot.cm_update_marks();
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
            app_hotpot.cm_clear_ltag_marks();
            app_hotpot.cm_update_ltag_marks();
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
            var tag = app_hotpot.make_etag(_tag, tag_def, this.anns[this.ann_idx]);

            // add this tag to ann
            this.anns[this.ann_idx].tags.push(tag);

            // mark _has_saved
            this.anns[this.ann_idx]._has_saved = false;
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
            var _tag = app_hotpot.cm_make_basic_tag_from_selection();

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
            var _tag = app_hotpot.cm_make_basic_tag_from_selection();

            // then call the general add_etag process
            this.add_etag(_tag, tag_def);

            // clear the selection to avoid stick keys
            app_hotpot.cm_clear_selection();

            console.log('* added tag by shortcut, ' + tag_def.name + ' on ' + _tag.text);
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
            this.anns[this.ann_idx]._has_saved = false;

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
            this.anns[this.ann_idx]._has_saved = false;

            // ok, that's all?
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
            this.anns[this.ann_idx]._has_saved = false;

            // ok, that's all?
        },

        add_empty_ltag: function(ltag_def) {
            var ltag = app_hotpot.make_empty_ltag_by_tag_def(ltag_def);

            // create an tag_id
            var tag_id = ann_parser.get_next_tag_id(
                this.anns[this.ann_idx],
                ltag_def
            );
            ltag.id = tag_id;

            // add to list
            this.anns[this.ann_idx].tags.push(ltag);

            // mark _has_saved
            this.anns[this.ann_idx]._has_saved = false;

            // ok, that's all?
        },

        del_tag: function(tag_id) {
            // delete the clicked tag id
            app_hotpot.del_tag(
                tag_id, this.anns[this.ann_idx]
            );
        },


        /////////////////////////////////////////////////////////////////
        // Statistics related functions
        /////////////////////////////////////////////////////////////////

        update_hint_dict: function() {
            app_hotpot.update_hint_dict_by_anns();
        },

        download_stat_summary: function() {
            var json = [];

            var stat_items = this.get_stat_items();

            for (let i = 0; i < stat_items.length; i++) {
                const stat_item = stat_items[i];
                json.push({
                    item: stat_item[0],
                    result: stat_item[1]
                });
            }

            // then convert the json to csv
            var csv = Papa.unparse(json, {
            });

            // download this csv
            var blob = new Blob([csv], {type: "text/tsv;charset=utf-8"});
            var fn = this.get_ruleset_base_name() + '-statistics.csv';
            saveAs(blob, fn);
        },

        get_stat_items: function() {
            return [
                ['# of documents', this.anns.length],
                ['# of tags in schema', this.dtd.etags.length],
                ['# of annotations', this.count_all_tags(this.anns)],
                ['# of annotations per tag', this.calc_avg_tags_per_def(this.anns, this.dtd)],
                ['# of annotations per document', this.calc_avg_tags_per_doc(this.anns)],
                [
                    '# of sentences',
                    this.count_all_sentences(this.anns)
                ],
                [
                    '# of sentences per document',
                    this.calc_avg_sentences_per_doc(this.anns)
                ],
            ];
        },
        
        /////////////////////////////////////////////////////////////////
        // Corpus menu related functions
        /////////////////////////////////////////////////////////////////

        clear_corpus_all: function() {
            this.txt_anns = [];
            this.txt_xmls = [];
        },

        open_txt_files: function() {
            // the settings for raw text file
            var pickerOpts = {
                types: [
                    {
                        description: 'Raw Text File',
                        accept: {
                            'text/txt': ['.txt']
                        }
                    },
                ],
                excludeAcceptAllOption: true,
                multiple: true
            };

            // get the file handles
            var promise_fileHandles = fs_open_files(pickerOpts);

            promise_fileHandles.then(function(fileHandles) {
                // bind the content
                for (let i = 0; i < fileHandles.length; i++) {
                    const fh = fileHandles[i];

                    // check exists
                    if (app_hotpot.vpp.has_included_txt_ann_file(fh.name)) {
                        // exists? skip this file
                        return;
                    }
                    
                    // read the file
                    var p_txt_ann = fs_read_txt_file_handle(
                        fh,
                        app_hotpot.vpp.$data.dtd
                    );
                    p_txt_ann.then(function(txt_ann) {
                        app_hotpot.vpp.add_txt(txt_ann);
                    });
                    
                }
            });
        },

        add_txt: function(txt_ann) {
            // update the dtd name here
            txt_ann.dtd_name = this.dtd.name;
    
            // put this to the list
            this.txt_anns.push(txt_ann);
        },

        convert_txt_anns_to_xmls: function() {
            // clear the current txt_xmls
            this.txt_xmls = [];

            for (let i = 0; i < this.txt_anns.length; i++) {
                const txt_ann = this.txt_anns[i];
                
                // create new filename
                var fn = txt_ann._filename;

                // get the xml string
                var xml = ann_parser.ann2xml(txt_ann, this.dtd);
                var str = ann_parser.xml2str(xml);

                // create an object for display
                var txt_xml = {
                    fn: fn,
                    text: str
                };

                this.txt_xmls.push(txt_xml);
            }
        },

        get_new_xml_filename: function(fn, ext='.xml') {
            var prefix = this.txt_xml_prefix.trim();
            var suffix = this.txt_xml_suffix.trim();
            var new_fn = fn;

            // add prefix
            if (prefix == '') {
                // nothing to do
            } else {
                new_fn = prefix + '_' + new_fn;
            }

            // add suffix
            if (suffix == '') {
                // nothing to do
                new_fn = new_fn + ext;
            } else {
                new_fn = new_fn + '_' + suffix + ext;
            }

            return new_fn;
        },

        get_new_xmls_zipfile_folder_name: function() {
            var fn = this.dtd.name + '-' + this.txt_anns.length;
            fn = this.get_new_xml_filename(fn, '');
            return fn + '-xmls';
        },

        download_txt_xml: function(txt_ann_idx) {
            var txt_xml = this.txt_xmls[txt_ann_idx];
            var fn = this.get_new_xml_filename(txt_xml.fn);
            var blob = new Blob([txt_xml.text], {type: "text/xml;charset=utf-8"});
            saveAs(blob, fn);
        },

        download_txt_xmls_as_zip: function() {
            // create an empty zip pack
            var zip = new JSZip();
            var folder_name = this.get_new_xmls_zipfile_folder_name();

            // add files to zip pack
            for (let i = 0; i < this.txt_xmls.length; i++) {
                const txt_xml = this.txt_xmls[i];
                var fn = this.get_new_xml_filename(txt_xml.fn);
                var ffn = folder_name + '/' + fn;

                // add to zip
                zip.file(ffn, txt_xml.text);
                
                console.log('* added xml file ' + fn);
            }

            // create zip file
            zip.generateAsync({ type: "blob" }).then(function (content) {
                saveAs(content, app_hotpot.vpp.get_new_xmls_zipfile_folder_name() + '.zip');
            });
        },

        /////////////////////////////////////////////////////////////////
        // IAA Related
        /////////////////////////////////////////////////////////////////
        clear_iaa_all: function() {
            // clear everything related to iaa
            this.iaa_ann_list[0].anns = [];
            this.iaa_ann_list[1].anns = [];

            this.iaa_dict = null;

            this.iaa_display_tag_name = '__all__';
            this.iaa_display_hashcode = null;
        },

        add_iaa_ann: function(ann, iaa_id) {
            this.iaa_ann_list[iaa_id].anns.push(ann);
        },

        calc_iaa: function() {
            var iaa_dict = iaa_calculator.evaluate_anns_on_dtd(
                this.dtd,
                this.iaa_ann_list[0].anns,
                this.iaa_ann_list[1].anns,
                this.iaa_match_mode,
                this.iaa_overlap_ratio / 100
            );
            this.iaa_dict = iaa_dict;
            console.log('* iaa result:', iaa_dict);

            // and create
            this.make_default_adj();
        },

        get_rst: function(obj) {
            if (this.iaa_display_tag_name == '__all__') {
                return obj.all;
            } else {
                return obj.tag[this.iaa_display_tag_name];
            }
        },

        on_change_iaa_settings: function(event) {
            console.log('* changed attr in', event.target);
        },

        make_default_adj: function() {
            this.iaa_gs_dict = iaa_calculator.get_default_gs_dict(
                this.dtd, this.iaa_dict
            );
        },

        get_gs_zipfile_folder_name: function() {
            return this.dtd.name + '-goldstandards';
        },

        download_all_gs: function() {
            // create an empty zip pack
            var zip = new JSZip();
            var folder_name = this.get_gs_zipfile_folder_name();

            // add files to zip pack
            for (const hashcode in this.iaa_gs_dict) {
                if (Object.hasOwnProperty.call(this.iaa_gs_dict, hashcode)) {
                    const ann_rst = this.iaa_gs_dict[hashcode];
                    
                    // change to an ann obj
                    var ann = iaa_calculator.make_ann_by_rst(ann_rst, this.dtd);

                    // get the xmlText
                    var xml_doc = ann_parser.ann2xml(ann, this.dtd);
                    var xml_text = ann_parser.xml2str(xml_doc);

                    // put this xml in folder (virtually)
                    var ffn = folder_name + '/' + ann._filename;
                    
                    // put this xml to zip
                    zip.file(ffn, xml_text);
                }
            }

            // create zip file
            zip.generateAsync({ type: "blob" }).then(function (content) {
                saveAs(content, app_hotpot.vpp.get_new_xmls_zipfile_folder_name() + '.zip');
            });
        },

        count_gs_tags: function(ann_hashcode) {
            if (this.iaa_display_tag_name == '__all__') {
                return this.count_iaa_gs_notnull(this.iaa_gs_dict[ann_hashcode]);
            } else {
                return this.count_iaa_gs_tag_notnull(
                    this.iaa_gs_dict[ann_hashcode].rst[this.iaa_display_tag_name]
                );
            }
        },

        count_iaa_gs_notnull: function(ann_rst) {
            var cnt = 0;
            for (const tag_name in ann_rst.rst) {
                if (Object.hasOwnProperty.call(ann_rst.rst, tag_name)) {
                    const tag_rst = ann_rst.rst[tag_name];
                    cnt += this.count_iaa_gs_tag_notnull(tag_rst);
                }
            }
            return cnt;
        },

        count_iaa_gs_tag_notnull: function(tag_rst) {
            var cnt = 0;
            for (const cm in tag_rst) {
                if (Object.hasOwnProperty.call(tag_rst, cm)) {
                    const tags = tag_rst[cm];
                    
                    for (let i = 0; i < tags.length; i++) {
                        if (tags[i] != null) {
                            cnt += 1;
                        }
                    }
                }
            }
            return cnt;
        },

        accept_iaa_tag: function(hashcode, tag_name, cm, tag_idx, from) {
            console.log('* accept', hashcode, tag_name, cm, tag_idx, from);
            this.iaa_gs_dict[hashcode].rst[tag_name][cm][tag_idx] = {
                tag: this.iaa_dict.ann[hashcode].rst.tag[tag_name].cm.tags[cm][tag_idx][
                    {'a':0, 'b':1}[from]
                ],
                from: from
            };
            this.force_module_update = Math.random();
        },

        reject_iaa_tag: function(hashcode, tag_name, cm ,tag_idx) {
            console.log('* reject', hashcode, tag_name, cm, tag_idx);
            this.iaa_gs_dict[hashcode].rst[tag_name][cm][tag_idx] = null;
            this.force_module_update = Math.random();
        },

        count_tags_in_anns: function(anns) {
            var cnt = 0;
            for (let i = 0; i < anns.length; i++) {
                const ann = anns[i];
                cnt += ann.tags.length;
            }
            return cnt;
        },

        /////////////////////////////////////////////////////////////////
        // Ruleset Related
        /////////////////////////////////////////////////////////////////

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

        /////////////////////////////////////////////////////////////////
        // Menu Related
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

        switch_mui: function(section) {
            console.log('* switch to section', section);
            this.section = section;

            if (section == 'annotation') {
                // refresh the code mirror
                this.set_ann_idx(this.ann_idx);
            }

            app_hotpot.resize();
        },

        close_ctxmenu: function() {
            app_hotpot.ctxmenu_sel.hide();
            app_hotpot.ctxmenu_nce.hide();
        },

        close_popmenu: function() {
            app_hotpot.popmenu_tag.hide();
        },

        on_click_tag: function(event, tag_id) {
            // set the clicked tag_id
            this.clicked_tag_id = tag_id;

            var mouseX = event.clientX;
            var mouseY = event.clientY;

            // then show the popmenu
            app_hotpot.show_tag_popmenu(mouseX, mouseY);
        },

        popmenu_del_tag: function() {
            // delete the clicked tag id
            app_hotpot.del_tag(
                this.clicked_tag_id, this.anns[this.ann_idx]
            );

            // hide the menu 
            app_hotpot.popmenu_tag.hide();

            // reset the clicked tag id
            this.clicked_tag_id = null;
        },

        popmenu_start_linking: function(ltag_def) {
            // first, set the working mode
            this.is_linking = true;

            // set the linking tag_def
            this.linking_tag_def = ltag_def;

            // create a ltag
            this.linking_tag = app_hotpot.make_empty_ltag_by_tag_def(ltag_def);

            // then get the linking atts for this ltag
            // this list contains all atts for this ltag
            // and during the linking, we will remove those linked att out
            this.linking_atts = this.get_idref_attlists(ltag_def);

            // let's set the first idref attlist
            // pop the first att from atts
            var att = this.linking_atts[0];
            this.linking_atts.splice(0, 1)
            this.linking_tag[att.name] = this.clicked_tag_id;
            
            // maybe we could show a float panel
            // for showing the current annotation
            console.log('* start linking', ltag_def.name, 
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
                this.anns[this.ann_idx]._has_saved = false;

                // then, we could show this new link in cm
                app_hotpot.cm_draw_ltag(
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
            // mark _has_saved
            this.anns[this.ann_idx]._has_saved = false;

            // then, we could show this new link in cm
            app_hotpot.cm_draw_ltag(
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
        make_html_bold_tag_name: function(tag) {
            var html = '<span class="tag-list-row-name-id-prefix">' + tag.id_prefix + '</span>';
            var name = tag.name;
            name = name.replace(tag.id_prefix, '');
            html = html += name;
            return html;
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

        count_all_tags: function(anns) {
            var n = 0;
            for (let i = 0; i < anns.length; i++) {
                for (let j = 0; j < anns[i].tags.length; j++) {
                    n += 1;
                }
            }
            return n;
        },

        count_all_sentences: function(anns) {
            var n = 0;
            for (let i = 0; i < anns.length; i++) {
                const ann = anns[i];
                if (ann.hasOwnProperty('_sentences')) {
                    n += ann._sentences.length;
                }
            }
            return n;
        },

        calc_avg_sentences_per_doc: function(anns) {
            if (anns == null || anns.length == 0) {
                return '-';
            }
            var t = this.count_all_sentences(anns);
            return (t/anns.length).toFixed(2);
        },

        calc_avg_tags_per_doc: function(anns) {
            if (anns == null || anns.length == 0) {
                return '-';
            }
            var t = this.count_all_tags(anns);
            return (t/anns.length).toFixed(2);
        },

        calc_avg_tags_per_def: function(anns, dtd) {
            if (anns == null || anns.length == 0) {
                return '-';
            }
            if (dtd == null || dtd.etags.length == 0) {
                return '-';
            }
            return (anns.length / dtd.etags.length).toFixed(2);
        },

        is_match_filename: function(fn) {
            let p = this.fn_pattern.trim();
            if (p == '') {
                return true;
            }
            if (fn.lastIndexOf(p) >= 0) {
                return true;
            } else {
                return false;
            }
        },

        has_included: function(fn, anns) {
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
            var new_fn = txt_fn + '.xml';
            var i = 1;
            while (true) {
                if (this.has_included_ann_file(new_fn)) {
                    new_fn = txt_fn + '_' + i + '.xml';
                    i += 1;
                } else {
                    break;
                }
            }
            return new_fn;
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

        get_tags_by_type: function(ann, dtd, type='etag') {
            var tags = [];
            for (let i = 0; i < ann.tags.length; i++) {
                const tag = ann.tags[i];
                if (dtd.tag_dict[tag.tag].type==type) {
                    tags.push(tag);
                }
            }
            return tags;
        },

        get_tag_by_tag_id: function(tag_id, ann) {
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

        get_idref_attlist_by_seq: function(ltag_def, seq=0) {
            var cnt = -1;
            for (let i = 0; i < ltag_def.attlists.length; i++) {
                if (ltag_def.attlists[i].vtype == 'idref') {
                    cnt += 1;
                    if (cnt == seq) {
                        // great! we get the attlist we want
                        return ltag_def.attlists[i];
                    }
                }
            }
            return null;
        },

        get_idref_attlists: function(ltag_def) {
            var attlists = [];
            for (let i = 0; i < ltag_def.attlists.length; i++) {
                const att = ltag_def.attlists[i];
                if (att.vtype == 'idref') {
                    attlists.push(att);
                }
            }
            return attlists;
        },

        to_fixed: function(v) {
            if (typeof(v) == 'undefined' ||
                v == null || 
                isNaN(v)) {
                return '0.00';
            }
            return v.toFixed(2);
        },

        to_width: function(v) {
            if (typeof(v) == 'undefined' ||
                v == null ||
                isNaN(v)) {
                return 1;
            }
            return v * 100;
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
            if (this.texts.hasOwnProperty(token)) {
                var html_content = '';

                // add the title
                html_content += 
                    "<h4>" + 
                    this.texts[token].title + 
                    "</h4>";
                
                // add the content
                html_content += this.texts[token].html;

                // show the html content
                Metro.infobox.create(html_content);

            } else {
                // ???
            }
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

    init: function() {
        this.vpp = new Vue({
            el: this.vpp_id,
            data: this.vpp_data,
            methods: this.vpp_methods,

            mounted: function() {
                Metro.init();
            },

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
        this.init_codemirror();

        // the global event
        this.bind_events();

        // set the resize
        this.resize();
    },

    init_codemirror: function() {
        // init the code mirror instance
        this.codemirror = CodeMirror(
            document.getElementById('cm_editor'), {
                lineNumbers: true,
                lineWrapping: true,
                readOnly: true,
                // readOnly: 'nocursor',
                // styleActiveLine: true
            }
        );

        this.codemirror.on('contextmenu', function(inst, evt) {
            evt.preventDefault();

            // update the selection texts
            var selection = app_hotpot.cm_get_selection(inst);
            if (selection.sel_txts == '') {
                // if there is/are non-consuming tags
                // which makes it a document-level annotation
                // show the menu here
                if (app_hotpot.vpp.get_nc_etags().length>0) {
                    // show
                    var mouseX = evt.clientX;
                    var mouseY = evt.clientY;
                    app_hotpot.show_nce_ctxmenu(mouseX, mouseY);
                    return;

                } else {
                    // nothing selected and there is no NC etag
                    return;
                }

            }
            // show the menu
            var mouseX = evt.clientX;
            var mouseY = evt.clientY;
            app_hotpot.show_tag_ctxmenu(mouseX, mouseY);
        });
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

        // force update
        this.vpp.$forceUpdate();
    },

    clear_ann_all: function() {
        this.txt_anns = [];
        this.txt_xmls = [];

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
        if (ann.dtd_name != this.vpp.$data.dtd.name) {
            console.log('* skip unmatched ann', ann);
            app_hotpot.msg('Skipped unmatched file ' + ann._filename, 'warning');
            return;
        }

        this.vpp.$data.anns.push(ann);

        // update hint_dict when add new ann file
        this.update_hint_dict_by_anns();

        if (is_switch_to_this_ann || this.vpp.$data.anns.length == 1) {
            this.vpp.$data.ann_idx = this.vpp.$data.anns.length - 1;

            // update the text display
            this.cm_set_ann(
                this.vpp.$data.anns[this.vpp.$data.ann_idx]
            );
    
            // update the marks
            this.cm_update_marks();
        }
        console.log("* added ann", ann);
    },

    /////////////////////////////////////////////////////////////////
    // Events related
    /////////////////////////////////////////////////////////////////

    bind_events: function() {
        // bind drop zone for dtd
        this.bind_dropzone_dtd();

        // bind drop zone for anns
        this.bind_dropzone_ann();

        // bind drop zone for anns
        this.bind_dropzone_txt();

        // bind drop zone for anns
        this.bind_dropzone_iaa();

        // bind global click event
        this.bind_click_event();

        // bind global key event
        this.bind_keypress_event();

        // bind the closing event
        this.bind_unload_event();
    },

    bind_click_event: function() {
        document.getElementById('app_hotpot').addEventListener(
            "click",
            function(event) {
                console.log('* clicked on', event.target);

                // var dom = event.target;
                // var obj = $(dom);

                // // show the menu
                // var mouseX = event.clientX;
                // var mouseY = event.clientY;

                // close the right click menu
                if (app_hotpot.ctxmenu_sel != null) {
                    app_hotpot.ctxmenu_sel.hide();
                }
                if (app_hotpot.ctxmenu_nce != null) {
                    app_hotpot.ctxmenu_nce.hide();
                }
                if (app_hotpot.popmenu_tag != null) {
                    app_hotpot.popmenu_tag.hide();
                }

                // if (obj.hasClass('mark-tag-text')) {
                //     // this is a mark in code mirror
                //     var tag_id = dom.getAttribute('tag_id');

                //     // set the clicked tag_id
                //     app_hotpot.vpp.$data.clicked_tag_id = tag_id;

                //     // show the menu
                //     app_hotpot.show_tag_popmenu(mouseX, mouseY);
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
                console.log('* pressed on', event);

                // first, check if there is any selection
                app_hotpot.vpp.add_etag_by_shortcut_key(
                    event.key.toLocaleLowerCase()
                );
            }
        );
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

    bind_dropzone_dtd: function() {
        let dropzone = document.getElementById("dropzone_dtd");

        dropzone.addEventListener("dragover", function(event) {
            event.preventDefault();
        }, false);

        dropzone.addEventListener("drop", function(event) {
            // prevent the default download event
            event.preventDefault();
            let items = event.dataTransfer.items;
        
            // user should only upload one folder or a file
            if (items.length>1) {
                console.log('* selected more than 1 item!');
                return;
            }
            // console.log('* found dropped items', items);

            if (isFSA_API_OK) {
                // use FSA API to access
                let item = items[0].getAsFileSystemHandle();
                console.log('* using FSA API to load item as dtd', item);

                // read this handle
                item.then(function(fh) {
                    if (fh.kind != 'file') { return null; }

                    // get the text content
                    var p_dtd = fs_read_dtd_file_handle(fh);

                    // handle the response
                    // we just create a function agent
                    // for support other parameters in future if possible
                    p_dtd.then((function(){
                        return function(dtd) {
                            // just set the dtd
                            app_hotpot.set_dtd(dtd);
                        }
                    })());
                });

            } else {
                // if there is not FSA_API, just use default API
                let item = items[0].webkitGetAsEntry();
                console.log('* using webkit Entry API to load item as dtd', item);
        
                if (item) {
                    // ok, user select a folder ???
                    if (item.isDirectory) {
                        // show something?

                    } else {
                        // should be a dtd file
                        // so item is a fileEntry
                        app_hotpot.parse_dtd_file_entry(item);
                    }
                } else {
                    console.log('* something wrong with dtd item', item);
                }
            }

            // for (let i=0; i<items.length; i++) {
            //     let item = items[i].webkitGetAsEntry();
        
            //     if (item) {
            //         // ok, user select a folder ???
            //         if (item.isDirectory) {
            //             // show something?

            //         } else {
            //             // should be a dtd file
            //             // so item is a fileEntry
            //             app_hotpot.parse_dtd_file_entry(item);
            //         }
            //     }

            //     // just detect one item, folder or zip
            //     break;
            // }

        }, false);
    },

    bind_dropzone_ann: function() {
        let dropzone = document.getElementById("dropzone_ann");

        dropzone.addEventListener("dragover", function(event) {
            event.preventDefault();
        }, false);

        dropzone.addEventListener("drop", function(event) {
            // prevent the default download event
            event.preventDefault();
            
            let items = event.dataTransfer.items;
            for (let i=0; i<items.length; i++) {
                if (isFSA_API_OK) {
                    // get this item as a FileSystemHandle Object
                    // this could be used for saving the content back
                    // let item = items[i].webkitGetAsEntry();
                    let item = items[i].getAsFileSystemHandle();

                    // read this handle
                    item.then(function(fh) {
                        if (fh.kind == 'file') {
                            // if drop a txt!
                            if (app_hotpot.is_file_ext(fh.name, 'txt')) {
                                // create a new file name
                                var new_fn = app_hotpot.vpp.get_new_ann_fn_by_txt_fn(fh.name);

                                // create a empty ann
                                var p_txt_ann = fs_read_txt_file_handle(
                                    fh, 
                                    app_hotpot.vpp.$data.dtd,
                                    true
                                );

                                // load this ann
                                p_txt_ann.then((function(new_fn){
                                    return function(txt_ann) {
                                        // modify the txt_ann _fh
                                        // we couldn't save to an txt
                                        txt_ann._fh = null;

                                        // update the _filename
                                        txt_ann._filename = new_fn;

                                        // show some message
                                        app_hotpot.msg("Created a new annotation file " + new_fn);

                                        // add this ann
                                        app_hotpot.add_ann(txt_ann);
                                    }
                                })(new_fn));

                                return;
                            }

                            // show something or 
                            // check if this file name exists
                            if (app_hotpot.vpp.has_included_ann_file(fh.name)) {
                                // exists? skip this file
                                app_hotpot.msg('Skipped same name or duplicated ' + fh.name);
                                return;
                            }

                            // should be a ann txt/xml file
                            app_hotpot.parse_ann_file_fh(
                                fh,
                                app_hotpot.vpp.$data.dtd
                            );

                        } else {
                            // so item is a directory?
                        }
                    });
                } else {
                    // just load the file 
                    let item = items[i].webkitGetAsEntry();
                    console.log(item);
                    if (item) {
                        // ok, user select a folder ???
                        if (item.isDirectory) {
                            // show something?
    
                        } else {
                            // so item is a fileEntry
                            app_hotpot.parse_ann_file_entry(item);
                        }
                    }
                }
                
                
            }

        }, false);

    },

    bind_dropzone_txt: function() {
        let dropzone = document.getElementById("dropzone_txt");

        dropzone.addEventListener("dragover", function(event) {
            event.preventDefault();
        }, false);

        dropzone.addEventListener("drop", function(event) {
            let items = event.dataTransfer.items;
            // stop the download event
            event.preventDefault();

            for (let i=0; i<items.length; i++) {
                // let item = items[i].webkitGetAsEntry();
                let item = items[i].getAsFileSystemHandle();
        
                item.then(function(fh) {
                    if (fh.kind == 'file') {
                        // check exists
                        if (app_hotpot.vpp.has_included_txt_ann_file(fh.name)) {
                            // exists? skip this file
                            return;
                        }

                        // read the file
                        var p_txt_ann = fs_read_txt_file_handle(
                            fh,
                            app_hotpot.vpp.$data.dtd
                        );
                        p_txt_ann.then(function(txt_ann) {
                            app_hotpot.vpp.add_txt(txt_ann);
                        });
                        
                    } else {
                        // what to do with a directory
                    }
                })
                .catch(function(error) {
                    console.log('* error when drop txt', error);
                });
            }

        }, false);
    },

    bind_dropzone_iaa: function() {
        let dropzones = document.getElementsByClassName("dropzone-iaa");

        for (let i = 0; i < dropzones.length; i++) {
            var dropzone = dropzones[i];
            var iaa_id = parseInt(dropzone.getAttribute('iaa_id'));

            dropzone.addEventListener("dragover", function(event) {
                event.preventDefault();
            }, false);

            dropzone.addEventListener("drop", (function(iaa_id) {
                return function(event) {
                    // stop the download event
                    event.preventDefault();
                    // first, we need to which dropzone triggers event
    
                    console.log('* drop something on iaa ' + iaa_id);
                    // return;
        
                    let items = event.dataTransfer.items;
        
                    for (let i=0; i<items.length; i++) {
                        // check ext first
                        let fileEntry = items[i].webkitGetAsEntry();
                        if (!app_hotpot.is_file_ext(fileEntry.name, 'xml')) {
                            app_hotpot.msg('Skipped non-XML file ' + fileEntry.name, 'warning');
                            continue;
                        }
                        // we have two ways of loading data
                        // first using the basic entry
                        // second using the fs handle
                        // it depends the browser API
                        if (isFSA_API_OK) {
                            // just load in this way
                            let item = items[i].getAsFileSystemHandle();
                            item.then((function(iaa_id) {
                                return function(fh) {
                                    if (fh.kind == 'file') {
                                        // check exists
                                        if (app_hotpot.vpp.has_included(
                                            fh.name, 
                                            app_hotpot.vpp.$data.iaa_ann_list[iaa_id].anns)) {
                                            // exists? skip this file
                                            return;
                                        }
                
                                        // read the file
                                        var p_ann = fs_read_ann_file_handle(
                                            fh,
                                            app_hotpot.vpp.$data.dtd
                                        );
                                        p_ann.then((function(iaa_id) {
                                            return function(ann) {
                                                app_hotpot.vpp.add_iaa_ann(ann, iaa_id);
                                            }
                                        })(iaa_id)).catch(function(error) {
                                            app_hotpot.msg("Couldn't read ann, " + error.name);
                                            console.error(error);
                                        });
                                        
                                    } else {
                                        // what to do with a directory
                                    }
                                }
                            })(iaa_id))
                            .catch(function(error) {
                                console.log('* error when drop txt', error);
                            });
                        } else {
                            // just load the file 
                            let item = items[i].webkitGetAsEntry();
                            if (item) {
                                // ok, user select a folder ???
                                if (item.isDirectory) {
                                    // show something?
            
                                } else {
                                    // should be a dtd file
                                    // so item is a fileEntry
                                    var new_fn = item.name;
                                    app_hotpot.read_file_async(item, (function(new_fn, iaa_id){
                                        return function(evt) {
                                            var xml = evt.target.result;
                            
                                            // try to parse this xml file
                                            var ann = ann_parser.xml2ann(
                                                xml, 
                                                app_hotpot.vpp.$data.dtd
                                            );
                        
                                            // post processing
                                            // we don't have fh due to using fileEntry
                                            ann._fh = null;
                                            ann._filename = new_fn;
                                            ann._has_saved = true;
                                            var result = nlp_toolkit.sent_tokenize(ann.text);
                                            ann._sentences = result.sentences;
                                            ann._sentences_text = result.sentences_text;
                                            
                                            // ok, add this the dtd for annotator
                                            app_hotpot.vpp.add_iaa_ann(ann, iaa_id);
                                        }
                                    })(new_fn, iaa_id));
                                }
                            }
                        }


                        
                    }
        
                }
            })(iaa_id), false);
        }
        
    },

    resize: function() {
        var h = $(window).height();
        $('.main-ui').css('height', h - 145);

        // due the svg issue, when resizing the window,
        // redraw all ltag marks
        this.cm_clear_ltag_marks();
        this.cm_update_ltag_marks();
    },

    parse_dtd_file_entry: function(fileEntry) {
        app_hotpot.read_file_async(fileEntry, function(evt) {
            var text = evt.target.result;
            // console.log('* read dtd', text);

            // try to parse this dtd file
            var dtd = dtd_parser.parse(text);
            
            // ok, set the dtd for annotator
            app_hotpot.set_dtd(dtd);
        });
    },

    parse_ann_file_entry: function(fileEntry) {
        // first, decide type
        if (app_hotpot.is_file_ext(fileEntry.name, 'txt')) {
            // so, just read this file and get the content
            // to create new file name
            var new_fn = app_hotpot.vpp.get_new_ann_fn_by_txt_fn(fileEntry.name);

            app_hotpot.read_file_async(fileEntry, (function(new_fn){
                return function(evt) {
                    var text = evt.target.result;
    
                    // try to parse this txt file
                    var ann = ann_parser.txt2ann(
                        text, 
                        app_hotpot.vpp.$data.dtd
                    );

                    // post processing
                    ann._fh = null;
                    ann._filename = new_fn;
                    ann._has_saved = true;
                    var result = nlp_toolkit.sent_tokenize(ann.text);
                    ann._sentences = result.sentences;
                    ann._sentences_text = result.sentences_text;

                    // show some message
                    app_hotpot.msg("Created a new annotation file " + new_fn);
                    
                    // ok, add this the dtd for annotator
                    app_hotpot.add_ann(ann);
                }
            })(new_fn));

        } else if (app_hotpot.is_file_ext(fileEntry.name, 'xml')) {
            // ok, this is an xml file, usually it's what we want
            // check existance first
            if (app_hotpot.vpp.has_included_ann_file(fileEntry.name)) {
                // exists? skip this file
                app_hotpot.msg('Skipped same name or duplicated ' + fileEntry.name);
                return;
            }

            // then create 
            var new_fn = fileEntry.name;
            app_hotpot.read_file_async(fileEntry, (function(new_fn){
                return function(evt) {
                    var xml = evt.target.result;
    
                    // try to parse this xml file
                    var ann = ann_parser.xml2ann(
                        xml, 
                        app_hotpot.vpp.$data.dtd
                    );

                    // post processing
                    // we don't have fh due to using fileEntry
                    ann._fh = null;
                    ann._filename = new_fn;
                    ann._has_saved = true;
                    var result = nlp_toolkit.sent_tokenize(ann.text);
                    ann._sentences = result.sentences;
                    ann._sentences_text = result.sentences_text;
                    
                    // ok, add this the dtd for annotator
                    app_hotpot.add_ann(ann);
                }
            })(new_fn));
            
        } else {
            // what???
            app_hotpot.msg('Skipped unknown format file ' + fileEntry.name);
            return;
        }
    },

    read_file_async: function(fileEntry, callback) {
        fileEntry.file(function(file) {
            let reader = new FileReader();
            reader.onload = callback;
            reader.readAsText(file)
        });
    },

    parse_ann_file_fh: function(fh, dtd) {
        // get the ann file
        var p_ann = fs_read_ann_file_handle(fh, dtd);
        p_ann.then(function(ann) {
            app_hotpot.add_ann(ann);
        }).catch(
            function(fh){return function(error) {
                app_hotpot.msg(
                    "Couldn't read annotation in ["+ fh.name +"]. <br>" + 
                    error.name + 
                    ": " + error.message + "",
                    'warning');
                console.error(error);
            }}(fh)
        );
    },

    /////////////////////////////////////////////////////////////////
    // DTD update related
    /////////////////////////////////////////////////////////////////
    // the default colors are from
    // https://colorbrewer2.org/#type=qualitative&scheme=Set3&n=12
    app_colors: [
        '#a6cee3',
        '#1f78b4',
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
                const tag = this.vpp.$data.dtd.tag_dict[tag_name];
                
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
        console.log("* show tag ctx menu on ", x, y);
        var w = this.ctxmenu_sel.width();
        this.ctxmenu_sel.css('left', (x - 10 - w) + 'px')
            .css('top', (y + 10) + 'px')
            .show('drop', {}, 200, null);
    },

    show_nce_ctxmenu: function(x, y) {
        console.log("* show nce ctx menu on ", x, y);
        var w = this.ctxmenu_nce.width();
        this.ctxmenu_nce.css('left', (x - 10 - w) + 'px')
            .css('top', (y + 10) + 'px')
            .show('drop', {}, 200, null);
    },

    show_tag_popmenu: function(x, y) {
        console.log("* show tag pop menu on ", x, y);
        var w = this.popmenu_tag.width();
        this.popmenu_tag.css('left', (x - 10 - w) + 'px')
            .css('top', (y + 10) + 'px')
            .show('drop', {}, 200, null);
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

    del_tag: function(tag_id, ann, is_check_ltag=true, is_update_marks=true) {
        if (typeof(ann) == 'undefined') {
            ann = this.vpp.$data.anns[this.vpp.$data.ann_idx];
        }

        if (is_check_ltag) {
            // when deleting etag, need to check if there is linked ltag
            var linked_ltags = ann_parser.get_linked_ltags(tag_id, ann);

            if (linked_ltags.length == 0) {
                // great! no links!
                // just keep going
            } else {
                // ok, are you sure?
                // let's make a long message
                var msg = ['There are ' + linked_ltags.length + ' link tag(s) related to [' + tag_id + ']:\n'];
                for (let i = 0; i < linked_ltags.length; i++) {
                    const ltag = linked_ltags[i];
                    msg.push('- ' + ltag.id + ' (' + ltag.tag + ') ' + '\n');
                }
                msg.push('\nDeleting [' + tag_id + '] will also delete the above link tag(s).\n');
                msg.push('Are you sure to continue?');
                msg = msg.join('');

                var ret = this.confirm(msg);

                if (ret) {
                    // ok, let's delete the links first
                    for (let i = 0; i < linked_ltags.length; i++) {
                        const ltag = linked_ltags[i];
                        // save some time when running this inner deletion
                        this.del_tag(ltag.id, ann, false, false);
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
        this.vpp.$data.anns[this.vpp.$data.ann_idx]._has_saved = false;
        console.log('* deleted tag ' + tag_id);

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

    update_hint_dict_by_anns: function() {
        if (this.vpp.$data.anns.length == 0) {
            this.vpp.hint_dict = {};
            return;
        }
        var hint_dict = ann_parser.anns2hint_dict(
            this.vpp.$data.dtd, 
            this.vpp.$data.anns
        );
        this.vpp.hint_dict = hint_dict;
        console.log('* updated hint_dict by anns', this.vpp.hint_dict);
    },

    update_hint_dict_by_tag: function(ann, tag) {
        this.vpp.hint_dict = ann_parser.add_tag_to_hint_dict(
            ann, tag, this.vpp.hint_dict
        );
        console.log('* updated hint_dict by a tag', this.vpp.hint_dict, tag);
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

        // add other attr
        for (let i = 0; i < tag_def.attlists.length; i++) {
            const att = tag_def.attlists[i];

            if (att.name == 'spans') {
                // special rule for spans attr
            } else {
                // set the default value
                basic_tag[att.name] = att.default_value;
            }
        }

        return basic_tag;
    },

    make_ltag: function() {

    },

    make_empty_etag_by_tag_def: function(tag_def) {
        var etag = {
            id: '',
            tag: tag_def.name,
            spans: '',
            text: ''
        };

        // then add other attr
        for (let i = 0; i < tag_def.attlists.length; i++) {
            const att = tag_def.attlists[i];

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

    make_empty_ltag_by_tag_def: function(tag_def) {
        var ltag = {
            id: '',
            tag: tag_def.name
        };

        // then add other attr
        for (let i = 0; i < tag_def.attlists.length; i++) {
            const att = tag_def.attlists[i];

            if (att.name == 'spans') {
                // special rule for spans attr
            } else {
                // set the default value
                ltag[att.name] = att.default_value;
            }
        }

        return ltag;
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

    /////////////////////////////////////////////////////////////////
    // Code Mirror Related
    /////////////////////////////////////////////////////////////////
    cm_set_ann: function(ann) {
        // make sure all clear
        // clear all etag markers
        this.cm_clear_etag_marks();

        // clear all link tags
        this.cm_clear_ltag_marks();

        // first, if ann is null, just remove everything in the editor
        if (ann == null) {
            this.codemirror.setValue('');
            return;
        }

        // if the current mode is 
        if (this.vpp.$data.cm.display_mode == 'document') {
            this.codemirror.setValue(
                ann.text
            );

        } else if (this.vpp.$data.cm.display_mode == 'sentences') {
            this.codemirror.setValue(
                ann._sentences_text
            );
        } else {
            this.codemirror.setValue('');
        }
    },

    cm_get_selection: function(inst) {
        if (typeof(inst) == 'undefined') {
            inst = this.codemirror;
        }
        // update the selection
        var selection = {
            sel_txts: inst.getSelections(),
            sel_locs: inst.listSelections()
        };
        this.selection = selection;
        console.log("* found selection:", app_hotpot.selection);
        return selection;
    },

    cm_clear_selection: function(to_anchor=true) {
        var new_anchor = null;
        if (to_anchor) {
            new_anchor = this.selection.sel_locs[0].anchor;
        } else {
            new_anchor = this.selection.sel_locs[0].head;
        }
        this.codemirror.setSelection(new_anchor);
    },

    cm_make_basic_tag_from_selection: function() {
        var locs = [];
        var txts = [];

        // usually there is only one tag
        for (let i = 0; i < app_hotpot.selection.sel_locs.length; i++) {
            var sel_loc = app_hotpot.selection.sel_locs[i];
            var sel_txt = app_hotpot.selection.sel_txts[i];
            locs.push(
                app_hotpot.cm_range2spans(
                    sel_loc, 
                    this.vpp.$data.anns[this.vpp.$data.ann_idx]
                )
            );
            txts.push(sel_txt);
        }
        
        // now push new ann tag
        var tag = {
            'spans': locs.join(','),
            'text': txts.join(' ... ')
        };

        return tag;
    },

    cm_update_marks: function() {
        // clear all etag markers
        this.cm_clear_etag_marks();

        // clear all link tags
        this.cm_clear_ltag_marks();

        // update the hint marks
        this.cm_update_hint_marks();

        // update the tag marks
        this.cm_update_tag_marks();

        // force update UI, well ... maybe not work
        this.vpp.$forceUpdate();
    },

    cm_clear_etag_marks: function() {
        var marks = this.codemirror.getAllMarks();
        for (let i = marks.length - 1; i >= 0; i--) {
            marks[i].clear();
        }
    },

    cm_clear_ltag_marks: function() {
        // first, check if there is a layer for the plots
        if ($('#cm_svg_plots').length == 0) {
            $('.CodeMirror-sizer').prepend(`
            <div class="CodeMirror-plots">
            <svg id="cm_svg_plots">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth="6" markerHeight="6"
                        orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                </defs>
            </svg>
            </div>
        `);
        } else {
            $('#cm_svg_plots').html(`
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth="6" markerHeight="6"
                        orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                </defs>
            `);
        }
    },

    cm_update_hint_marks: function() {
        if (this.vpp.$data.ann_idx == null) {
            // nothing to do for empty
            return;
        }

        if (!this.vpp.$data.cm.enabled_hints ||
            this.vpp.$data.cm.hint_mode == 'off') {
            // nothing to do when turn off hint
            return;
        }

        if (this.vpp.$data.dtd == null) {
            // nothing to do if no dtd given
            return;
        }

        // find markable hints for this ann
        var hints = ann_parser.search_hints_in_ann(
            this.vpp.hint_dict,
            this.vpp.$data.anns[this.vpp.$data.ann_idx]
        );
        console.log('* found hints', hints);

        // bind the hints to vpp
        this.vpp.$data.hints = hints;

        for (let i = 0; i < hints.length; i++) {
            const hint = hints[i];
            this.cm_mark_hint_in_text(
                hint,
                this.vpp.$data.anns[this.vpp.$data.ann_idx]
            );
        }
    },

    cm_update_tag_marks: function() {
        if (this.vpp.$data.ann_idx == null) {
            // nothing to do for empty
            return;
        }

        // to ensure the link tag could be draw correctly,
        // draw the etags first
        this.cm_update_etag_marks();

        // since all etags have been rendered,
        // it's safe to render the link tags
        this.cm_update_ltag_marks();
    },

    cm_update_etag_marks: function() {
        if (this.vpp.$data.ann_idx == null) {
            // nothing to do for empty
            return;
        }
        // update the new marks
        var working_ann = this.vpp.$data.anns[this.vpp.$data.ann_idx];
        for (let i = 0; i < working_ann.tags.length; i++) {
            var tag = working_ann.tags[i];
            var tag_def = this.vpp.get_tag_def(tag.tag);
            if (tag_def.type == 'etag') {
                this.cm_mark_ann_etag_in_text(tag, tag_def, working_ann);
            }
        }
    },

    cm_update_ltag_marks: function() {
        if (this.vpp.$data.ann_idx == null) {
            // nothing to do for empty
            return;
        }
        if (this.vpp.$data.cm.enabled_links) {
            // ok! show links
        } else {
            // well, if user doesn't want to show links,
            // it's ok
            return;
        }
        // update the new marks
        var working_ann = this.vpp.$data.anns[this.vpp.$data.ann_idx];
        for (let i = 0; i < working_ann.tags.length; i++) {
            var tag = working_ann.tags[i];
            var tag_def = this.vpp.get_tag_def(tag.tag);
            if (tag_def.type == 'ltag') {
                this.cm_mark_ann_ltag_in_text(tag, tag_def, working_ann);
            }
        }
    },

    /**
     * Mark the hint in the code mirror
     * @param {object} hint it contains the range for rendering
     */
    cm_mark_hint_in_text: function(hint, ann) {
        var range = this.cm_spans2range(hint.spans, ann);
        // console.log("* marking hint", hint, 'on', range);
        
        if (this.vpp.$data.cm.mark_mode == 'node') {
            var hint_tag_id_prefix = dtd_parser.get_id_prefix(
                hint.tag, 
                this.vpp.$data.dtd
            );
            var markHTML = [
                '<span class="mark-hint mark-hint-'+hint.tag+'" id="mark-id-'+hint.id+'" onclick="app_hotpot.vpp.add_tag_by_hint(\''+hint.id+'\')" title="Click to add this to tags">',
                '<span class="mark-hint-info mark-tag-'+hint.tag+'">',
                    hint_tag_id_prefix,
                '</span>',
                '<span class="mark-hint-text" hint_id="'+hint.id+'">',
                    hint.text,
                '</span>',
                '<span class="mark-hint-tooltip">',
                    hint.tag,
                '</span>',
                '</span>'
            ].join('');

            // convert this HTML to DOMElement
            var placeholder = document.createElement('div');
            placeholder.innerHTML = markHTML;
            var markNode = placeholder.firstElementChild;

            this.codemirror.markText(
                range.anchor,
                range.head,
                {
                    className: 'mark-hint mark-hint-' + hint.tag,
                    replacedWith: markNode,
                    attributes: {
                        hint_id: hint.id
                    }
                }
            );
        } else if (this.vpp.$data.cm.mark_mode == 'span') {
            this.codemirror.markText(
                range.anchor,
                range.head,
                {
                    className: 'mark-hint mark-hint-' + hint.tag,
                    attributes: {
                        hint_id: hint.id,
                        onclick: 'app_hotpot.vpp.add_tag_by_hint(\''+hint.id+'\')'
                    }
                }
            );
        }
    },

    cm_mark_ann_tag_in_text: function(tag, tag_def, ann) {
        if (tag_def.type == 'etag') {
            this.cm_mark_ann_etag_in_text(tag, tag_def, ann);
        } else {
            this.cm_mark_ann_ltag_in_text(tag, tag_def, ann);
        }
    },

    cm_mark_ann_ltag_in_text: function(tag, tag_def, ann) {
        this.cm_draw_ltag(tag, tag_def, ann);
    },

    cm_mark_ann_etag_in_text: function(tag, tag_def, ann) {
        var raw_spans = tag['spans'];
        if (raw_spans == '' || raw_spans == null) { 
            return [-1]; 
        }

        // the spans may contains multiple parts
        // split them first
        var spans_arr = raw_spans.split(',');
        var text_arr = tag.text.split('...');
        
        for (let i = 0; i < spans_arr.length; i++) {
            const spans = spans_arr[i];
            const spans_text = text_arr[i];
            var range = this.cm_spans2range(spans, ann);

            if (this.vpp.$data.cm.mark_mode == 'node') {
                // the second step is to enhance the mark tag with more info
                var markHTML = [
                    '<span class="mark-tag mark-tag-'+tag.tag+'" id="mark-etag-id-'+tag.id+'">',
                    '<span onclick="app_hotpot.vpp.on_click_tag(event, \''+tag.id+'\')">',
                    '<span class="mark-tag-info">',
                        '<span class="mark-tag-info-inline fg-tag-'+tag.tag+'">',
                        tag.id,
                        '</span>',
                    '</span>',
                    '<span class="mark-tag-text" tag_id="'+tag.id+'">',
                        spans_text,
                    '</span>',
                    '</span>',
                    '<span class="mark-tag-info-offset" title="Delete tag '+tag.id+'" onclick="app_hotpot.del_tag(\''+tag.id+'\');">',
                        '<i class="fa fa-times-circle"></i>',
                    '</span>',
                    '</span>'
                ].join('');

                // convert this HTML to DOMElement
                var placeholder = document.createElement('div');
                placeholder.innerHTML = markHTML;
                var markNode = placeholder.firstElementChild;

                // add mark to text
                this.codemirror.markText(
                    range.anchor,
                    range.head,
                    {
                        className: 'mark-tag mark-tag-' + tag.tag,
                        replacedWith: markNode,
                        attributes: {
                            tag_id: tag.id,
                            onclick: ''
                        }
                    }
                );

            } else if (this.vpp.$data.cm.mark_mode == 'span') {
                this.codemirror.markText(
                    range.anchor,
                    range.head,
                    {
                        className: 'mark-tag mark-tag-' + tag.tag,
                        attributes: {
                            id: 'mark-etag-id-' + tag.id,
                            tag_id: tag.id,
                            onclick: 'app_hotpot.vpp.on_click_tag(event, \''+tag.id+'\')'
                        }
                    }
                );
            }
        }

    },

    cm_jump2tag: function(tag, ann) {
        // first, get the anchor location
        var range = this.cm_spans2range(
            tag.spans, ann
        );

        // set the anchor
        this.codemirror.doc.setCursor(
            range.anchor
        );
    },

    cm_spans2range: function(spans, ann) {
        // if the current mode is 
        if (this.vpp.$data.cm.display_mode == 'document') {
            return this.cm_doc_spans2range(spans, ann);

        } else if (this.vpp.$data.cm.display_mode == 'sentences') {
            return this.cm_sen_spans2range(spans, ann);

        } else {
            return this.cm_doc_spans2range(spans, ann);
        }
    },

    cm_range2spans: function(spans, ann) {
        // if the current mode is 
        if (this.vpp.$data.cm.display_mode == 'document') {
            return this.cm_doc_range2spans(spans, ann);

        } else if (this.vpp.$data.cm.display_mode == 'sentences') {
            return this.cm_sen_range2spans(spans, ann);

        } else {
            return this.cm_doc_range2spans(spans, ann);
        }
    },

    cm_sen_range2spans: function(sel_loc, ann) {
        var span0 = 0;

        // first, get the start span of this line
        var line_span0 = ann._sentences[
            sel_loc.anchor.line
        ].spans.start;
        var line_span1 = ann._sentences[
            sel_loc.head.line
        ].spans.start;

        // then move to the span of this line
        span0 = line_span0 + sel_loc.anchor.ch;
        span1 = line_span1 + sel_loc.head.ch;

        // the selection maybe from different direction
        if (span0 <= span1) {
            return span0 + '~' + span1;
        } else {
            return span1 + '~' + span0;
        }
    },

    cm_sen_spans2range: function(spans, ann) {
        var span_pos_0 = parseInt(spans.split('~')[0]);
        var span_pos_1 = parseInt(spans.split('~')[1]);

        // find the line number of span0
        var anchor = nlp_toolkit.find_linech(span_pos_0, ann._sentences);
        var head = nlp_toolkit.find_linech(span_pos_1, ann._sentences);

        return {
            anchor: anchor,
            head: head
        }
    },

    cm_doc_range2spans: function(sel_loc, ann) {
        var full_text = ann.text;
        // console.log('* calc doc range2spans: ');
        // console.log(sel_loc);
        var lines = full_text.split('\n');
        var span0 = 0;
        for (let i = 0; i < sel_loc.anchor.line; i++) {
            span0 += lines[i].length + 1;
        }
        span0 += sel_loc.anchor.ch;
        var span1 = 0;
        for (let i = 0; i < sel_loc.head.line; i++) {
            span1 += lines[i].length + 1;
        }
        span1 += sel_loc.head.ch;
        // console.log('* span0: ' + span0 + ', span1: ' + span1);

        if (span0 <= span1) {
            return span0 + '~' + span1;
        } else {
            return span1 + '~' + span0;
        }
    },

    cm_doc_spans2range: function(spans, ann) {
        var full_text = ann.text;

        // console.log('* calc doc spans2range: ');
        var span_pos_0 = parseInt(spans.split('~')[0]);
        var span_pos_1 = parseInt(spans.split('~')[1]);

        // calculate the line number
        var ln0 = full_text.substring(0, span_pos_0).split('\n').length - 1;
        var ln1 = full_text.substring(0, span_pos_1).split('\n').length - 1;

        // calculate the char location
        var ch0 = span_pos_0;
        for (let i = 1; i < span_pos_0; i++) {
            if (full_text[span_pos_0 - i] == '\n') {
                ch0 = i - 1;
                break;
            }
        }

        // TODO fix the potential cross lines bug
        var ch1 = ch0 + (span_pos_1 - span_pos_0);

        // return [ [ln0, ch0], [ln1, ch1] ];
        return {
            anchor: {line: ln0, ch: ch0},
            head:   {line: ln1, ch: ch1}
        }
    },

    cm_spans2coords: function(spans, ann) {
        var range = this.cm_spans2range(spans, ann);

        var coords_l = this.codemirror.charCoords(
            // { line: range[0][0], ch: range[0][1] },
            range.anchor,
            'local'
        );
        var coords_r = this.codemirror.charCoords(
            // { line: range[1][0], ch: range[1][1] },
            range.head,
            'local'
        );

        return { 
            l: coords_l, 
            r: coords_r 
        };
    },

    scroll_annlist_to_bottom: function() {
        var objDiv = document.getElementById("mui_annlist");
        objDiv.scrollTop = objDiv.scrollHeight;
    },

    cm_draw_ltag: function(ltag, ltag_def, ann) {
        // for showing the ltag, we need:
        // 1. the atts for accessing the ltag
        // 2. the values of att_a and att_b, which are tag_id for etag
        // 3. get the tag, then call cm_draw_polyline

        // so, get all attlists
        var atts = this.vpp.get_idref_attlists(ltag_def);

        // next, get the values fron this ltag
        var etags = [];
        for (let i = 0; i < atts.length; i++) {
            var att = atts[i];
            var etag_id = ltag[att.name];

            if (typeof(etag_id) == 'undefined' || 
                etag_id == null || 
                etag_id == '') {
                // this att is just empty
                continue;
            }

            // check this etag
            var etag = this.vpp.get_tag_by_tag_id(etag_id, ann);
            if (etag == null) { 
                continue; 
            }
            if (etag.spans == dtd_parser.NON_CONSUMING_SPANS) {
                continue;
            }

            // ok, save this etag for later use
            etags.push(etag);
        }
        // then, check if there are more than two etags
        console.log('* found ' + etags.length + ' etags available for this link');

        // first, draw dots
        for (let i = 0; i < etags.length; i++) {
            const etag = etags[i];
            this.cm_draw_linkdot(ltag, etag, ann);
        }

        if (!this.vpp.$data.cm.enabled_link_complex) {
            return;
        }

        // second, draw polyline
        if (etags.length < 2) {
            // which means not enough etag for drawing line
            return;
        }
        var tag_a = etags[0];
        var tag_b = etags[1];

        console.log(
            '* try to draw line ['+ltag.id+'] between', 
            '['+tag_a.id+']-', 
            '['+tag_a.id+']'
        );

        // last, draw!
        this.cm_draw_polyline(
            ltag, tag_a, tag_b, ann
        );
    },

    // cm_draw_ltag_first_two: function(ltag, ltag_def, ann) {
    //     // for showing the polyline, we need:
    //     // 1. the att_a and att_b for accessing the ltag
    //     // 2. the values of att_a and att_b, which are tag_id for etag
    //     // 3. get the tag, then call cm_draw_polyline

    //     // so, get the att_a and att_b first
    //     var att_a = this.vpp.get_idref_attlist_by_seq(ltag_def, 0);
    //     var att_b = this.vpp.get_idref_attlist_by_seq(ltag_def, 1);

    //     // next, get the values
    //     var etag_a_id = ltag[att_a.name];
    //     var etag_b_id = ltag[att_b.name];
    //     // console.log(
    //     //     '* try to draw line ['+ltag.id+'] between', 
    //     //     att_a.name, '['+etag_a_id+']-', 
    //     //     att_b.name, '['+etag_b_id+']'
    //     // );

    //     // if the value is null or empty, just skip
    //     if (etag_a_id == null || etag_a_id == '') { return; }
    //     if (etag_b_id == null || etag_b_id == '') { return; }

    //     // convert the tag_id to tag
    //     var tag_a = this.vpp.get_tag_by_tag_id(etag_a_id, ann);
    //     var tag_b = this.vpp.get_tag_by_tag_id(etag_b_id, ann);

    //     // if the tag is not available, just skip
    //     if (tag_a == null || tag_b == null) { return; }

    //     // if one of the tags is non-consuming tag, just skip
    //     if (tag_a.spans == dtd_parser.NON_CONSUMING_SPANS ||
    //         tag_b.spans == dtd_parser.NON_CONSUMING_SPANS) {
    //         return;
    //     }

    //     // last, draw!
    //     this.cm_draw_polyline(
    //         ltag, tag_a, tag_b, ann
    //     );
    // },

    cm_draw_linkdot: function(ltag, tag, ann) {
        // then get the coords
        var coords = this.cm_spans2coords(tag.spans, ann);

        var x = coords.l.left;
        var y = coords.l.top + 2;

        // find existing linkdot on this tag if there is
        var linkdots = $('#cm_svg_plots .tag-linkdot-' + tag.id);

        // add offset to x
        for (let i = 0; i < linkdots.length; i++) {
            const elem = linkdots[i];
            var shape = this.get_elem_shape(elem);
            x += shape.width + 1;
        }

        // make a text
        var svg_text = document.createElementNS(
            'http://www.w3.org/2000/svg', 'text'
        );
        svg_text.setAttribute('id', 'mark-link-dot-id-' + ltag.id + '-' + tag.id);
        svg_text.setAttribute('text-anchor', 'left');
        svg_text.setAttribute('alignment-baseline', 'middle');
        svg_text.setAttribute('x', x);
        svg_text.setAttribute('y', y);
        svg_text.setAttribute('class', "tag-linkdot border-tag-" + tag.tag + " tag-linkdot-" + tag.id);

        // put the text
        var text_node_content = " ";
        if (this.vpp.$data.cm.enabled_link_name) {
            text_node_content = " " + ltag.id;
        }
        svg_text.append(document.createTextNode(text_node_content));

        $('#cm_svg_plots').append(
            svg_text
        );

        // this.make_svg_text_bg(svg_text, 'svgmark-tag-' + ltag.tag);
    },

    cm_draw_polyline: function(ltag, tag_a, tag_b, ann) {
        // then get the coords of both tags
        var coords_a = this.cm_spans2coords(tag_a.spans, ann);
        var coords_b = this.cm_spans2coords(tag_b.spans, ann);

        // the setting for the polyline
        var delta_height = 2;
        var delta_width = 0;

        // get the upper coords, which is the lower one
        var upper_top = coords_a.l.top < coords_b.l.top ? 
            coords_a.l.top : coords_b.l.top;
        upper_top = upper_top - delta_height;

        // get the sign for relative location
        var sign = coords_b.l.left - coords_a.l.left > 0 ? 1 : -1;

        // then calc the points for the polyline
        var xys = [
            // point, start
            [
                (coords_a.l.left + coords_a.r.left)/2,
                (coords_a.l.top + 4)
            ],
            // point joint 1
            [
                (coords_a.l.left + coords_a.r.left)/2 + sign * delta_width,
                upper_top
            ],
            // point, joint 2
            [
                ((coords_b.l.left + coords_b.r.left)/2 - sign * delta_width),
                upper_top
            ],
            // point, end
            [
                (coords_b.l.left + coords_b.r.left)/2,
                (coords_b.l.top + 3)
            ]
        ];

        // put all points togather
        var points = [];
        for (let i = 0; i < xys.length; i++) {
            const xy = xys[i];
            // convert to int for better display
            var x = Math.floor(xy[0]);
            var y = Math.floor(xy[1]);
            points.push(x + ',' + y);
        }

        // convert to a string
        points = points.join(' ');

        // create a poly line and add to svg
        // Thanks to the post!
        // https://stackoverflow.com/questions/15980648/jquery-added-svg-elements-do-not-show-up
        var svg_polyline = document.createElementNS(
            'http://www.w3.org/2000/svg', 'polyline'
        );
        svg_polyline.setAttribute('id', 'mark-link-line-id-' + ltag.id);
        svg_polyline.setAttribute('points', points);
        svg_polyline.setAttribute('class', "tag-polyline");
        // svg_polyline.setAttribute('marker-end', "url(#arrow)");

        $('#cm_svg_plots').append(
            svg_polyline
        );

        // NEXT, draw a text
        var svg_text = document.createElementNS(
            'http://www.w3.org/2000/svg', 'text'
        );
        svg_text.setAttribute('id', 'mark-link-text-id-' + ltag.id);
        svg_text.setAttribute('text-anchor', 'middle');
        svg_text.setAttribute('alignment-baseline', 'middle');
        svg_text.setAttribute('x', (xys[0][0] + xys[3][0]) / 2);
        svg_text.setAttribute('y', xys[1][1] + delta_height);
        svg_text.setAttribute('class', "tag-linktext");

        // put the text
        var text_node_content = ltag.id;
        // if (this.vpp.$data.cm.enabled_link_name) {
        //     text_node_content = ltag.tag + ': ' + ltag.id;
        // }
        svg_text.append(document.createTextNode(text_node_content));

        $('#cm_svg_plots').append(
            svg_text
        );

        // then create a background color
        this.make_svg_text_bg(svg_text, 'svgmark-tag-' + ltag.tag);
    },

    cm_calc_points: function(coords_a, coords_b) {

    },
    
    /////////////////////////////////////////////////////////////////
    // Utils
    /////////////////////////////////////////////////////////////////
    is_file_ext: function(filename, ext) {
        var fn_lower = filename.toLocaleLowerCase();

        if (fn_lower.endsWith("." + ext)) {
            return true;
        }

        return false;
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

    start_tour_annotation: function() {
        if (this.tour.annotation == null) {
            this.tour.annotation = new Shepherd.Tour({
                defaultStepOptions: {
                    classes: '',
                    scrollTo: true
                }
            });

            // add step for dtd
            this.tour.annotation.addStep({
                id: 'example-step',
                text: 'Welcome! 🎉 🎉 🎉  This tool is very easy to use!<br>First, we could drop a schema (.dtd) file here.<br>The schema file defines all of the concepts you want to annotate in the documents.',
                attachTo: {
                  element: '#dropzone_dtd',
                  on: 'right'
                },
                classes: '',
                buttons: [{
                    text: 'Close',
                    classes: 'bg-gray', 
                    action: this.tour.annotation.complete
                }, {
                    text: 'Next <i class="fa fa-arrow-right"></i>',
                    action: this.tour.annotation.next
                }]
            });

            // add step for text
            this.tour.annotation.addStep({
                id: 'example-step',
                text: 'Second, you need to drop some annotation files here.<br>You could drop raw text files (.txt) to start and add more anytime. Our tool will automatically convert the text files to xml format when saving. Then, next time you could drop those saved xml files here directly.',
                attachTo: {
                  element: '#dropzone_ann',
                  on: 'right'
                },
                classes: '',
                buttons: [{
                    text: 'Close',
                    classes: 'bg-gray', 
                    action: this.tour.annotation.complete
                }, {
                    text: '<i class="fa fa-arrow-left"></i> Prev',
                    action: this.tour.annotation.back
                }, {
                    text: 'Next <i class="fa fa-arrow-right"></i>',
                    action: this.tour.annotation.next
                }]
            });

            // add step for text
            this.tour.annotation.addStep({
                id: 'example-step',
                text: 'That\'s all to start a new annotation task!<br>If you are not sure what each button does, here is a sample dataset for you to try. You could play with this sample data freely to see how each function works for annotation.<br>Have fun! 😁',
                attachTo: {
                  element: '#btn_annotation_load_sample',
                  on: 'left'
                },
                classes: '',
                buttons: [{
                    text: '<i class="fa fa-arrow-left"></i> Prev',
                    action: this.tour.annotation.back
                }, {
                    text: 'Close',
                    classes: 'bg-gray', 
                    action: this.tour.annotation.complete
                }]
            });
        }

        this.tour.annotation.start();
    }
};