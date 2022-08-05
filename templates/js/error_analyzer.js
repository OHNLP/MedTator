/**
 * Error Analyzer
 * 
 * A toolkit for analyzing the corpus error.
 * The function is based on IAA calculator's output:
 * 
 * When using annotator A as Gold Standard Corpora (GSC),
 * The annotator B can be regarded as a system to be assessed.
 * The IAA between GSC and B, especially the false positive (FP)
 * and false negative (FN) can be analyzed as errors.
 */
var error_analyzer = {
    // default errors definition
    DEFAULT_ERROR_DEF: {
        "Liguistic": [
            "Lexicon",
            "Orthographic",
            "Morphologic",
            "Syntactic",
            "Semantic",
        ], 
        "Contextual": [
            "Section",
            "Certainty",
            "Status",
            "Temporality",
            "Subject",
            "Absence of Context",
            "Exclusion",
        ], 
        "Logic": [
            "Pattern and Rule",
        ], 
        "Annotation": [
            "Missing Annotation",
            "Insufficent Context",
            "Extrapolation of Evidence",
            "Non-defined Concept",
        ],
        "Concept Definition": [
            "Ambiguity",
            "Source Evidence",
            "Change of Status",
        ]
    },

    UNK_ERROR_TYPE: 'UNKNOWN',
    UNK_ERROR_CATE: 'UNK',

    ERROR_COLOR_SCHEMA: [{
        // some kind of pink
        c_cate: '#F72585',
        c_type: ['#fa6bab', '#ad1b7f', '#f726a1', '#b709f6', '#b709f6', '', '']
    }, {
        // some kind of Byzantine
        c_cate: '#B5179E',
        c_type: ['', '', '', '', '', '', '']
    }, {
        // some kind of Purple
        c_cate: '#7209B7',
        c_type: ['#231942', '#5E548E', '#9F86C0', '#BE95C4', '#E0B1CB', '#E07A5F', '#F2CC8F']
    }, {
        // some kind of Trypan Blue
        c_cate: '#560BAD',
        c_type: ['', '', '', '', '', '', '']
    }, {
        // some kind of Persian blue
        c_cate: '#480CA8',
        c_type: ['', '', '', '', '', '', '']
    }, {
        // some kind of 
        c_cate: '#320890',
        c_type: ['', '', '', '', '', '', '']
    }, {
        // some kind of 
        c_cate: '#003242',
        c_type: ['', '', '', '', '', '', '']
    }],

    /**
     * Get statistics on the given tags
     * 
     * The err is an object like the following:
     * 
     * {
        // unique id for this tag in this analysis
        "uid": "8x9iju7xs2",
        // id in that document / file
        "id": "AE1",                
        "spans": "82~87",           
        "sentence": "I got faint",
        "sentence_spans": "6~11",  
        "tag": "AE",                
        "text": "faint",            
        "file_name": "12345.txt",
        "_annotator": "B",
        "_judgement": "FP",
        
        // the following are optional based on dtd
        "certainty": "Positive",    
        "comment": "Are you sure?", 

        // the following may be provided by user or web service
        "errors": [
            { "category": "Liguistic", "type": "Morphologic" },
            { "category": "Annotation", "type": "Missing Annotation" },
            { "category": "Concept Definition", "type": "Ambiguity" }, 
        ]
     * }
     * 
     * @param {Object} iaa_dict a dict of iaa result
     * @param {Object} err_dict a dict of error tags by the uid of error tag
     * @param {Object} dtd annotation schema
     */
    get_err_stat: function(iaa_dict, err_dict, dtd) {
        // there are several things we want
        // 1. basic count by results and concept
        // 2. error type and cate stat
        // 3. token and doc level

        // using basic number in iaa
        var stat_by_iaa = {
            n_TP: iaa_dict.all.cm.tp,
            n_FP: iaa_dict.all.cm.fp,
            n_FN: iaa_dict.all.cm.fn,
            n_F: iaa_dict.all.cm.fp + iaa_dict.all.cm.fn,
            error_rate: this.get_error_rate(
                iaa_dict.all.cm.tp,
                iaa_dict.all.cm.fp,
                iaa_dict.all.cm.fn
            ),
            accuracy: this.get_accuracy(
                iaa_dict.all.cm.tp,
                iaa_dict.all.cm.fp,
                iaa_dict.all.cm.fn
            ),
            precision: iaa_dict.all.precision,
            recall: iaa_dict.all.recall,
            f1: iaa_dict.all.f1,
        };

        // stat by dtd
        var stat_by_dtd = {};
        // init the stat by dtd with dtd etags
        for (let i = 0; i < dtd.etags.length; i++) {
            const etag = dtd.etags[i];
            stat_by_dtd[etag.name] = {
                FP: [],
                FN: [],
            };
        }

        // stat by err
        var stat_by_err = {
            // the only type is UNKNOWN at present
            'UNKNOWN': {
                FP: [],
                FN: []
            }
        };

        // stat by relations for sankey
        var stat_by_rel = {
            // column 1: error 
            c_error: { FP: { 'UNK': [] }, FN: { 'UNK': [] } },
            // column 2: error category
            c_category: { 'UNK': { 'UNKNOWN': [] }},
            // column 3: error type
            c_type: { 'UNKNOWN': {} }
        };

        // stat by something maybe useful
        var stat_by_smu = {
            total_err_labels: 0,
            freq_n_err_labels: {
                // 0 labels, which means not labeled
                0: {FP: [], FN: []},
                // I think 9 should be enough, isn't it?
                1: {FP: [], FN: []},
                2: {FP: [], FN: []},
                3: {FP: [], FN: []},
                4: {FP: [], FN: []},
                5: {FP: [], FN: []},
                6: {FP: [], FN: []},
                7: {FP: [], FN: []},
                8: {FP: [], FN: []},
                9: {FP: [], FN: []},
            }
        };

        // stat by token
        var stat_by_txt = {};

        // stat by document
        var stat_by_doc = {};

        // check each tag
        for (const uid in err_dict) {
            const err = err_dict[uid];

            // update dtd stat
            stat_by_dtd[err.tag][err._judgement].push(err.uid);

            // update the token stat
            if (!stat_by_txt.hasOwnProperty(err.text)) {
                stat_by_txt[err.text] = { FP: [], FN: [] };
            }
            stat_by_txt[err.text][err._judgement].push(uid);

            // update the doc stat
            if (!stat_by_doc.hasOwnProperty(err.file_hash)) {
                stat_by_doc[err.file_hash] = { FP: [], FN: [] };
            }
            stat_by_doc[err.file_hash][err._judgement].push(uid);
            
            // update the error stat if it has
            if (err.hasOwnProperty('errors')) {
                // ok, this has information
                ////////////////////////////////////////
                // stat by smu?
                ////////////////////////////////////////
                stat_by_smu.freq_n_err_labels[err.errors.length][err._judgement].push(uid);

                for (let i = 0; i < err.errors.length; i++) {
                    ////////////////////////////////////////
                    // stat by smu?
                    ////////////////////////////////////////
                    stat_by_smu.total_err_labels += 1;

                    const e = err.errors[i];
                    ////////////////////////////////////////
                    // stat by err
                    ////////////////////////////////////////
                    if (stat_by_err.hasOwnProperty(e.type)) {
                        // ok, no need to revise stat_by_err
                    } else {
                        // stat_by_err doesn't have this?
                        // just init it with an empty one
                        stat_by_err[e.type] = {
                            FP: [], 
                            FN: []
                        };
                    }
                    stat_by_err[e.type][err._judgement].push(uid);

                    ////////////////////////////////////////
                    // stat by relation
                    ////////////////////////////////////////
                    if (i > 0) {
                        // when counting the relationship
                        // just use the first label
                        continue;
                    }
                    // update the relationship
                    // col 1-2
                    if (!stat_by_rel.c_error[err._judgement].hasOwnProperty(e.category)) {
                        // init it as a list
                        stat_by_rel.c_error[err._judgement][e.category] = [];
                    }
                    stat_by_rel.c_error[err._judgement][e.category].push(uid);

                    // col 2-3
                    if (!stat_by_rel.c_category.hasOwnProperty(e.category)) {
                        // init it as a obj
                        stat_by_rel.c_category[e.category] = {};
                    }
                    if (!stat_by_rel.c_category[e.category].hasOwnProperty(e.type)) {
                        // init it as a list
                        stat_by_rel.c_category[e.category][e.type] = [];
                    }
                    stat_by_rel.c_category[e.category][e.type].push(uid);

                    // col 3-4
                    if (!stat_by_rel.c_type.hasOwnProperty(e.type)) {
                        // init it as a obj
                        stat_by_rel.c_type[e.type] = {};
                    }
                    if (!stat_by_rel.c_type[e.type].hasOwnProperty(err.tag)) {
                        // init it as a list
                        stat_by_rel.c_type[e.type][err.tag] = [];
                    }
                    stat_by_rel.c_type[e.type][err.tag].push(uid);

                }
            } else {
                // the freq update
                stat_by_smu.freq_n_err_labels[0][err._judgement].push(uid);

                // oh, this err doesn't have any information
                // just send to UNKNOWN
                stat_by_err['UNKNOWN'][err._judgement].push(uid);

                // update the relationship
                // col 1
                stat_by_rel.c_error[err._judgement].UNK.push(uid);
                // col 2
                stat_by_rel.c_category.UNK.UNKNOWN.push(uid);
                // col 3
                if (!stat_by_rel.c_type.UNKNOWN.hasOwnProperty(err.tag)) {
                    // init it as a list
                    stat_by_rel.c_type.UNKNOWN[err.tag] = [];
                }
                stat_by_rel.c_type.UNKNOWN[err.tag].push(uid);
            }
        }

        // get max values for dtd, start from 10
        var max_val = 10;
        for (let i = 0; i < dtd.etags.length; i++) {
            const etag = dtd.etags[i];
            var _max_val = stat_by_dtd[etag.name].FP.length + 
                stat_by_dtd[etag.name].FN.length;
            if (_max_val > max_val) {
                max_val = _max_val;
            }
        }
        // get the max value for err type
        for (const err_type in stat_by_err) {
            var _max_val = stat_by_err[err_type].FP.length + 
            stat_by_err[err_type].FN.length;
            if (_max_val > max_val) {
                max_val = _max_val;
            }
        }
        // also put this max_val into smu
        stat_by_smu['max_val'] = max_val;

        // get average doc err
        var doc_n_errs = Object.values(stat_by_doc).map(d=>d.FP.length + d.FN.length);
        // make sure math.js is imported
        var med_n_err_per_doc = math.median(doc_n_errs);
        // also put this into smu
        stat_by_smu['med_n_err_per_doc'] = med_n_err_per_doc;
        
        // build a ret object
        var ret = {
            by_iaa: stat_by_iaa,
            by_dtd: stat_by_dtd,
            by_err: stat_by_err,
            by_rel: stat_by_rel,
            by_txt: stat_by_txt,
            by_doc: stat_by_doc,
            by_smu: stat_by_smu,
        };

        return ret;
    },

    /**
     * Get the Sankey Diagram Data
     * 
     * @param {Object} stat_by_rel statistics on the relationship
     * @returns sankey data object
     */
    get_sankey_data: function(stat_by_rel) {
        var nodes = {};
        var links = [];

        // build col 1
        var cols = ['c_error', 'c_category', 'c_type'];
        for (let i = 0; i < cols.length; i++) {
            const col = cols[i];
            for (const nLeft in stat_by_rel[col]) {
                for (const nRight in stat_by_rel[col][nLeft]) {
                    var uids = stat_by_rel[col][nLeft][nRight];
                    var class_name = 'cursor-pointer';

                    if (nLeft == this.UNK_ERROR_CATE ||
                        nRight == this.UNK_ERROR_CATE) {
                        if (uids.length == 0) {

                            // no need to add UNK when there is no uid
                            continue;
                        }
                    }
                    
                    // update the link
                    links.push({
                        source: nLeft,
                        target: nRight,
                        value: uids.length,
                        uids: uids,
                        column: i,
                        class_name: class_name
                    });
    
                    // update the left node
                    if (!nodes.hasOwnProperty(nLeft)) {
                        var _cls = class_name;
                        if (col == 'c_error') {
                            _cls += ' razer-bg-' + nLeft;
                        }
                        // add this node
                        nodes[nLeft] = {
                            id: nLeft,
                            name: nLeft,
                            value: 0,
                            uids: [],
                            layer: i,
                            // style
                            class_name: _cls
                        }
                    }
                    // update node value
                    if (i <= 0) {
                        // no need to double add after first column
                        nodes[nLeft].value += uids.length;
                        nodes[nLeft].uids = nodes[nLeft].uids.concat(uids);
                    }
    
                    // update the right node
                    if (!nodes.hasOwnProperty(nRight)) {
                        // add this node
                        var _cls = class_name;
                        if (col=='c_type') {
                            _cls += ' svgmark-tag-' + nRight;
                        }
                        nodes[nRight] = {
                            id: nRight,
                            name: nRight,
                            value: 0,
                            uids: [],
                            layer: i + 1,
                            class_name: _cls
                        }
                    }
                    // update the right node
                    nodes[nRight].value += uids.length;
                    nodes[nRight].uids = nodes[nRight].uids.concat(uids);
                }
            }
        }
        
        // convert nodes to node list
        nodes = Object.values(nodes);

        var ret = {
            nodes: nodes,
            links: links,
        };

        return ret;
    },

    get_top_10_tokens: function(stat_by_txt) {
        // first, get the list of all txt
        var ns = [];
        var ts = [];
        for (const txt in stat_by_txt) {
            var s = stat_by_txt[txt];
            var n = s.FP.length + s.FN.length;
            ns[ns.length] = n;
            ts[ts.length] = txt;
        }
        // get top 10
        var rs = stat_helper.get_top_n(ns, 10);
        // export tokens
        var tokens = [];
        for (let i = 0; i < rs.length; i++) {
            const r = rs[i];
            // r is [val, index] format
            tokens.push(
                ts[r[1]]
            );
        }

        return tokens;
    },

    use_tews: function(url, req, callback) {
        $.ajax({
            type: 'POST',
            url: url,
            data: {
                data: JSON.stringify(req)
            },
            success: callback,
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(textStatus, errorThrown);
            }
        });
    },

    use_eaws: function(url, req, callback) {
        $.ajax({
            type: 'POST',
            url: url,
            data: {
                data: JSON.stringify(req)
            },
            success: callback,
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(textStatus, errorThrown);
            }
        });
    },

    use_eaws_q: function(url, req, callback) {
        $.ajaxQueue({
            type: 'POST',
            url: url,
            data: {
                data: JSON.stringify(req)
            },
            success: callback,
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(textStatus, errorThrown);
            }
        });
    },

    get_error_rate: function(tp, fp, fn) {
        var sum = tp + fp + fn;
        if (sum == 0) {
            return NaN;
        }
        return (fp + fn) / sum;
    },

    get_accuracy: function(tp, fp, fn) {
        var sum = tp + fp + fn;
        if (sum == 0) {
            return NaN;
        }
        return tp / sum;
    },

    get_razer_report_summary: function(razer, format) {
        if (typeof(format) == 'undefined') {
            format = 'json';
        }
        // FP, FN, ER, Acc, Pre, Rec, F1 ...
        var js = [];

        js.push({ 'item': 'TP', 'result': razer.err_stat.by_iaa.n_TP });
        js.push({ 'item': 'FP', 'result': razer.err_stat.by_iaa.n_FP });
        js.push({ 'item': 'FN', 'result': razer.err_stat.by_iaa.n_FN });
        js.push({ 'item': 'Error Rate', 'result': razer.err_stat.by_iaa.error_rate });
        js.push({ 'item': 'Accuracy', 'result': razer.err_stat.by_iaa.accuracy });
        js.push({ 'item': 'Precision', 'result': razer.err_stat.by_iaa.precision });
        js.push({ 'item': 'Recall', 'result': razer.err_stat.by_iaa.recall });
        js.push({ 'item': 'F1-Score', 'result': razer.err_stat.by_iaa.f1 });

        if (format == 'json' || format != 'excelws') {
            return js;
        }

        // ok, let's parse for excel
        var ws = XLSX.utils.json_to_sheet(js);
        return ws;
    },

    get_razer_report_stat_by_concept: function(razer, format) {
        if (typeof(format) == 'undefined') {
            format = 'json';
        }

        var js = [];
        for (const etag_name in razer.err_stat.by_dtd) {
            var stat = razer.err_stat.by_dtd[etag_name];
            js.push({
                'concept': etag_name,
                'FP': stat.FP.length,
                'FN': stat.FN.length,
            });
        }

        if (format == 'json' || format != 'excelws') {
            return js;
        }

        // ok, let's parse for excel
        var ws = XLSX.utils.json_to_sheet(js);
        return ws;
    },

    get_razer_report_stat_by_err_type: function(razer, razer_err_def, format) {
        if (typeof(format) == 'undefined') {
            format = 'json';
        }

        var js = [];
        for (const err_cate in razer_err_def) {
            js.push({
                'category': err_cate,
                'type': '',
                'FP': '',
                'FN': ''
            });
            for (let i = 0; i < razer_err_def[err_cate].length; i++) {
                const err_type = razer_err_def[err_cate][i];
                var FP = 0;
                var FN = 0;
                if (razer.err_stat.by_err.hasOwnProperty(err_type)) {
                    FP = razer.err_stat.by_err[err_type].FP.length;
                    FN = razer.err_stat.by_err[err_type].FN.length;
                }
                js.push({
                    'category': '',
                    'type': err_type,
                    'FP': FP,
                    'FN': FN
                });
            }
        }

        if (format == 'json' || format != 'excelws') {
            return js;
        }

        // ok, let's parse for excel
        var ws = XLSX.utils.json_to_sheet(js);
        return ws;
    },

    get_razer_report_tag_list: function(razer, format) {
        if (typeof(format) == 'undefined') {
            format = 'json';
        }

        var js = [];
        for (const uid in razer.err_dict) {
            var t = razer.err_dict[uid];

            var j = {
                uid: uid,
                'id': t.id,
                'spans': t.spans,
                'tag': t.tag,
                'text': t.text,
                'error': t._judgement,
                'file_name': t.file_name,
                'sentence_spans': t.sentence_spans,
                'sentence': t.sentence,
            };

            if (t.hasOwnProperty('errors')) {
                for (let k = 0; k < t.errors.length; k++) {
                    const e = t.errors[k];
                    j['label_'+(k+1)] = e.type;
                }
            }
            js.push(j);
        }

        if (format == 'json' || format != 'excelws') {
            return js;
        }

        // ok, let's parse for excel
        var ws = XLSX.utils.json_to_sheet(js);
        return ws;
    },

    get_stat_of_err_def: function(err_def) {
        if (err_def == null) {
            return {
                short_title: 'NA',
                n_cates: 0,
                n_types: 0
            };
        }
        var n_cates = Object.keys(err_def).length;
        var n_types = 0;

        var short_title = null;
        for (const c in err_def) {
            n_types += err_def[c].length;

            if (short_title == null) {
                short_title = c;
            }
        }
        if (short_title == null) {
            short_title = '';
        } else {
            short_title += ' and ' + (n_cates - 1) + ' more';
        }
        return {
            short_title: short_title,
            n_cates: n_cates,
            n_types: n_types
        };
    }
};