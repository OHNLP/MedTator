/**
 * This is an extension for IAA calculator 
 */

/////////////////////////////////////////////////////////////////
// IAA related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {
    // for iaa
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

    // sort anns
    // - default: how the anns are imported into tool
    // - a.alphabet: A-Z
    // - a.alphabet_r: Z-A
    // - a.tags: 0-N
    // - a.tags_r: N-0
    iaa_sort_anns_by: 'default',

    // for iaa adjudication
    iaa_gs_dict: null,

    // for using attributes in IAA
    iaa_use_attributes: false,

    // remove the tag when low_overlap for calcuting
    // this can remove the duplicated results in FN
    // so the IAA calculation result will be different
    // the 
    iaa_remove_tag_b_when_low_overlap: true,

    // for using attributes in IAA a selection map
    // {
    //    tag_name: {
    //        attr_name: true / false
    //    }
    // }
    iaa_use_tag_attrs: {},

    // for IAA display mode, show F1 or other indicators
    iaa_display_measure: 'f1',
});


/////////////////////////////////////////////////////////////////
// IAA related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot, {
    // events for loading ann files for IAA
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

                                        // the the call back
                                        p_ann.then((function(iaa_id) {
                                            return function(ann) {
                                                // add the sentences
                                                var r = nlp_toolkit.sent_tokenize(
                                                    ann.text,
                                                    app_hotpot.vpp.$data.cfg.sentence_splitting_algorithm
                                                );
                                                ann._sentences = r.sentences;
                                                ann._sentences_text = r.sentences_text;

                                                // add this ann to iaa list
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
    
});

Object.assign(app_hotpot.vpp_methods, {
    clear_iaa_all: function(which) {
        if (typeof(which) == 'undefined') {
            which = null;
        }
        // clear everything related to iaa
        if (which == null || which == 0) {
            // just clear a
            this.iaa_ann_list[0].anns = [];
        }
        if (which == null || which == 1) {
            // just clear b
            this.iaa_ann_list[1].anns = [];
        }

        this.iaa_dict = null;
        this.iaa_gs_dict = null;

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
            this.iaa_overlap_ratio / 100,
            this.iaa_use_attributes?
                this.iaa_use_tag_attrs:
                null,
            this.iaa_remove_tag_b_when_low_overlap
        );
        this.iaa_dict = iaa_dict;
        console.log('* iaa result:', iaa_dict);

        // and create
        this.make_iaa_gs_dict();
    },

    iaa_sort_filelist_by: function(sort_by) {
        this.iaa_sort_anns_by = sort_by;
    },

    iaa_get_sort_by: function() {
        if (this.hasOwnProperty('iaa_sort_anns_by')) {
            return this.iaa_sort_anns_by;
        } else {
            return 'default';
        }
    },
    
    iaa_get_sort_by_label: function(sort_by) {
        return {
            'default': 'Sort',
            'label': 'Label',
            'f1_asc': 'F1 0-1',
            'f1_desc': 'F1 1-0',

            // for A
            'a.alphabet': 'A|A-Z',
            'a.alphabet_r': 'A|Z-A',

            // for B
            'b.alphabet': 'B|A-Z',
            'b.alphabet_r': 'B|Z-A',
        }[sort_by];
    },

    iaa_sort_v_anns: function(iaa_dict) {
        var sort_by = this.iaa_get_sort_by();

        // a virtual list of ann, just contain the file name
        // this is prepared for sorting only
        // because the sort is an in-place sort
        // we can't modify the order in the original anns
        var v_anns = [];
        for (const ann_hashcode in iaa_dict.ann) {
            const ann_rst = iaa_dict.ann[ann_hashcode];
            v_anns.push({
                // hashtag
                ann_hashcode: ann_hashcode,

                // the f1
                f1: this.iaa_display_tag_name == '__all__'? 
                    ann_rst.rst.all.f1 : ann_rst.rst.tag[this.iaa_display_tag_name].f1,

                // number of annotated tags
                ann_a: {
                    _filename: ann_rst.anns[0]._filename
                },
                ann_b: {
                    _filename: ann_rst.anns[1]._filename
                }
            });
        }

        // now sort
        if (sort_by == 'default') {
            return v_anns;

        } else if (sort_by == 'f1_asc') {
            console.log('* sorting f1_asc', isNaN(0));
            v_anns.sort(function(a, b) {
                var v = (isNaN(a.f1)?0:a.f1) - (isNaN(b.f1)?0:b.f1);
                return v;
            });
            return v_anns;

        } else if (sort_by == 'f1_desc') {
            console.log('* sorting f1_desc', isNaN(NaN));
            v_anns.sort(function(a, b) {
                var v = (isNaN(b.f1)?0:b.f1) - (isNaN(a.f1)?0:a.f1);
                return v;
            });
            return v_anns;

        } else if (sort_by == 'a.alphabet') {
            v_anns.sort(function(a, b) {
                return a.ann_a._filename.localeCompare(
                    b.ann_a._filename
                )
            });
            return v_anns;

        } else if (sort_by == 'a.alphabet_r') {
            v_anns.sort(function(a, b) {
                return -a.ann_a._filename.localeCompare(
                    b.ann_a._filename
                )
            });
            return v_anns;
            
        } else if (sort_by == 'b.alphabet') {
            v_anns.sort(function(a, b) {
                return a.ann_b._filename.localeCompare(
                    b.ann_b._filename
                )
            });
            return v_anns;

        } else if (sort_by == 'b.alphabet_r') {
            v_anns.sort(function(a, b) {
                return -a.ann_b._filename.localeCompare(
                    b.ann_b._filename
                )
            });
            return v_anns;
            
        } else {
            return v_anns;
        }
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

    on_change_iaa_use_attributes: function(event) {
        console.log('* changed iaa_use_attributes=', this.iaa_use_attributes);

        // update the settings of iaa_use_tag_attrs
        if (this.dtd == null) {
            return;
        }

        if (Object.keys(this.iaa_use_tag_attrs).length != 0) {
            // which means this has been inited
            return;
        }

        this.init_iaa_use_tag_attrs();
    },

    init_iaa_use_tag_attrs: function() {
        // update the values
        for (const tag_name in this.dtd.tag_dict) {
            if (Object.hasOwnProperty.call(this.dtd.tag_dict, tag_name)) {
                const tag = this.dtd.tag_dict[tag_name];
                this.iaa_use_tag_attrs[tag_name] = {};

                // update all the attributes
                for (let i = 0; i < tag.attrs.length; i++) {
                    const att = tag.attrs[i];
                    // set all to true
                    this.iaa_use_tag_attrs[tag_name][att.name] = true;
                }
            }
        }
    },

    set_iaa_display_measure: function(m) {
        this.iaa_display_measure = m;
    },

    set_all_iaa_use_tag_attrs: function(selection) {
        for (const tag_name in this.iaa_use_tag_attrs) {
            if (Object.hasOwnProperty.call(this.iaa_use_tag_attrs, tag_name)) {
                const tag_attrs = this.iaa_use_tag_attrs[tag_name];
                for (const att_name in tag_attrs) {
                    if (Object.hasOwnProperty.call(tag_attrs, att_name)) {
                        this.iaa_use_tag_attrs[tag_name][att_name] = selection;
                    }
                }
            }
        }

        // due to deep update, need to update manually
        this.$forceUpdate();
    },

    toggle_iaa_tag_attrs: function(tag_name, att_name) {
        if (this.iaa_use_tag_attrs.hasOwnProperty(tag_name)) {
            if (this.iaa_use_tag_attrs[tag_name].hasOwnProperty(att_name)) {
                this.iaa_use_tag_attrs[tag_name][att_name] = 
                    !this.iaa_use_tag_attrs[tag_name][att_name];
            }
        }
        // console.log('* set iaa_use_tag_attrs['+tag_name+']['+att_name+']='+this.iaa_use_tag_attrs[tag_name][att_name]);

        // due to deep update, need to update manually
        this.$forceUpdate();
    },

    transfer_to_annotation_tab: function() {
        // confirm first if there are annotations
        var len = app_hotpot.vpp.$data.anns.length;
        if (len > 0) {
            var msg = 'There are ' + len + ' documents in your annotation tab. Editing adjudication copy needs to remove those documents. Are you sure to continue?';
            var ret = app_hotpot.confirm(msg);
            if (ret) {

            } else {
                // ok, let's stop
                return;
            }
        }

        // check iaa_gs_dict status
        if (this.iaa_gs_dict == null) {
            // OK, nothing to do with an empty iaa_gs_dict

            // maybe say something?
            app_hotpot.msg('Adjudication copy is not found', 'warning');
            return;
        }

        // convert the current gs dict
        var gs_list = Object.values(
            this.iaa_gs_dict
        );

        // then create ann list for update
        var anns = [];

        // check each item in this iaa_gs
        for (let i = 0; i < gs_list.length; i++) {
            const gs = gs_list[i];

            // create a new ann
            var ann = gs.ann;

            // copy the rst of initial 
            for (const tag_name in gs.rst) {
                if (Object.hasOwnProperty.call(gs.rst, tag_name)) {
                    const r = gs.rst[tag_name];
                    // check each cm, fn, fp, and tp
                    for (const cm in r) {
                        if (Object.hasOwnProperty.call(r, cm)) {
                            const ds = r[cm];
                            for (let j = 0; j < ds.length; j++) {
                                const d = ds[j];

                                // it's possible that this decision have been removed
                                if (d == null) {
                                    continue;
                                }
                                // there are two attributes:
                                // from: a or b
                                // tag: the tag itself
                                // copy a new one
                                var tag = JSON.parse(JSON.stringify(d.tag));

                                // then need to update the id?
                                var etag_def = this.get_tag_def(tag_name);
                                if (etag_def == null) {
                                    // what????
                                } else {
                                    var new_tag_id = ann_parser.get_next_tag_id(
                                        ann,
                                        etag_def
                                    );
                                    tag.id = new_tag_id;
                                }

                                // update the tag info for annotator
                                if (cm == 'tp') {
                                    // which means this tag is agreed by both
                                    tag._annotator = 'AB';
                                } else {
                                    // which means this tag is added by A or B
                                    // or they don't have an agreement
                                    tag._annotator = d.from;
                                }

                                // save this tag
                                ann.tags.push(tag);
                            }
                        }
                    }
                }
            }
            
            anns.push(ann);
        }

        // replace 
        this.set_ann_idx(null);
        this.anns = [];

        // set to span tag mode
        this.cm.mark_mode = 'span';

        // bind the ann
        this.anns = anns;

        // update the UI
        this.ann_idx = 0;

        // switch to ann tab
        this.switch_mui('annotation');
    },

    make_iaa_gs_dict: function() {
        this.iaa_gs_dict = iaa_calculator.get_default_gs_dict(
            this.dtd, this.iaa_dict
        );
    },

    download_gs_file: function(hashcode) {
        // get this gs
        const ann_rst = this.iaa_gs_dict[hashcode];
        
        // change to an ann obj
        var ann = iaa_calculator.make_ann_by_rst(
            ann_rst, 
            this.dtd
        );

        // get the xmlText
        var xml_doc = ann_parser.ann2xml(ann, this.dtd);
        var xml_text = ann_parser.xml2str(xml_doc);

        // download this xml
        var blob = new Blob([xml_text], {type: "text/xml;charset=utf-8"});
        var fn = ann_rst.ann._filename;
        saveAs(blob, fn);            
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
                var ann = iaa_calculator.make_ann_by_rst(
                    ann_rst, 
                    this.dtd
                );

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
            saveAs(
                content, 
                app_hotpot.vpp.get_new_xmls_zipfile_folder_name() + 
                '-' +
                app_hotpot.vpp.get_date_now() + 
                '.zip'
            );
        });
    },

    download_all_iaa_anns: function() {
        // create an empty zip pack
        var zip = new JSZip();
        var folder_name = this.get_gs_zipfile_folder_name() + '_ALL';

        // add files to zip pack
        for (const hashcode in this.iaa_gs_dict) {
            if (Object.hasOwnProperty.call(this.iaa_gs_dict, hashcode)) {
                const ann_rst = this.iaa_gs_dict[hashcode];
                const ann_iaa = this.iaa_dict.ann[hashcode];
                
                // change to an ann obj
                var ann = iaa_calculator.make_ann_by_iaa(
                    ann_rst, 
                    ann_iaa,
                    this.dtd
                );

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
            saveAs(
                content, 
                app_hotpot.vpp.get_new_xmls_zipfile_folder_name() + 
                '-' +
                app_hotpot.vpp.get_date_now() + 
                '-ALL.zip'
            );
        });
    },

    export_iaa_report: function() {
        
        // // Acquire Data (reference to the HTML table)
        // var table_elt = document.getElementById("table_cohen_kappa_confusion_matrix");

        // // Extract Data (create a workbook object from the table)
        // var workbook = XLSX.utils.table_to_book(table_elt);

        // // Process Data (add a new row)
        // var ws_cohen = workbook.Sheets["Sheet1"];

        // create each sheet
        // sheet 1. the summary
        // var ws_summary = XLSX.utils.json_to_sheet([{'a':1}]);
        var ws_summary = iaa_calculator.get_iaa_report_summary_excelws(
            this.iaa_dict,
            this.dtd
        );

        // sheet 1.1 the cohen's kappa
        var ws_cohen = iaa_calculator.get_iaa_report_cohen_kappa_excelws(
            this.iaa_dict,
            this.dtd
        );

        // sheet 2. the files
        // var ws_files = XLSX.utils.json_to_sheet([{'a':1}]);
        var ws_files = iaa_calculator.get_iaa_report_files_excelws(
            this.iaa_dict,
            this.dtd
        );

        // sheet 3. the tags
        // var ws_tags = XLSX.utils.json_to_sheet([{'a':1}]);
        var ws_tags = iaa_calculator.get_iaa_report_tags_excelws(
            this.iaa_dict,
            this.dtd
        );

        // sheet 4. the adjudication
        var ws_adj = iaa_calculator.get_iaa_report_adjudication_excelws(
            this.iaa_dict,
            this.dtd
        );

        // create wb for download
        var wb = {
            SheetNames: [
                "F1-Score",
                "Cohen Kappa",
                "Files",
                "Tags",
                "Adjudication"
            ],
            Sheets: {
                "F1-Score": ws_summary,
                "Cohen Kappa": ws_cohen,
                Files: ws_files,
                Tags: ws_tags,
                Adjudication: ws_adj
            }
        };
        console.log(wb);

        // decide the file name for this export
        var fn = this.dtd.name + '-iaa-report.xlsx';

        // download this wb
        XLSX.writeFile(wb, fn);
    },

    get_gs_zipfile_folder_name: function() {
        return this.dtd.name + '-goldstandards';
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
                {'A':0, 'B':1}[from]
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
});