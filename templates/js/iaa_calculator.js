var iaa_calculator = {
    colors: {
        decision_agreed: '94d2bd',
        decision_disagreed: 'f4978e',
        annotator_a_tag: 'd9e9f1',
        annotator_b_tag: 'd8f7d6',
    },

    default_overlap_ratio: 0.1,
    
    make_ann_by_rst: function(ann_rst, dtd) {
        var ann = JSON.parse(JSON.stringify(ann_rst.ann));

        // clear the ann tags
        ann.tags = [];

        // check each cate
        var cms = ['tp', 'fp', 'fn'];

        for (const tag_name in ann_rst.rst) {
            if (Object.hasOwnProperty.call(ann_rst.rst, tag_name)) {
                const tag_rst = ann_rst.rst[tag_name];

                for (let i = 0; i < cms.length; i++) {
                    const cm = cms[i];
                    
                    for (let j = 0; j < tag_rst[cm].length; j++) {
                        var tag = Object.assign({}, tag_rst[cm][j].tag);
                        var tag_def = dtd.tag_dict[tag.tag];

                        // get a new id for this tag
                        var new_id = ann_parser.get_next_tag_id(ann, tag_def);

                        // now, set this tag and put it into list
                        tag.id = new_id;
                        ann.tags.push(tag);
                    }
                }
            }
        }

        return ann;
    },

    get_default_gs_dict: function(dtd, iaa_dict) {
        // the core of gs is similar to the iaa_dict.ann
        // which is a hashcode based dictionary.
        // and the inner data is similar.
        /*
        {
            hashcode: {
                ann: ann_obj // but the tags are empty,
                rst: {
                    tag_name: {
                        tp: [{tag: tag, from: 'a'}, ...],
                        fp: [],
                        fn: []
                    }
                }
            }
        }

        the length of tp, fp, fn is exactly equal to the iaa_dict
        */
        var gs_dict = {};

        var cnt = 0;
        for (const hashcode in iaa_dict.ann) {
            if (Object.hasOwnProperty.call(iaa_dict.ann, hashcode)) {
                // deep copy a new object
                const ann_rst = JSON.parse(JSON.stringify(iaa_dict.ann[hashcode]));
                cnt += 1;

                // rename the 
                gs_dict[hashcode] = {
                    // copy the ann_a as defult
                    ann: ann_rst.anns[0],
                    rst: {}
                }

                // rename the gs
                var fn_gs = "G_" + this.find_lcs(
                    ann_rst.anns[0]._filename,
                    ann_rst.anns[1]._filename
                ) + '_' + cnt + '.xml';
                
                gs_dict[hashcode].ann._filename = fn_gs;

                // remove the _fh
                delete gs_dict[hashcode].ann._fh;

                // empty the existing tags
                gs_dict[hashcode].ann.tags = [];

                // add one more 
                gs_dict[hashcode].ann._has_star = false;

                for (const tag_name in ann_rst.rst.tag) {
                    if (Object.hasOwnProperty.call(ann_rst.rst.tag, tag_name)) {
                        const tag_rst = ann_rst.rst.tag[tag_name];
                        gs_dict[hashcode].rst[tag_name] = {
                            tp: [],
                            fp: [],
                            fn: []
                        }

                        // fill each in tp
                        for (let i = 0; i < tag_rst.cm.tags.tp.length; i++) {
                            const tags = tag_rst.cm.tags.tp[i];
                            // use ann_a's result
                            gs_dict[hashcode].rst[tag_name].tp.push({
                                tag: tags[0],
                                from: 'A'
                            });
                        }

                        // fill each in fp
                        for (let i = 0; i < tag_rst.cm.tags.fp.length; i++) {
                            const tags = tag_rst.cm.tags.fp[i];
                            // use ann_a's result
                            gs_dict[hashcode].rst[tag_name].fp.push({
                                tag: tags[0],
                                from: 'A'
                            });
                        }
                        
                        // fill each in fn
                        for (let i = 0; i < tag_rst.cm.tags.fn.length; i++) {
                            const tags = tag_rst.cm.tags.fn[i];
                            // use ann_b's result
                            gs_dict[hashcode].rst[tag_name].fn.push({
                                tag: tags[1],
                                from: 'B'
                            });
                        }
                    }
                }
            }
        }

        return gs_dict;
    },

    get_iaa_report_summary_json: function(iaa_dict, dtd) {
        // there are the following columns in the summary
        // Tag Name, F1, precision, recall, TP, FP, FN
        var js = [];

        // add the overall
        js.push({
            'tag_name': 'Overall',
            'F1': iaa_dict.all.f1.toFixed(4),
            'precision': iaa_dict.all.precision.toFixed(4),
            'recall': iaa_dict.all.recall.toFixed(4),
            'TP': iaa_dict.all.cm.tp,
            'FP': iaa_dict.all.cm.fp,
            'FN': iaa_dict.all.cm.fn,
        });

        // now, check each etag
        for (let i = 0; i < dtd.etags.length; i++) {
            const etag_name = dtd.etags[i].name;
            
            // add this tag to the summary
            js.push({
                'tag_name': etag_name,
                'F1': iaa_dict.tag[etag_name].f1.toFixed(4),
                'precision': iaa_dict.tag[etag_name].precision.toFixed(4),
                'recall': iaa_dict.tag[etag_name].recall.toFixed(4),
                'TP': iaa_dict.tag[etag_name].cm.tp,
                'FP': iaa_dict.tag[etag_name].cm.fp,
                'FN': iaa_dict.tag[etag_name].cm.fn,
            });
        }

        return js;
    },

    get_iaa_report_summary_excelws: function(iaa_dict, dtd) {
        var js = this.get_iaa_report_summary_json(
            iaa_dict,
            dtd
        );
        var ws_summary = XLSX.utils.json_to_sheet(js);
        // change the style for the header line
        var cols = 'ABCDEFG'.split('');
        for (let i = 0; i < cols.length; i++) {
            var col = cols[i];
            var row = '1';
            ws_summary[col + row].s = {
                font: {
                    sz: 14,
                    bold: true
                },
            }
        }

        // change the style for the overall F1
        var col_tag = 'A';
        var col_f1 = 'B';
        var overall_f1_value = js[0].F1;
        var overall_f1_color4ws = d3.rgb(
            d3.interpolateBlues(overall_f1_value * 0.9)
        ).formatHex();
        ws_summary[col_f1 + '2'].s = {
            fill: {
                fgColor: {
                    rgb: overall_f1_color4ws.substring(1)
                }
            },
        }

        // change the style for the tag column
        for (let i = 0; i < dtd.etags.length; i++) {
            const etag = dtd.etags[i];
            var row = '' + (i+3);
            // change the tag bg
            ws_summary[col_tag + row].s = {
                fill: {
                    fgColor: {
                        rgb: etag.style.color.substring(1).toLocaleUpperCase()
                    }
                },
            }
            // change the f1 bg
            var f1_value = parseFloat(ws_summary[col_f1 + row].v)
            var color4ws = d3.rgb(
                d3.interpolateBlues(f1_value * 0.9)
            ).formatHex();
            ws_summary[col_f1 + row].s = {
                fill: {
                    fgColor: {
                        rgb: color4ws.substring(1)
                    }
                },
            }
        }

        return ws_summary;
    },

    get_iaa_report_files_json: function(iaa_dict, dtd) {
        // there are following columns in the files json
        // file name
        var js = [];

        for (const fnhash in iaa_dict.ann) {
            if (Object.hasOwnProperty.call(iaa_dict.ann, fnhash)) {
                const ann_rst = iaa_dict.ann[fnhash];
                
                // create a j obj for this file
                var j = {
                    'file_name_A': ann_rst.anns[0]._filename,
                    'file_name_B': ann_rst.anns[1]._filename,
                    'F1': this.to_fixed(ann_rst.rst.all.f1),
                    'precision': this.to_fixed(ann_rst.rst.all.precision),
                    'recall': this.to_fixed(ann_rst.rst.all.recall),
                    'TP': ann_rst.rst.all.cm.tp,
                    'FP': ann_rst.rst.all.cm.fp,
                    'FN': ann_rst.rst.all.cm.fn,
                };

                // add the f1 of each tag
                for (let i = 0; i < dtd.etags.length; i++) {
                    const etag = dtd.etags[i];
                    j[etag.name + '_F1'] = this.to_fixed(
                        ann_rst.rst.tag[etag.name].f1
                    )
                }

                // add the result
                js.push(j);
            }
        }

        return js;
    },

    get_iaa_report_files_excelws: function(iaa_dict, dtd) {
        var js = this.get_iaa_report_files_json(
            iaa_dict,
            dtd
        );

        var ws_files = XLSX.utils.json_to_sheet(js);

        // update the style
        var col_f1 = 'C';
        for (let i = 0; i < js.length; i++) {
            // get the row number
            var row = i + 2;

            // the F1 column is
            const j = js[i];
            
            // get the f1 value
            var f1_value = parseFloat(j.F1);

            // convert the f1 value to RGB color
            var color4ws = d3.rgb(
                d3.interpolateBlues(f1_value)
            ).formatHex();

            // set the style for this cell
            ws_files[col_f1 + row].s = {
                fill: {
                    fgColor: {
                        rgb: color4ws.substring(1)
                    }
                },
            }
        }

        return ws_files;
    },

    /**
     * Get the IAA report, the details of tags.
     *
     * 
     * @param {Object} iaa_dict the dictionary contains IAA result
     * @param {Object} dtd the DTD schema
     * @param {Object} flags flags for controling results
     * @returns JSON format report
     */
    get_iaa_report_tags_json: function(iaa_dict, dtd, flags) {
        if (typeof(flags)=='undefined') {
            flags = {
                skip_agreed_tags: false
            }
        }
        // there are following columns in the files json
        // file name
        var js = [];
        var cms = ['tp', 'fp', 'fn'];
        if (flags.skip_agreed_tags) {
            cms = ['fp', 'fn'];
        }

        for (const fnhash in iaa_dict.ann) {
            if (Object.hasOwnProperty.call(iaa_dict.ann, fnhash)) {
                const ann_rst = iaa_dict.ann[fnhash];

                // now need to check each tag in this ann_rst
                for (let i = 0; i < dtd.etags.length; i++) {
                    const etag = dtd.etags[i];
                    
                    // now need to check each cm
                    for (let j = 0; j < cms.length; j++) {
                        const cm = cms[j];
                        // get the index for the cm tags
                        // for tp and fp, use 0
                        // for fn, use 1
                        var idx = {'tp': 0, 'fp': 0, 'fn': 1}[cm];
                        
                        // the IAA 
                        var iaa = {
                            'tp': 'Agreed',
                            'fp': 'Disagreed',
                            'fn': 'Disagreed'
                        }[cm];
                        
                        // now need to check each item in this
                        var cm_tags = ann_rst.rst.tag[etag.name].cm.tags[cm];
                        for (let k = 0; k < cm_tags.length; k++) {
                            // ok, put each tag to the js
                            const cm_tag = cm_tags[k];
                            
                            for (let anter_idx = 0; anter_idx < 2; anter_idx++) {
                                if (cm_tag[anter_idx] == null) {
                                    // no such tag, skip
                                    continue
                                }
                                // where the tags comes from depends on
                                // the index, which is coded in the parsing iaa
                                var src = {0: 'A', 1: 'B'}[anter_idx];

                                // add this tag to final list
                                // create a base json to hold everything
                                var json = {
                                    'file_name': ann_rst.anns[idx]._filename,
                                    'source': src,
                                    'concept': etag.name,
                                    'id': cm_tag[anter_idx].id,
                                    'spans': cm_tag[anter_idx].spans,
                                    'text': cm_tag[anter_idx].text,
                                    'IAA': iaa
                                };

                                // next need to put all attributes to this
                                // this depends on the schema
                                for (let att_idx = 0; att_idx < etag.attlists.length; att_idx++) {
                                    const etag_att = etag.attlists[att_idx];
                                    
                                    // the attribute name should be the same
                                    // since it is used as the column name.
                                    // So we need to create two new columns:
                                    // 1. att_x_key, for the attr key
                                    // 2. att_x_txt, for the attr value
                                    var col_att_key = 'attr_name_' + att_idx;
                                    var col_att_key_value = etag_att.name;

                                    var col_att_txt = 'attr_value_' + att_idx;
                                    var col_att_txt_value = cm_tag[anter_idx][etag_att.name];

                                    // then put this two columns to the json
                                    json[col_att_key] = col_att_key_value;
                                    json[col_att_txt] = col_att_txt_value;
                                }

                                // put to js
                                js.push(json);
                                
                            }
                        }
                    }
                }
            }
        }

        return js;
    },

    get_iaa_report_tags_excelws: function(iaa_dict, dtd) {
        var js = this.get_iaa_report_tags_json(
            iaa_dict,
            dtd
        );
        var ws_tags = XLSX.utils.json_to_sheet(js);

        // change the style for the IAA column
        var col_concept = 'C';
        var col_iaa = 'G';
        for (let i = 0; i < js.length; i++) {
            // get the data item
            var json = js[i];

            // get the row number
            // the first row is the header, 
            // so the number starts with 2
            var row = i + 2;

            // set the style for the concept name
            ws_tags[col_concept + row].s = {
                fill: {
                    fgColor: {
                        rgb: dtd.tag_dict[json.concept].style.color.substring(1)
                    }
                },
            }

            // get IAA value in that cell and convert to color
            var iaa_value = ws_tags[col_iaa + row].v;
            var iaa_color = iaa_value == 'Agreed'? 
                this.colors.decision_agreed: 
                this.colors.decision_disagreed;

            // set the style for the 
            ws_tags[col_iaa + row].s = {
                fill: {
                    fgColor: {
                        rgb: iaa_color
                    }
                },
            }
            
        }

        return ws_tags;
    },

    /**
     * Get the IAA report in a format for adjudication.
     *
     * 
     * @param {Object} iaa_dict the dictionary contains IAA result
     * @param {Object} dtd the DTD schema
     * @param {Object} flags flags for controling results
     * @returns JSON format report
     */
    get_iaa_report_adjudication_json: function(iaa_dict, dtd, flags) {
        if (typeof(flags)=='undefined') {
            flags = {
                skip_agreed_tags: false
            }
        }
        // there are following columns in the files json
        // file name
        var js = [];
        var cms = ['tp', 'fp', 'fn'];
        if (flags.skip_agreed_tags) {
            cms = ['fp', 'fn'];
        }

        for (const fnhash in iaa_dict.ann) {
            if (Object.hasOwnProperty.call(iaa_dict.ann, fnhash)) {
                const ann_rst = iaa_dict.ann[fnhash];

                // now need to check each tag in this ann_rst
                for (let i = 0; i < dtd.etags.length; i++) {
                    const etag = dtd.etags[i];
                    // processed tags in list b
                    var p_tags_b = [];
                    
                    // now need to check each cm
                    for (let j = 0; j < cms.length; j++) {
                        const cm = cms[j];
                        // the IAA 
                        var iaa = {
                            'tp': 'Agreed',
                            'fp': 'Disagreed',
                            'fn': 'Disagreed'
                        }[cm];
                        
                        // now need to check each item in this
                        var cm_tags = ann_rst.rst.tag[etag.name].cm.tags[cm];
                        for (let k = 0; k < cm_tags.length; k++) {
                            // no matter what the 
                            // ok, put each tag to the js
                            const cm_tag = cm_tags[k];

                            // need to check if tag_b
                            if (cm_tag[1] == null) {
                                // ok, this only involves annotator a
                            } else {
                                // now check if this tag added?
                                if (p_tags_b.contains(cm_tag[1].id)) {
                                    // oh, this tag b has been added
                                    continue
                                } else {
                                    // oh, this is a new tag b
                                    p_tags_b.push(cm_tag[1].id)
                                }
                            }
                            
                            // create a base json to hold everything
                            var json = {
                                // just use the first file as file name
                                'file_name': ann_rst.anns[0]._filename,
                                'concept': etag.name,
                                'IAA': iaa
                            };
                            
                            // decision
                            
                            // then put the annotation from A and B
                            // anter_idx 0 is A
                            // anter_idx 1 is B
                            for (let anter_idx = 0; anter_idx < 2; anter_idx++) {
                                var anter_label = {0:'A', 1:'B'}[anter_idx];
                                if (cm_tag[anter_idx] == null) {
                                    // which means this location is empty
                                    // just put empty content
                                    // due to the xlsx convert design, 
                                    // must put empty text here
                                    json[anter_label+'.id'] = '';
                                    json[anter_label+'.spans'] = '';
                                    json[anter_label+'.text'] = '';
                                } else {
                                    // ok, this is a tag, put it here
                                    json[anter_label+'.id'] = cm_tag[anter_idx].id;
                                    json[anter_label+'.spans'] = cm_tag[anter_idx].spans;
                                    json[anter_label+'.text'] = cm_tag[anter_idx].text;
                                }                                
                            }
                            
                            // next need to put all attributes to this
                            // this depends on the schema
                            // for (let att_idx = 0; att_idx < etag.attlists.length; att_idx++) {
                            //     const etag_att = etag.attlists[att_idx];
                                
                            //     // the attribute name should be the same
                            //     // since it is used as the column name.
                            //     // So we need to create two new columns:
                            //     // 1. att_x_key, for the attr key
                            //     // 2. att_x_txt, for the attr value
                            //     var col_att_key = 'attr_name_' + att_idx;
                            //     var col_att_key_value = etag_att.name;

                            //     var col_att_txt = 'attr_value_' + att_idx;
                            //     var col_att_txt_value = cm_tag[idx][etag_att.name];

                            //     // then put this two columns to the json
                            //     json[col_att_key] = col_att_key_value;
                            //     json[col_att_txt] = col_att_txt_value;
                            // }

                            // put to js
                            js.push(json);
                        }
                    }
                }
            }
        }

        return js;
    },

    get_iaa_report_adjudication_excelws: function(iaa_dict, dtd) {
        var js = this.get_iaa_report_adjudication_json(
            iaa_dict,
            dtd
        );
        var ws_tags = XLSX.utils.json_to_sheet(js);

        // change the style for the adjudication column
        var col_concept = 'B';
        var col_iaa = 'C';
        var cols_a = ['D', 'E', 'F'];
        var cols_b = ['G', 'H', 'I'];
        for (let i = 0; i < js.length; i++) {
            // get the data item
            var json = js[i];

            // get the row number
            // the first row is the header, 
            // so the number starts with 2
            var row = i + 2;

            // set the style for the concept name
            ws_tags[col_concept + row].s = {
                fill: {
                    fgColor: {
                        rgb: dtd.tag_dict[json.concept].style.color.substring(1)
                    }
                },
            }

            // get IAA value in that cell and convert to color
            var iaa_value = ws_tags[col_iaa + row].v;
            var iaa_color = iaa_value == 'Agreed'? 
                this.colors.decision_agreed: 
                this.colors.decision_disagreed;

            // set the style for the 
            ws_tags[col_iaa + row].s = {
                fill: {
                    fgColor: {
                        rgb: iaa_color
                    }
                },
            }

            // set bg color for annotator A
            for (let j = 0; j < cols_a.length; j++) {
                const col = cols_a[j];
                ws_tags[col + row].s = {
                    fill: {
                        fgColor: {
                            rgb: this.colors.annotator_a_tag
                        }
                    },
                }
            }

            // set bg color for annotator B
            for (let j = 0; j < cols_b.length; j++) {
                const col = cols_b[j];
                ws_tags[col + row].s = {
                    fill: {
                        fgColor: {
                            rgb: this.colors.annotator_b_tag
                        }
                    },
                }
            }
        }

        return ws_tags;
    },

    /**
     * Evaluate the IAA based on given schema and 
     * two list of annotations from two annotators
     * 
     * @param {Object} dtd the annotation schema
     * @param {Object} anns_a the annotations by A
     * @param {Object} anns_b the annotations by B
     * @param {string} match_mode overlap or exact match
     * @param {float} overlap_ratio overlap ratio
     * @returns Object of IAA result
     */
    evaluate_anns_on_dtd: function(
        dtd, 
        anns_a, 
        anns_b, 
        match_mode, 
        overlap_ratio,
        tag_attrs
    ) {
        if (typeof(match_mode) == 'undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = this.default_overlap_ratio;
        }
        if (typeof(tag_attrs) == 'undefined') {
            tag_attrs = null;
        }
        /* we will build a dictionary for this task
        {
            ann: {
                text_hash: {
                    anns: [ann_a, ann_b],
                    rst: {
                        tag_name: result
                    }
                },
                ...
            },
            all: {pre, rec, f1, cm},
            tag: {
                tag_a: {pre, rec, f1, cm},
            }
        },
        */
        var iaa_dict = {
            ann: {}, // for the file
            all: {},
            tag: {},
            stat: {
                duplicates: [],
                unmatched: [],
                matched_hashcodes: []
            },
        };

        // this is just for checking dupliated ann
        var ann_dict = {};
        
        // first, let's check all anns_a
        for (let i = 0; i < anns_a.length; i++) {
            const ann_a = anns_a[i];
            var hashcode = this.hash(ann_a.text);

            if (ann_dict.hasOwnProperty(hashcode)) {
                // what??? duplicated text in anns_a?
                console.log('* found duplicated ann a', ann_a);
                iaa_dict.stat.duplicates.push({
                    ann: ann_a,
                    from: 'a'
                });
                continue;
            }

            // ok, let's create a new item here
            ann_dict[hashcode] = [{
                ann: ann_a,
                from: 'a'
            }];
        }

        // second, let's check all anns_b
        for (let i = 0; i < anns_b.length; i++) {
            const ann_b = anns_b[i];
            var hashcode = this.hash(ann_b.text);

            if (ann_dict.hasOwnProperty(hashcode)) {
                if (ann_dict[hashcode].length > 1) {
                    // this is a dupliated ann
                    iaa_dict.stat.duplicates.push({
                        ann: ann_b,
                        from: 'b'
                    });
                    console.log('* found duplicated ann b', ann_b);

                    continue;
                }
            } else {
                // which means this ann has no ann in a
                ann_dict[hashcode] = [{
                    ann: ann_b,
                    from: 'b'
                }];
                iaa_dict.stat.unmatched.push({
                    ann: ann_b,
                    from: 'b'
                });
                console.log('* found unmatched ann b', ann_b);
                continue;
            }
            
            // OK, this ann_b could be matched with ann_a
            var ann_a = ann_dict[hashcode][0].ann;
            iaa_dict.ann[hashcode] = {
                anns: [
                    ann_a,
                    ann_b
                ],
                rst: {},
            };

            // save the hashcode
            iaa_dict.stat.matched_hashcodes.push(hashcode);
            
            // let's save this ann_b
            ann_dict[hashcode].push({ 
                ann: ann_b,
                from: 'b'
            });

            // now, time to evaluate
            var rst = this.evaluate_ann_on_dtd(
                dtd,
                ann_a,
                ann_b,
                match_mode,
                overlap_ratio,
                tag_attrs
            );

            // save this result
            iaa_dict.ann[hashcode].rst = rst;
        }

        // third, check if there is any unmatched from ann a
        for (const hashcode in ann_dict) {
            if (Object.hasOwnProperty.call(ann_dict, hashcode)) {
                if (ann_dict[hashcode].length == 1 &&
                    ann_dict[hashcode][0].from == 'a') {
                    // which means ... this ann is not used for matching
                    iaa_dict.stat.unmatched.push(ann_dict[hashcode][0]);

                    console.log('* found unmatched ann a', ann_dict[hashcode][0].ann);
                }
            }
        }

        // finally, calculate the result at all and tag levels
        var cm_all = { tp: 0, fp: 0, fn: 0 };
        for (let i = 0; i < dtd.etags.length; i++) {
            const tag_def = dtd.etags[i];
            var cm_tag = { tp: 0, fp: 0, fn: 0 };
            
            for (const hashcode in iaa_dict.ann) {
                if (Object.hasOwnProperty.call(iaa_dict.ann, hashcode)) {
                    const iaa = iaa_dict.ann[hashcode];
                    // add the result of this tag
                    cm_tag.tp += iaa.rst.tag[tag_def.name].cm.tp;
                    cm_tag.fp += iaa.rst.tag[tag_def.name].cm.fp;
                    cm_tag.fn += iaa.rst.tag[tag_def.name].cm.fn;
                }
            }
            // get the tag level result
            var tag_result = this.calc_p_r_f1(cm_tag);
            iaa_dict.tag[tag_def.name] = tag_result;

            // add the tag level to all
            cm_all.tp += cm_tag.tp;
            cm_all.fp += cm_tag.fp;
            cm_all.fn += cm_tag.fn;
        }
        // get the all level result
        var all_result = this.calc_p_r_f1(cm_all);

        iaa_dict.all = all_result;

        // update the cohen kappa of all
        all_result.cohen_kappa = this.get_cohen_kappa_overall(iaa_dict);

        return iaa_dict;
    },

    /**
     * Evaluate the IAA based on given schema and 
     * two annotation from two annotators
     * 
     * @param {Object} dtd the annotation schema
     * @param {Object} ann_a an annotation by A
     * @param {Object} ann_b an annotation by B
     * @param {string} match_mode overlap or exact match
     * @param {float} overlap_ratio overlap ratio
     * @param {Object} tag_attrs which attr to be used in calc 
     * @returns Object of IAA result
     */
    evaluate_ann_on_dtd: function(
        dtd, 
        ann_a, 
        ann_b, 
        match_mode, 
        overlap_ratio,
        tag_attrs) {
        if (typeof(match_mode)=='undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = this.default_overlap_ratio;
        }
        if (typeof(tag_attrs) == 'undefined') {
            tag_attrs = null;
        }

        // check the text first
        if (ann_a.text != ann_b.text) {
            throw { 
                name: 'Different texts', 
                message: 'The texts are different in given annotations.'
            };
        }

        // check each etag
        var result_ann = {
            all: {},
            tag: {}
        }
        var cm_ann = { tp: 0, fp: 0, fn: 0 };
        for (let i = 0; i < dtd.etags.length; i++) {
            const tag_def = dtd.etags[i];
            var r = this.evaluate_ann_on_tag(
                tag_def, 
                ann_a, 
                ann_b, 
                match_mode, 
                overlap_ratio,
                tag_attrs
            );
            result_ann.tag[tag_def.name] = r;

            // add the result of this tag
            cm_ann.tp += r.cm.tp;
            cm_ann.fp += r.cm.fp;
            cm_ann.fn += r.cm.fn;

        }
        var all_result = this.calc_p_r_f1(cm_ann);

        result_ann.all = all_result;

        // update the cohen kappa of all
        all_result.cohen_kappa = this.get_cohen_kappa_overall(result_ann);

        return result_ann;
    },

    evaluate_ann_on_tag: function(
        tag_def, 
        ann_a, 
        ann_b, 
        match_mode, 
        overlap_ratio,
        tag_attrs
    ) {
        if (typeof(match_mode)=='undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = this.default_overlap_ratio;
        }
        if (typeof(tag_attrs) == 'undefined') {
            tag_attrs = null;
        }

        // check the text first
        if (ann_a.text != ann_b.text) {
            throw { 
                name: 'Different texts', 
                message: 'The texts are different in given annotations.'
            };
        }

        // get all tags of this tag_def
        var tag_list_a = this.get_tag_list_by_tag(tag_def, ann_a);
        var tag_list_b = this.get_tag_list_by_tag(tag_def, ann_b);

        var cm = this.calc_matching(
            tag_list_a, 
            tag_list_b, 
            match_mode, 
            overlap_ratio,
            tag_attrs
        );
        var result = this.calc_p_r_f1(cm);

        return result;
    },

    calc_matching: function(
        tag_list_a, 
        tag_list_b, 
        match_mode, 
        overlap_ratio,
        tag_attrs
    ) {
        if (typeof(match_mode)=='undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = this.default_overlap_ratio;
        }
        if (typeof(tag_attrs) == 'undefined') {
            tag_attrs = null;
        }
        var cm = {
            tp: 0,
            fp: 0,
            fn: 0,
            
            // save the details
            tags: {
                tp: [],
                fp: [],
                fn: []
            }
        };

        // this dictionary is for generating the list for FN list
        var tag_dict_b = {};
        for (let i = 0; i < tag_list_b.length; i++) {
            const tag = Object.assign({}, tag_list_b[i]);
            tag_dict_b[tag.spans] = tag;
        }

        // check each element in tag_list_a and find matched in b
        for (let i = 0; i < tag_list_a.length; i++) {
            var tag_a = tag_list_a[i];
            
            // the `tag_list_b` may be not empty
            // if not match, may due to the low overlap
            // the return result also contains the overlap rate
            var is_match = this.is_tag_match_in_list(
                tag_a, 
                tag_list_b, 
                match_mode,
                overlap_ratio,
                tag_attrs
            );

            console.log('* a', tag_a.spans, is_match.is_in, 'b', is_match.tag_b);

            if (is_match.is_in) {
                // This case is simple, two tags are matched
                cm.tp += 1;
                cm.tags.tp.push([
                    tag_a, 
                    is_match.tag_b
                ]);

                // remove this tag_b from the dict
                delete tag_dict_b[is_match.tag_b.spans];

            } else {
                // This case means that this tag is not found in tag_list_b
                cm.fp += 1;
                cm.tags.fp.push([
                    tag_a, 
                    // usually, the tag_b is null,
                    // but sometimes it is not depends on the rate
                    is_match.tag_b
                ]);

                // in some cases, it's not match is due to low overlap ratio
                // we need to remove this tag_b as well.
                // but we may also want to keep both?
                // if (is_match.tag_b != null) {
                //     delete tag_dict_b[is_match.tag_b.spans];
                // }
            }
        }

        cm.fn = tag_list_b.length - cm.tp;
        cm.tags.fn = Object.values(tag_dict_b).map(tag => [null, tag]);

        return cm;
    },

    is_tag_match_in_list: function(
        tag, 
        tag_list, 
        match_mode, 
        overlap_ratio,
        tag_attrs
    ) {
        if (typeof(match_mode)=='undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = this.default_overlap_ratio;
        }
        if (typeof(tag_attrs) == 'undefined') {
            tag_attrs = null;
        }
        var spans = tag.spans;
        var loc_a = this.spans2loc(spans);

        // potential b
        var p_tag_b = null;
        // the overlap rate
        var olpr = 0;

        for (let i = 0; i < tag_list.length; i++) {
            const tag_b = tag_list[i];
            var spans_b = tag_b.spans;

            if (match_mode == 'overlap') {
                // for overlap mode, check ranges of two spans
                var loc_b = this.spans2loc(spans_b);

                // the overlap contains two value
                // first the decision based on the ratio
                // seoncd the how much is overlapped
                var is_olpd = this.is_overlapped(
                    loc_a, 
                    loc_b, 
                    overlap_ratio
                );
                if (is_olpd[0]) {
                    // check if using tag_attrs
                    if (tag_attrs == null) {
                        // OK, the overlap is bigger than the ratio
                        // just return this is matched
                        return { 
                            is_in: true,
                            tag_b: tag_b,
                            olpr: is_olpd[1],
                            atum: null
                        };
                    } else {
                        // too bad, need to check the attributes
                        var is_atmd = this.is_attrs_matched(
                            tag,
                            tag_b,
                            tag_attrs
                        );

                        if (is_atmd[0]) {
                            // great! perfect match!
                            return { 
                                is_in: true,
                                tag_b: tag_b,
                                olpr: is_olpd[1],
                                atum: null
                            };
                        } else {
                            // too bad, some attr maybe different
                            return { 
                                is_in: false,
                                tag_b: tag_b,
                                olpr: is_olpd[1],
                                // ATtribute UnMatched
                                atum: is_atmd[1]
                            };
                        }
                    }
                }
                // in some cases, the overlapped ratio is low
                // but still match, we need to check this case
                if (is_olpd[1] > 0) {
                    p_tag_b = tag_b;
                }
                
            } else if (match_mode == 'exact') {

                if (spans == spans_b) {
                    return {
                        is_in: true,
                        tag_b: tag_b,
                        olpr: 1,
                        atum: null
                    };
                }
                
            }
        }

        return {
            is_in: false,
            tag_b: p_tag_b,
            olpr: olpr,
            atum: null
        };
    },

    is_attrs_matched: function(tag_a, tag_b, tag_attrs) {
        if (typeof(tag_attrs) == 'undefined') {
            tag_attrs = {};
        }
        for (const attr in tag_a) {
            if (!tag_attrs.hasOwnProperty(tag_a.tag)) {
                // what??? 
                break;
            }
            if (!tag_attrs[tag_a.tag].hasOwnProperty(attr)) {
                // skip those system attr
                continue;
            }
            if (!tag_attrs[tag_a.tag][attr]) {
                // skip those unselected attr
                continue;
            }
            if (Object.hasOwnProperty.call(tag_a, attr)) {
                const val_a = tag_a[attr];

                if (tag_b.hasOwnProperty(attr)) {
                    // skip those attrs that not available
                    const val_b = tag_b[attr];

                    if (val_a == val_b) {
                        // ok, nothing to do with one as they are the same 
                        continue;

                    } else {
                        // ok, we found different attr val!
                        return [false, attr];
                    }
                } else {
                    // what??? this can't be!
                    // return [false, attr];
                    continue;
                }
            }
        }
        // ok, is matched and no difference
        return [true, null];
    },

    is_overlapped: function(loc_a, loc_b, overlap_ratio) {
        if (typeof(overlap_ratio)=='undefined') {
            overlap_ratio = this.default_overlap_ratio;
        }
        
        var s_a = new Set(new Array(loc_a[1] - loc_a[0] + 1).fill(loc_a[0]).map((e,i)=>e+i));
        var s_b = new Set(new Array(loc_b[1] - loc_b[0] + 1).fill(loc_b[0]).map((e,i)=>e+i));

        var s_inter = this.set_intersection(s_a, s_b);
        var s_union = this.set_union(s_a, s_b);
        var r = s_inter.size / s_union.size;

        // console.log('* is overlapped', loc_a, '', loc_b, 'i:', s_inter.size, 'u:', s_union.size, 'r:', r);

        if (r >= overlap_ratio) {
            return [true, r];
        } else {
            return [false, r]
        }
    },

    spans2loc: function(spans) {
        var vs = spans.split('~');
        return [
            parseInt(vs[0]), 
            parseInt(vs[1])
        ];
    },

    calc_p_r_f1: function(cm) {
        var precision = this.calc_precision(cm.tp, cm.fp);
        var recall = this.calc_recall(cm.tp, cm.fn);
        var f1 = this.calc_f1_by_pr(precision, recall);
        var cohen_kappa = this.get_cohen_kappa(cm.tp, cm.fp, cm.fn);

        return {
            precision: precision,
            recall: recall,
            f1: f1,
            cohen_kappa: cohen_kappa,
            cm: cm
        }
    },

    calc_precision: function(tp, fp) {
        return tp / (tp + fp);
    },

    calc_recall: function(tp, fn) {
        return tp / (tp + fn);
    },

    /**
     * Calculate the total number of records
     * 
     * @param {number} tp True positive
     * @param {number} fp False positive
     * @param {number} fn False negative
     * @returns number of total
     */
    calc_N: function(tp, fp, fn) {
        return tp + fp + fn;
    },

    /**
     * Calculate the percentage agreement
     * 
     * As this is no TN, the PerAgr is just the TP
     * 
     * @param {number} tp True positive
     * @param {number} fp False positive
     * @param {number} fn False negative
     * @returns Po
     */
    calc_Po: function(tp, fp, fn) {
        return tp / this.calc_N(tp, fp, fn);
    },

    calc_Pe: function(tp, fp, fn) {
        var N = this.calc_N(tp, fp, fn);
        return ((tp + fn) * (tp + fp) + fn * fp) / N**2;
    },

    calc_cohen_kappa: function(Po, Pe) {
        // get the cohen's kappa
        return 1 - (1 - Po) / (1 - Pe);
    },
    
    calc_cohen_kappa_SE_k: function(N, Po, Pe) {
        return (
            Po * (1 - Po) / 
            (N * (1 - Pe) ** 2)
        )**0.5;
    },

    get_cohen_kappa_overall: function(iaa_rst) {
        // the N is just the total number
        var N = this.calc_N(
            iaa_rst.all.cm.tp,
            iaa_rst.all.cm.fp,
            iaa_rst.all.cm.fn
        );
        // the overall Po is as usuall
        var Po = this.calc_Po(
            iaa_rst.all.cm.tp, 
            iaa_rst.all.cm.fp, 
            iaa_rst.all.cm.fn
        );

        // Need to get the sub-Pe
        var sPes = [];

        for (const tag_name in iaa_rst.tag) {
            if (Object.hasOwnProperty.call(iaa_rst.tag, tag_name)) {
                const rst = iaa_rst.tag[tag_name];
                var sPe = (rst.cm.tp + rst.cm.fp) * (rst.cm.tp + rst.cm.fn) / N**2;
                sPes.push(sPe);
            }
        }
        // sum all
        var Pe = sPes.reduce((a, b) => a + b, 0);

        // get the cohen's kappa
        var kappa = this.calc_cohen_kappa(Po, Pe);

        // get the SE_k
        var SE_k = this.calc_cohen_kappa_SE_k(N, Po, Pe);

        // get the lower and upper for 95% CI
        var lower = kappa - 1.96 * SE_k;
        var upper = kappa + 1.96 * SE_k;

        return {
            N: N,
            Po: Po,
            Pe: Pe,
            kappa: kappa,
            SE_k: SE_k,
            lower: lower,
            upper: upper
        };
    },

    /**
     * Get the Cohen's Kappa Score and 95% CI
     * 
     * The definition comes from 
     * https://en.wikipedia.org/wiki/Cohen%27s_kappa
     * 
     * @param {number} tp True positive
     * @param {number} fp False positive
     * @param {number} fn False negative
     * @returns Cohen's Kappa Score and 95% CI
     */
     get_cohen_kappa: function(tp, fp, fn) {
        var N = this.calc_N(tp, fp, fn);
        var Po = this.calc_Po(tp, fp, fn);
        var Pe = this.calc_Pe(tp, fp, fn);

        // get the cohen's kappa
        var kappa = this.calc_cohen_kappa(Po, Pe);

        // get the SE_k
        var SE_k = this.calc_cohen_kappa_SE_k(N, Po, Pe);

        // get the lower and upper for 95% CI
        var lower = kappa - 1.96 * SE_k;
        var upper = kappa + 1.96 * SE_k;

        return {
            N: N,
            Po: Po,
            Pe: Pe,
            kappa: kappa,
            SE_k: SE_k,
            lower: lower,
            upper: upper
        };
    },

    calc_f1: function(tp, fp, fn) {
        var precision = this.calc_precision(tp, fp);
        var recall = this.calc_recall(tp, fn);
        return 2 * precision * recall / (precision + recall);
    },

    calc_f1_by_pr: function(precision, recall) {
        return 2 * precision * recall / (precision + recall);
    },

    get_tag_list_by_tag: function(tag_def, ann) {
        var tag_dict = {};
        for (let i = 0; i < ann.tags.length; i++) {
            const tag = ann.tags[i];
            if (tag.tag == tag_def.name) {
                tag_dict[tag.spans] = tag;
            }
        }

        // conver the dictionary to list
        var tag_list = Object.values(tag_dict);
        return tag_list;
    },

    hash: function(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
        h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1>>>0);
    },

    to_fixed: function(v) {
        if (typeof(v) == 'undefined' ||
            v == null || 
            isNaN(v)) {
            return '0.0000';
        }
        return v.toFixed(4);
    },

    set_union: function(setA, setB) {
        let _union = new Set(setA)
        for (let elem of setB) {
            _union.add(elem)
        }
        return _union
    },
    
    set_intersection: function(setA, setB) {
        let _intersection = new Set()
        for (let elem of setB) {
            if (setA.has(elem)) {
                _intersection.add(elem)
            }
        }
        return _intersection
    },

    /**
     * Find the longest common substring
     * @param {string} str1 a string
     * @param {string} str2 another string
     * @returns longest common substring
     */
    find_lcs: function(str1, str2) {
        let m = new Array(str1.length+1).fill(0).map(function() {
            return new Array(str2.length+1).fill(0);
        });
        let max = 0;
        let index = null;
        for (let i = 0; i < str1.length; i++) {
            
            for (let j = 0; j < str2.length; j++) {
                
                if(str1.charAt(i) === str2.charAt(j)){
                    if(i>0 && j>0 && m[i-1][j-1]>0) {
                        m[i][j] = 1 + m[i-1][j-1];
                    } else{
                        m[i][j] = 1;
                    }
                    
                    if(max < m[i][j]){
                        max = m[i][j];
                        index = i;
                    }
                } else {
                    
                }
            }
        }

        return str1.substr(index-max + 1, max)
    },
    
};